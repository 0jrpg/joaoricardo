import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteFile } from "@/lib/github-storage";

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { path } = await req.json();
  if (!path) {
    return NextResponse.json({ error: "Caminho do arquivo não informado." }, { status: 400 });
  }

  try {
    await deleteFile(path);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
