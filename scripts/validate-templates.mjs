import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const ROOT = path.join(process.cwd(), "data", "templates");

const timelineItemSchema = z.object({
  period: z.string().min(1),
  text: z.string().min(1),
});

const clinicalTemplateSchema = z.object({
  templateKey: z.string().min(1),
  category: z.string().min(1),
  plainName: z.string().min(1),
  normalSymptoms: z.array(z.string().min(1)).min(2),
  watchSymptoms: z.array(z.string().min(1)).min(2),
  alarmSymptoms: z.array(z.string().min(1)).min(2),
  doList: z.array(z.string().min(1)).min(2),
  avoidList: z.array(z.string().min(1)).min(2),
  timeline: z.array(timelineItemSchema).min(2),
  estimatedRecoveryDays: z.number().int().positive().optional(),
  milestones: z
    .array(
      z.object({
        startDay: z.number().int().min(0),
        endDay: z.number().int().min(0),
        title: z.string().min(1),
        description: z.string().min(1),
      })
    )
    .optional(),
  recoveryProfile: z
    .discriminatedUnion("kind", [
      z.object({
        kind: z.literal("time_based"),
        estimatedRecoveryDays: z.number().int().positive(),
        milestones: z.array(
          z.object({
            startDay: z.number().int().min(0),
            endDay: z.number().int().min(0),
            title: z.string().min(1),
            description: z.string().min(1),
          })
        ),
      }),
      z.object({
        kind: z.literal("chronic"),
        title: z.string().min(1),
        description: z.string().min(1),
        reviewEveryDays: z.number().int().min(1).max(365).optional(),
      }),
      z.object({
        kind: z.literal("episodic"),
        title: z.string().min(1),
        description: z.string().min(1),
        typicalEpisodeDays: z.number().int().min(1).max(60).optional(),
      }),
    ])
    .optional(),
});

function walkJsonFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsonFiles(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) out.push(full);
  }
  return out;
}

function collectAllStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectAllStrings(v, out);
  else if (value && typeof value === "object")
    for (const v of Object.values(value)) collectAllStrings(v, out);
  return out;
}

function hasAccentsOrSpecialSpanishChars(s) {
  return /[áéíóúÁÉÍÓÚñÑüÜ]/.test(s);
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error(`No existe: ${ROOT}`);
    process.exit(1);
  }

  const files = walkJsonFiles(ROOT);
  if (files.length === 0) {
    console.error("No se encontraron plantillas JSON en data/templates.");
    process.exit(1);
  }

  const errors = [];

  for (const filePath of files) {
    const rel = path.relative(process.cwd(), filePath).replaceAll("\\", "/");
    const categoryFolder = path.basename(path.dirname(filePath));
    const filenameKey = path.basename(filePath, ".json");

    let json;
    try {
      json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
      errors.push(`${rel}: JSON invalido (${String(e)})`);
      continue;
    }

    const parsed = clinicalTemplateSchema.safeParse(json);
    if (!parsed.success) {
      errors.push(`${rel}: no cumple schema (${parsed.error.issues.map((i) => i.path.join(".")).join(", ")})`);
      continue;
    }

    const tpl = parsed.data;

    if (tpl.templateKey !== filenameKey) {
      errors.push(`${rel}: templateKey="${tpl.templateKey}" no coincide con nombre de archivo "${filenameKey}"`);
    }

    if (tpl.category !== categoryFolder) {
      errors.push(`${rel}: category="${tpl.category}" no coincide con carpeta "${categoryFolder}"`);
    }

    const strings = collectAllStrings(tpl);
    for (const s of strings) {
      if (hasAccentsOrSpecialSpanishChars(s)) {
        errors.push(`${rel}: contiene tildes/ñ/ü en texto: "${s}"`);
        break;
      }
    }
  }

  if (errors.length) {
    for (const e of errors) console.error(e);
    process.exit(1);
  }

  console.log(`OK: ${files.length} plantillas validadas.`);
}

main();

