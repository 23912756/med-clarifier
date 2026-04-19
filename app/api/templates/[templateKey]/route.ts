import { NextResponse } from "next/server";
import { loadTemplate } from "@/lib/templates/loader";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ templateKey: string }> }
) {
  try {
    const { templateKey } = await ctx.params;
    const template = loadTemplate(templateKey);
    return NextResponse.json({ ok: true, template });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se encontro la plantilla" },
      { status: 404 }
    );
  }
}

