"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function DoctorHome() {
  const [caseId, setCaseId] = useState("");

  return (
    <div className="min-h-full clarifier-bg bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <header className="mb-8 flex items-center gap-4 rounded-2xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
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
            <h1 className="text-2xl font-semibold tracking-tight">Clarifier</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Panel del medico: crear ficha o consultar por ID.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold">Crear diagnostico</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Selecciona una enfermedad, ajusta el texto y genera el PDF.
            </p>
            <Link
              className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              href="/doctor/diagnostico"
            >
              Crear ficha
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold">Consultar por ID</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Abre un caso guardado en la base de datos.
            </p>
            <div className="mt-4 flex gap-2">
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="caseId (cuid)"
              />
              <Link
                className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ${
                  caseId.trim()
                    ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white"
                    : "bg-zinc-200 text-zinc-500 pointer-events-none"
                }`}
                href={`/doctor/caso/${encodeURIComponent(caseId.trim() || "x")}`}
              >
                Abrir
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200/70 bg-white/70 p-6 text-sm text-zinc-600 shadow-sm backdrop-blur">
          Consejo: si quieres que al confirmar se guarde el caso y luego puedas
          consultarlo por ID, usa el flujo de guardado (lo añadimos ahora).
        </div>
      </div>
    </div>
  );
}

