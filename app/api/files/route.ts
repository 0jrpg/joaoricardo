import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listFiles, uploadFiles } from "@/lib/github-storage";

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const files = await listFiles();
    return NextResponse.json({ files });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const formData = await req.formData();
  // O front manda um campo "file" por arquivo e um "path" (mesmo índice)
  // com o caminho relativo (suporta pastas, ex: "site/css/estilo.css").
  const fileEntries = formData.getAll("file");
  const pathEntries = formData.getAll("path");

  if (fileEntries.length === 0) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  try {
    const files = await Promise.all(
      fileEntries.map(async (entry, i) => {
        const file = entry as File;
        const path = (pathEntries[i] as string) || file.name;
        const buffer = await file.arrayBuffer();
        return { path, buffer };
      })
    );

    await uploadFiles(files);
    return NextResponse.json({ ok: true, count: files.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
