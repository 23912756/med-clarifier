import fs from "fs";
import path from "path";
import { ClinicalTemplate } from "@/types/template";

const TEMPLATES_ROOT = path.join(process.cwd(), "data", "templates");

function walkJsonFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkJsonFiles(full));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      out.push(full);
    }
  }

  return out;
}

function findTemplatePath(templateKey: string): string | null {
  const expectedFile = `${templateKey}.json`.toLowerCase();
  const all = walkJsonFiles(TEMPLATES_ROOT);
  const match = all.find(
    (p) => path.basename(p).toLowerCase() === expectedFile
  );
  return match ?? null;
}

export function loadTemplate(templateKey: string): ClinicalTemplate {
  const fullPath = findTemplatePath(templateKey);
  if (!fullPath) {
    throw new Error(
      `No se encontro el archivo JSON para templateKey: ${templateKey}`
    );
  }
  const fileContent = fs.readFileSync(fullPath, "utf-8");

  return JSON.parse(fileContent) as ClinicalTemplate;
}