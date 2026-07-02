/**
 * "Sniffing": olha os primeiros bytes do arquivo (assinatura/magic number)
 * pra descobrir o tipo real, independente do nome/extensão.
 *
 * Cobre os formatos binários mais comuns. Formatos baseados em texto (html,
 * css, js, json, csv, código-fonte em geral) não têm assinatura confiável,
 * então continuam sendo decididos pela extensão (ver lib/mime.ts).
 */

type Signature = {
  mime: string;
  match: (bytes: Uint8Array) => boolean;
};

function bytesEqual(bytes: Uint8Array, offset: number, expected: number[]): boolean {
  if (bytes.length < offset + expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (bytes[offset + i] !== expected[i]) return false;
  }
  return true;
}

function asciiAt(bytes: Uint8Array, offset: number, text: string): boolean {
  return bytesEqual(
    bytes,
    offset,
    Array.from(text).map((c) => c.charCodeAt(0))
  );
}

const SIGNATURES: Signature[] = [
  { mime: "image/png", match: (b) => bytesEqual(b, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { mime: "image/jpeg", match: (b) => bytesEqual(b, 0, [0xff, 0xd8, 0xff]) },
  { mime: "image/gif", match: (b) => asciiAt(b, 0, "GIF8") },
  { mime: "image/webp", match: (b) => asciiAt(b, 0, "RIFF") && asciiAt(b, 8, "WEBP") },
  { mime: "image/bmp", match: (b) => asciiAt(b, 0, "BM") },
  { mime: "image/x-icon", match: (b) => bytesEqual(b, 0, [0x00, 0x00, 0x01, 0x00]) },
  { mime: "application/pdf", match: (b) => asciiAt(b, 0, "%PDF") },
  { mime: "audio/wav", match: (b) => asciiAt(b, 0, "RIFF") && asciiAt(b, 8, "WAVE") },
  { mime: "audio/ogg", match: (b) => asciiAt(b, 0, "OggS") },
  { mime: "audio/mpeg", match: (b) => asciiAt(b, 0, "ID3") || bytesEqual(b, 0, [0xff, 0xfb]) || bytesEqual(b, 0, [0xff, 0xf3]) || bytesEqual(b, 0, [0xff, 0xf2]) },
  { mime: "video/webm", match: (b) => bytesEqual(b, 0, [0x1a, 0x45, 0xdf, 0xa3]) },
  { mime: "video/mp4", match: (b) => asciiAt(b, 4, "ftyp") },
  { mime: "font/woff", match: (b) => asciiAt(b, 0, "wOFF") },
  { mime: "font/woff2", match: (b) => asciiAt(b, 0, "wOF2") },
  { mime: "font/ttf", match: (b) => bytesEqual(b, 0, [0x00, 0x01, 0x00, 0x00]) || asciiAt(b, 0, "true") },
  { mime: "font/otf", match: (b) => asciiAt(b, 0, "OTTO") },
  { mime: "application/gzip", match: (b) => bytesEqual(b, 0, [0x1f, 0x8b]) },
  { mime: "application/x-7z-compressed", match: (b) => bytesEqual(b, 0, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]) },
  { mime: "application/vnd.rar", match: (b) => asciiAt(b, 0, "Rar!") },
  // ZIP também cobre docx/xlsx/pptx/apk/jar, mas "application/zip" é um bom
  // denominador comum (o navegador vai baixar, o que está correto pra esses).
  { mime: "application/zip", match: (b) => bytesEqual(b, 0, [0x50, 0x4b, 0x03, 0x04]) || bytesEqual(b, 0, [0x50, 0x4b, 0x05, 0x06]) || bytesEqual(b, 0, [0x50, 0x4b, 0x07, 0x08]) },
];

/** Retorna o mime type real pelos bytes, ou null se não reconheceu (provável texto). */
export function sniffMimeType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer.slice(0, 32));
  for (const sig of SIGNATURES) {
    if (sig.match(bytes)) return sig.mime;
  }
  return null;
}
