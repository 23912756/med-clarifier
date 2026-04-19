import { NextResponse } from "next/server";
import { listTemplates } from "@/lib/templates";

export const dynamic = "force-dynamic";

export async function GET() {
  const templates = listTemplates();
  return NextResponse.json({ ok: true, templates });
}

