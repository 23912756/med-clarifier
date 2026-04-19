"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ApiResponse =
  | { ok: false; error: string }
  | {
      ok: true;
      case: { id: string; patientName: string; age: number; rawDiagnosis: string };
      document: { status: string; data: any };
    };

export default function CasePage({ params }: { params: { caseId: string } }) {
  const caseId = params.caseId;
  const [data, setData] = useState<ApiResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData({ ok: false, error: "Error cargando caso" });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const payload = useMemo(() => {
    if (!data || !data.ok) return null;
    return data.document.data;
  }, [data]);

  async function previewPdf() {
    if (!payload) return;
    setBusy("Generando PDF...");
    setError(null);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generando PDF");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    if (!payload) return;
    setBusy("Descargando PDF...");
    setError(null);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safe = String(payload.patientName || "paciente")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-_]/g, "")
        .toLowerCase();
      a.download = `ficha-${safe || "paciente"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error descargando PDF");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-full clarifier-bg bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-zinc-200/70 bg-white/70 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
              <Image
                src="/clarifier-mark.svg"
                alt="Clarifier"
                width={34}
                height={34}
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Caso</h1>
              <p className="mt-1 text-sm text-zinc-600">
                ID: <span className="font-mono">{caseId}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/doctor"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm"
            >
              Volver
            </Link>
            <button
              type="button"
              onClick={previewPdf}
              disabled={!payload || !!busy}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            >
              Previsualizar PDF
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={!payload || !!busy}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            >
              Descargar PDF
            </button>
          </div>
        </header>

        {!data ? (
          <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur">
            Cargando...
          </div>
        ) : !data.ok ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 shadow-sm">
            {data.error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur">
              <h2 className="text-sm font-semibold">Resumen del caso</h2>
              <div className="mt-3 text-sm text-zinc-700">
                <div>
                  <span className="font-medium">Paciente:</span>{" "}
                  {data.case.patientName}
                </div>
                <div>
                  <span className="font-medium">Edad:</span> {data.case.age}
                </div>
                <div>
                  <span className="font-medium">Diagnostico:</span>{" "}
                  {data.case.rawDiagnosis}
                </div>
                <div>
                  <span className="font-medium">Estado:</span>{" "}
                  {data.document.status}
                </div>
              </div>

              {busy ? (
                <div className="mt-4 text-sm text-zinc-600">{busy}</div>
              ) : null}
              {error ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur">
              <h2 className="text-sm font-semibold">Previsualizacion</h2>
              {pdfUrl ? (
                <iframe
                  title="pdf-preview"
                  className="mt-4 h-[75vh] w-full rounded-2xl border border-zinc-200 bg-white shadow-sm"
                  src={pdfUrl}
                />
              ) : (
                <div className="mt-4 flex h-[75vh] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/40 text-sm text-zinc-600">
                  Sin previsualizacion aun.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

