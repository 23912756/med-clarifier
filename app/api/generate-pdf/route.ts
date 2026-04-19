import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizeText } from "@/lib/utils/normalize";
import { classifyDiagnosisWithAI } from "@/lib/ai/classifyDiagnosis";
import { generatePatientExplanation } from "@/lib/ai/generateExplanation";
import { loadTemplate } from "@/lib/templates/loader";
import { renderHtml } from "@/lib/pdf/renderHtml";
import { generatePdfFromHtml } from "@/lib/pdf/generatePdf";
import { calculateRecoveryProgress } from "@/lib/recovery/calculateRecoveryProgress";

const requestSchema = z.object({
  patientName: z.string().min(1),
  age: z.number().int().positive(),
  rawDiagnosis: z.string().min(3),
  language: z.string().optional(),
  doctorNotes: z.string().optional(),
  recoveryProfile: z.any().optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.parse(body);

    const originalDiagnosis = parsed.rawDiagnosis;
    const normalizedDiagnosis = normalizeText(originalDiagnosis);

    const interpretation = await classifyDiagnosisWithAI({
      age: parsed.age,
      diagnosis: normalizedDiagnosis
    });

    const template = (() => {
      try {
        return loadTemplate(interpretation.templateKey);
      } catch {
        return loadTemplate("generic_case");
      }
    })();

    const aiText = await generatePatientExplanation({
      diagnosis: originalDiagnosis,
      templateName: template.plainName,
      age: parsed.age
    });

    const generatedContent = {
      patientName: parsed.patientName,
      age: parsed.age,
      diagnosis: originalDiagnosis,
      normalizedDiagnosis,
      templateKey: template.templateKey,
      recoveryProfile: parsed.recoveryProfile ?? template.recoveryProfile,
      summary: aiText.summary,
      simpleExplanation: aiText.explanation,
      trafficLight: {
        green: template.normalSymptoms,
        yellow: template.watchSymptoms,
        red: template.alarmSymptoms
      },
      recommendations: {
        do: template.doList,
        avoid: template.avoidList
      },
      timeline: template.timeline
    };

    // If recoveryProfile is time_based and has incidentDate, compute recovery
    const rp = (generatedContent as any).recoveryProfile;
    const incidentDate = rp?.incidentDate;
    if (rp?.kind === "time_based" && incidentDate) {
      const totalDays = rp.overrideRecoveryDays ?? rp.estimatedRecoveryDays ?? 14;
      const recovery = calculateRecoveryProgress({
        incidentDate,
        estimatedRecoveryDays: totalDays,
        milestones:
          rp.milestones ?? [
            {
              startDay: 0,
              endDay: Math.min(3, totalDays),
              title: "Fase inicial",
              description: "molestias y limitacion inicial"
            },
            {
              startDay: Math.min(4, totalDays),
              endDay: Math.min(10, totalDays),
              title: "Mejoria progresiva",
              description: "reduccion gradual de molestias"
            },
            {
              startDay: Math.min(11, totalDays),
              endDay: totalDays,
              title: "Recuperacion funcional",
              description: "retorno progresivo a actividad segun tolerancia"
            }
          ]
      });
      (generatedContent as any).recovery = recovery;
    } else if (rp?.kind === "chronic" || rp?.kind === "episodic") {
      (generatedContent as any).recovery = rp;
    }

    const patientCase = await db.patientCase.create({
      data: {
        patientName: parsed.patientName,
        age: parsed.age,
        rawDiagnosis: originalDiagnosis,
        language: parsed.language ?? "es",
        doctorNotes: parsed.doctorNotes
      }
    });

    await db.diagnosisInterpretation.create({
      data: {
        caseId: patientCase.id,
        category: interpretation.category,
        subcategory: interpretation.subcategory,
        severity: interpretation.severity,
        bodyPart: interpretation.bodyPart,
        templateKey: interpretation.templateKey
      }
    });

    const html = renderHtml(generatedContent);

    await db.generatedDocument.create({
      data: {
        caseId: patientCase.id,
        structuredJson: JSON.stringify(generatedContent),
        html,
        status: "pdf_generated"
      }
    });

    const pdfBuffer = await generatePdfFromHtml(html);

    const safeName = parsed.patientName
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .toLowerCase();

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ficha-${safeName || "paciente"}.pdf"`
      }
    });
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Datos invalidos",
          details: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Error interno del servidor"
      },
      { status: 500 }
    );
  }
}