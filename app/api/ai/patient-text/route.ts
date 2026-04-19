import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePatientExplanation } from "@/lib/ai/generateExplanation";
import { loadTemplate } from "@/lib/templates/loader";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  age: z.number().int().min(0).max(120),
  diagnosis: z.string().min(1),
  templateKey: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.parse(body);

    const template = loadTemplate(parsed.templateKey);

    const ai = await generatePatientExplanation({
      age: parsed.age,
      diagnosis: parsed.diagnosis,
      templateName: template.plainName
    });

    return NextResponse.json({
      ok: true,
      summary: String(ai.summary ?? "").trim(),
      explanation: String(ai.explanation ?? "").trim(),
      recommendationsDo: Array.isArray((ai as any).recommendationsDo)
        ? (ai as any).recommendationsDo.map((x: unknown) => String(x).trim()).filter(Boolean)
        : [],
      recommendationsAvoid: Array.isArray((ai as any).recommendationsAvoid)
        ? (ai as any).recommendationsAvoid.map((x: unknown) => String(x).trim()).filter(Boolean)
        : [],
      trafficGreen: Array.isArray((ai as any).trafficGreen)
        ? (ai as any).trafficGreen.map((x: unknown) => String(x).trim()).filter(Boolean)
        : [],
      trafficYellow: Array.isArray((ai as any).trafficYellow)
        ? (ai as any).trafficYellow.map((x: unknown) => String(x).trim()).filter(Boolean)
        : [],
      trafficRed: Array.isArray((ai as any).trafficRed)
        ? (ai as any).trafficRed.map((x: unknown) => String(x).trim()).filter(Boolean)
        : []
    });
  } catch (e) {
    console.error(e);
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Datos invalidos", details: e.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "No se pudo generar el texto" },
      { status: 500 }
    );
  }
}

