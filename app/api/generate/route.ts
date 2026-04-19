import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { loadTemplate } from "@/lib/templates/loader";
import { normalizeText } from "@/lib/utils/normalize";
import { classifyDiagnosisWithAI } from "@/lib/ai/classifyDiagnosis";
import { generatePatientExplanation } from "@/lib/ai/generateExplanation";


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

    await db.generatedDocument.create({
      data: {
        caseId: patientCase.id,
        structuredJson: JSON.stringify(generatedContent),
        status: "draft"
      }
    });

    return NextResponse.json({
      ok: true,
      caseId: patientCase.id,
      interpretation,
      data: generatedContent
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