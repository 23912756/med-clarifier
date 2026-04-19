import { NextResponse } from "next/server";
import { z } from "zod";
import { loadTemplate } from "@/lib/templates/loader";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  templateKey: z.string().min(1),
  age: z.number().int().min(0).max(120).optional(),
  diagnosis: z.string().optional()
});

function uniqueTop(items: string[], max: number) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of items) {
    const v = x.trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

function suggestionsFor(templateKey: string, category: string) {
  const k = templateKey.toLowerCase();

  // template-specific
  if (k.includes("acute_bronchitis") || k.includes("post_viral_cough")) {
    return ["paracetamol", "ibuprofeno", "ambroxol", "dextrometorfano", "loratadina"];
  }
  if (k.includes("reflux") || k.includes("reflujo")) {
    return ["omeprazol", "pantoprazol", "alginate", "antiacido (hidroxido de aluminio/magnesio)", "famotidina"];
  }
  if (k.includes("acute_gastroenteritis") || k.includes("vomiting") || k.includes("diarrhea")) {
    return ["paracetamol", "ondansetron", "metoclopramida", "loperamida", "racecadotrilo"];
  }
  if (k.includes("cystitis") || k.includes("urinary")) {
    return ["paracetamol", "ibuprofeno", "fosfomicina", "nitrofurantoina", "fenazopiridina"];
  }
  if (k.includes("sprain") || k.includes("contusion") || k.includes("tendin")) {
    return ["paracetamol", "ibuprofeno", "naproxeno", "diclofenaco", "metamizol"];
  }
  if (k.includes("migraine") || k.includes("headache")) {
    return ["paracetamol", "ibuprofeno", "naproxeno", "sumatriptan", "ondansetron"];
  }

  // category fallback
  switch ((category || "").toLowerCase()) {
    case "traumatology":
    case "rehabilitation":
      return ["paracetamol", "ibuprofeno", "naproxeno", "diclofenaco", "metamizol"];
    case "respiratory":
    case "ent":
      return ["paracetamol", "ibuprofeno", "dextrometorfano", "loratadina", "cetirizina"];
    case "gastroenterology":
      return ["paracetamol", "ondansetron", "metoclopramida", "loperamida", "omeprazol"];
    case "dermatology":
      return ["cetirizina", "loratadina", "hidrocortisona topica", "clotrimazol topico", "mupirocina topica"];
    case "ophthalmology":
      return ["lagrimas artificiales", "diclofenaco colirio", "tobramicina colirio", "eritromicina pomada", "olopatadina colirio"];
    default:
      return ["paracetamol", "ibuprofeno", "naproxeno", "omeprazol", "loratadina"];
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.parse(body);
    const tpl = loadTemplate(parsed.templateKey);

    const suggestions = uniqueTop(
      suggestionsFor(tpl.templateKey, tpl.category),
      5
    );

    return NextResponse.json({
      ok: true,
      suggestions,
      note:
        "Sugerencias generales para facilitar la seleccion. No sustituyen la prescripcion del medico."
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
      { ok: false, error: "No se pudieron cargar sugerencias" },
      { status: 500 }
    );
  }
}

