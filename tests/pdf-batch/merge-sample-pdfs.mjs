import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, "output");
const MERGED_NAME =
  process.env.MERGED_PDF_NAME || "00-ALL-TEST-PDFS-PRINT-READY.pdf";
const INCLUDE_BLANK_PAGE_BETWEEN = process.env.BLANK_PAGE_BETWEEN === "1";

async function listPdfFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.toLowerCase().endsWith(".pdf") &&
        entry.name !== MERGED_NAME
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en"));
}

async function mergePdfs() {
  const files = await listPdfFiles(OUTPUT_DIR);
  if (files.length === 0) {
    throw new Error(
      `No se encontraron PDFs en ${OUTPUT_DIR}. Ejecuta antes generate-sample-pdfs.mjs`
    );
  }

  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i += 1) {
    const fileName = files[i];
    const filePath = path.join(OUTPUT_DIR, fileName);
    const bytes = await readFile(filePath);
    const srcDoc = await PDFDocument.load(bytes);
    const copiedPages = await merged.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => merged.addPage(page));

    const isLast = i === files.length - 1;
    if (!isLast && INCLUDE_BLANK_PAGE_BETWEEN) {
      const lastAdded = copiedPages[copiedPages.length - 1];
      const { width, height } = lastAdded.getSize();
      merged.addPage([width, height]);
    }
  }

  const outBytes = await merged.save();
  const outPath = path.join(OUTPUT_DIR, MERGED_NAME);
  await writeFile(outPath, outBytes);

  console.log(`PDFs incluidos: ${files.length}`);
  console.log(`Archivo generado: ${outPath}`);
  if (INCLUDE_BLANK_PAGE_BETWEEN) {
    console.log("Modo: con pagina en blanco entre PDFs (BLANK_PAGE_BETWEEN=1)");
  }
}

mergePdfs().catch((err) => {
  console.error(err);
  process.exit(1);
});
