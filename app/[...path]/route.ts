import { NextRequest, NextResponse } from "next/server";
import { findFile, publicUrlFor } from "@/lib/github-storage";
import { mimeTypeFor } from "@/lib/mime";
import { sniffMimeType } from "@/lib/sniff";

export const dynamic = "force-dynamic";

function notFoundResponse() {
  return new NextResponse(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
      <title>404</title>
      <style>
        body{height:100vh;margin:0;display:flex;align-items:center;justify-content:center;
             flex-direction:column;gap:8px;font-family:sans-serif;background:#0f1115;color:#e7e9ee}
      </style></head>
      <body><h1>404</h1><p>Arquivo não encontrado.</p></body></html>`,
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  let segments = params.path;

  // /raw/qualquer/coisa.ext -> força mostrar como texto puro (código-fonte)
  const isRaw = segments[0] === "raw";
  if (isRaw) segments = segments.slice(1);

  const filePath = segments.map(decodeURIComponent).join("/");
  if (!filePath) return notFoundResponse();

  const file = await findFile(filePath);
  if (!file) return notFoundResponse();

  const upstream = await fetch(publicUrlFor(filePath), { cache: "no-store" });
  if (!upstream.ok) return notFoundResponse();

  // Baixa os bytes (precisamos deles pra "sniffar" o tipo real do arquivo,
  // ignorando o que a extensão do nome sugere).
  const buffer = await upstream.arrayBuffer();

  let contentType: string;
  if (isRaw) {
    contentType = "text/plain; charset=utf-8";
  } else {
    // Prioridade: assinatura real dos bytes > extensão do nome > genérico.
    contentType = sniffMimeType(buffer) || mimeTypeFor(filePath);
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
