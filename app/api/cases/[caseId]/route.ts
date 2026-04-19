import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await ctx.params;

  const patientCase = await db.patientCase.findUnique({
    where: { id: caseId },
    include: { document: true },
  });

  if (!patientCase || !patientCase.document) {
    return NextResponse.json(
      { ok: false, error: "Caso no encontrado" },
      { status: 404 }
    );
  }

  let structured: unknown = null;
  try {
    structured = JSON.parse(patientCase.document.structuredJson);
  } catch {
    structured = null;
  }

  return NextResponse.json({
    ok: true,
    case: {
      id: patientCase.id,
      patientName: patientCase.patientName,
      age: patientCase.age,
      rawDiagnosis: patientCase.rawDiagnosis,
      createdAt: patientCase.createdAt,
    },
    document: {
      status: patientCase.document.status,
      data: structured,
    },
  });
}

