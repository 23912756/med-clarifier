import { NextResponse } from "next/server";
import { z } from "zod";
import { renderHtml } from "@/lib/pdf/renderHtml";
import { generatePdfFromHtml } from "@/lib/pdf/generatePdf";
import { calculateRecoveryProgress } from "@/lib/recovery/calculateRecoveryProgress";

export const runtime = "nodejs";

const baseSchema = z.object({
  patientName: z.string(),
  age: z.number(),
  diagnosis: z.string(),
  templateKey: z.string(),
  summary: z.string(),
  simpleExplanation: z.string(),
  medicationPlan: z
    .array(
      z.object({
        drugName: z.string().min(1),
        frequencyPerDay: z.number().int().min(1).max(6),
        durationDays: z.number().int().min(1).max(31)
      })
    )
    .optional(),
  trafficLight: z.object({
    green: z.array(z.string()),
    yellow: z.array(z.string()),
    red: z.array(z.string())
  }),
  recommendations: z.object({
    do: z.array(z.string()),
    avoid: z.array(z.string())
  }),
  timeline: z.array(
    z.object({
      period: z.string(),
      text: z.string()
    })
  )
});

const recoveryProfileSchema = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("time_based"),
      incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      estimatedRecoveryDays: z.number().int().positive(),
      overrideRecoveryDays: z.number().int().positive().optional(),
      milestones: z
        .array(
          z.object({
            startDay: z.number().int().min(0),
            endDay: z.number().int().min(0),
            title: z.string().min(1),
            description: z.string().min(1)
          })
        )
        .optional()
    }),
    z.object({
      kind: z.literal("chronic"),
      incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      title: z.string().min(1),
      description: z.string().min(1),
      reviewEveryDays: z.number().int().min(1).max(365).optional()
    }),
    z.object({
      kind: z.literal("episodic"),
      incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      title: z.string().min(1),
      description: z.string().min(1),
      typicalEpisodeDays: z.number().int().min(1).max(60).optional()
    })
  ])
  .optional();

// Back-compat: accept legacy incidentDate/estimatedRecoveryDays fields too.
const legacyRecoverySchema = z
  .object({
    incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    estimatedRecoveryDays: z.number().int().positive().optional(),
    overrideRecoveryDays: z.number().int().positive().optional(),
    milestones: z
      .array(
        z.object({
          startDay: z.number().int().min(0),
          endDay: z.number().int().min(0),
          title: z.string().min(1),
          description: z.string().min(1)
        })
      )
      .optional()
  })
  .optional();

const pdfRequestSchema = baseSchema
  .and(z.object({ recoveryProfile: recoveryProfileSchema }).partial())
  .and(legacyRecoverySchema ?? z.object({}));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = pdfRequestSchema.parse(body);

    let recovery: unknown = undefined;

    const rp = (parsed as any).recoveryProfile;
    if (rp?.kind === "time_based") {
      const totalDays = rp.overrideRecoveryDays ?? rp.estimatedRecoveryDays;
      recovery = calculateRecoveryProgress({
        incidentDate: rp.incidentDate,
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
    } else if (rp?.kind === "chronic" || rp?.kind === "episodic") {
      recovery = rp;
    } else {
      // Legacy: if incidentDate present assume time-based; otherwise omit block.
      const legacyIncident = (parsed as any).incidentDate;
      if (legacyIncident) {
        const totalDays =
          (parsed as any).overrideRecoveryDays ?? (parsed as any).estimatedRecoveryDays ?? 14;
        recovery = calculateRecoveryProgress({
          incidentDate: legacyIncident,
          estimatedRecoveryDays: totalDays,
          milestones:
            (parsed as any).milestones ?? [
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
      }
    }

    const html = renderHtml({ ...(parsed as any), recovery });
    const pdfBuffer = await generatePdfFromHtml(html);

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="ficha-paciente.pdf"'
      }
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo generar el PDF"
      },
      { status: 500 }
    );
  }
}