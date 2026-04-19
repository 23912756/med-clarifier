import fs from "node:fs";
import path from "node:path";

export type TemplateIndexItem = {
  templateKey: string;
  category: string;
  plainName: string;
};

const ROOT = path.join(process.cwd(), "data", "templates");

function walkJsonFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsonFiles(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) out.push(full);
  }
  return out;
}

export function listTemplates(): TemplateIndexItem[] {
  if (!fs.existsSync(ROOT)) return [];

  const files = walkJsonFiles(ROOT);
  const items: TemplateIndexItem[] = [];

  for (const filePath of files) {
    const templateKey = path.basename(filePath, ".json");
    const category = path.basename(path.dirname(filePath));
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const json = JSON.parse(raw) as { plainName?: string };
      if (!json.plainName) continue;
      items.push({
        templateKey,
        category,
        plainName: json.plainName
      });
    } catch {
      // ignore invalid JSON in index listing
    }
  }

  items.sort((a, b) =>
    `${a.category}-${a.plainName}`.localeCompare(`${b.category}-${b.plainName}`)
  );
  return items;
}

