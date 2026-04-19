import puppeteer from "puppeteer";
import { existsSync } from "node:fs";
import { platform } from "node:os";

function getWindowsChromeCandidates() {
  return [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean) as string[];
}

export async function generatePdfFromHtml(html: string) {
  const args = [
    // These flags are mostly for Linux/container environments, but harmless elsewhere.
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage"
  ];

  const isWindows = platform() === "win32";
  const candidates = isWindows
    ? [
        ...getWindowsChromeCandidates(),
        // Keep puppeteer's bundled Chrome as a last resort on Windows, since
        // Windows App Control / WDAC may block unsigned downloaded binaries.
        puppeteer.executablePath()
      ]
    : [process.env.PUPPETEER_EXECUTABLE_PATH, puppeteer.executablePath()].filter(
        Boolean
      );

  let lastError: unknown = null;
  for (const executablePath of candidates) {
    if (!executablePath || !existsSync(executablePath)) continue;
    try {
      const browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args
      });

      try {
        const page = await browser.newPage();
        await page.setContent(html, {
          waitUntil: "networkidle0"
        });

        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm"
          }
        });

        return pdfBuffer;
      } finally {
        await browser.close();
      }
    } catch (err) {
      lastError = err;
      // Try next candidate path.
    }
  }

  const hint = isWindows
    ? "En Windows, este error suele ser porque 'Control de aplicaciones' (WDAC / Smart App Control) bloquea el Chrome descargado por Puppeteer. Solucion: usa Chrome/Edge instalado en el sistema configurando PUPPETEER_EXECUTABLE_PATH."
    : "No se pudo lanzar Chromium/Chrome para generar el PDF.";

  throw new Error(`${hint} Detalle: ${String((lastError as any)?.message ?? lastError)}`);

}