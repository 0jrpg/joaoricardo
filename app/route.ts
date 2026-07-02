import { NextResponse } from "next/server";

// A página inicial não mostra nada de "site" — devolve um XML cru de
// AccessDenied, igual ao erro clássico de bucket S3. O visual de
// "This XML file does not appear to have any style information..." é
// desenhado automaticamente pelo próprio navegador quando o Content-Type é
// application/xml; não precisamos (nem devemos) recriar esse HTML/CSS.
export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>`;

  return new NextResponse(xml, {
    status: 403,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
