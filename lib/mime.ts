/**
 * Decide o Content-Type de cada arquivo pela extensão.
 *
 * Isso é o que faz a diferença entre "abrir como página" e "aparecer como
 * código": um .html é enviado como text/html (o navegador renderiza a
 * página); um .js ou .css enviado como text/html também renderizaria errado,
 * então cada tipo tem o content-type correto — o navegador então decide
 * sozinho o que fazer (rodar, mostrar, tocar ou baixar).
 */

const MIME_MAP: Record<string, string> = {
  // Web
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  svg: "image/svg+xml",
  webmanifest: "application/manifest+json",

  // Documentos
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  md: "text/plain; charset=utf-8",

  // Imagens
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  bmp: "image/bmp",
  avif: "image/avif",

  // Áudio / vídeo
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",

  // Fontes
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",

  // Compactados / binários -> baixam
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",

  // Código-fonte que o navegador NÃO executa sozinho: mostrado como texto
  // (é a única forma sensata de "abrir" isso fora do contexto de um build)
  ts: "text/plain; charset=utf-8",
  tsx: "text/plain; charset=utf-8",
  jsx: "text/plain; charset=utf-8",
  php: "text/plain; charset=utf-8",
  py: "text/plain; charset=utf-8",
  java: "text/plain; charset=utf-8",
  c: "text/plain; charset=utf-8",
  cpp: "text/plain; charset=utf-8",
  go: "text/plain; charset=utf-8",
  rs: "text/plain; charset=utf-8",
  rb: "text/plain; charset=utf-8",
  sql: "text/plain; charset=utf-8",
  yml: "text/plain; charset=utf-8",
  yaml: "text/plain; charset=utf-8",
  sh: "text/plain; charset=utf-8",
};

/** Extensões cujo conteúdo mostramos como texto mesmo fora do modo /raw/. */
export const CODE_LIKE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "jsx",
  "php",
  "py",
  "java",
  "c",
  "cpp",
  "go",
  "rs",
  "rb",
  "sql",
  "yml",
  "yaml",
  "sh",
  "txt",
  "md",
  "csv",
  "json",
  "css",
  "js",
  "mjs",
]);

export function extensionOf(path: string): string {
  const dot = path.lastIndexOf(".");
  if (dot === -1) return "";
  return path.slice(dot + 1).toLowerCase();
}

export function mimeTypeFor(path: string): string {
  const ext = extensionOf(path);
  return MIME_MAP[ext] || "application/octet-stream"; // desconhecido -> baixa
}
