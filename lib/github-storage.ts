/**
 * Toda a "persistência" dos arquivos é o próprio repositório do GitHub.
 * - Leitura pública: direto via raw.githubusercontent.com.
 * - Upload/exclusão: feitos aqui, no servidor (Next.js Route Handlers), usando
 *   um Personal Access Token do GitHub que NUNCA é exposto ao navegador.
 *
 * Diferente da versão só-PDF, aqui qualquer tipo de arquivo é aceito, e a
 * estrutura de pastas do repositório é preservada (ex: "site/index.html",
 * "site/css/estilo.css").
 */

const GITHUB_API = "https://api.github.com";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

function config() {
  return {
    token: env("GITHUB_TOKEN"),
    owner: env("GITHUB_OWNER"),
    repo: env("GITHUB_REPO"),
    branch: process.env.GITHUB_BRANCH || "main",
    // pasta raiz dentro do repo onde os arquivos ficam guardados, ex: "files"
    root: (process.env.GITHUB_FILES_PATH || "files").replace(/^\/|\/$/g, ""),
  };
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "generic-file-site-admin",
  };
}

export type StoredFile = {
  path: string; // caminho relativo dentro da pasta raiz, ex: "site/index.html"
  size: number;
  sha: string;
};

function rawUrl(owner: string, repo: string, branch: string, root: string, path: string) {
  const fullPath = `${root}/${path}`
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fullPath}`;
}

/** Lista recursivamente todos os arquivos guardados (usa a Git Trees API). */
export async function listFiles(): Promise<StoredFile[]> {
  const { token, owner, repo, branch, root } = config();
  const headers = githubHeaders(token);

  const refRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    headers,
    cache: "no-store",
  });
  if (!refRes.ok) return []; // repo/branch ainda sem nenhum commit relevante
  const ref = await refRes.json();

  const treeRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${ref.object.sha}?recursive=1`,
    { headers, cache: "no-store" }
  );
  if (!treeRes.ok) return [];
  const treeData = await treeRes.json();

  const prefix = `${root}/`;
  return (treeData.tree as Array<{ path: string; type: string; size?: number; sha: string }>)
    .filter((item) => item.type === "blob" && item.path.startsWith(prefix))
    .map((item) => ({
      path: item.path.slice(prefix.length),
      size: item.size ?? 0,
      sha: item.sha,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** Confere se um caminho específico existe entre os arquivos guardados. */
export async function findFile(path: string): Promise<StoredFile | null> {
  const all = await listFiles();
  return all.find((f) => f.path === path) ?? null;
}

/** URL pública (raw) de um arquivo, independente de ele existir ou não. */
export function publicUrlFor(path: string): string {
  const { owner, repo, branch, root } = config();
  return rawUrl(owner, repo, branch, root, path);
}

/**
 * Envia (cria ou substitui) UM arquivo no repositório usando a Git Data API,
 * que suporta arquivos grandes (bem mais que a Contents API simples).
 */
async function uploadOne(
  headers: Record<string, string>,
  owner: string,
  repo: string,
  filePath: string,
  buffer: ArrayBuffer
) {
  const base64Content = Buffer.from(buffer).toString("base64");
  const blobRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/blobs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content: base64Content, encoding: "base64" }),
  });
  if (!blobRes.ok) throw new Error(`Falha ao criar blob de "${filePath}": ${await blobRes.text()}`);
  const blob = await blobRes.json();
  return { path: filePath, mode: "100644" as const, type: "blob" as const, sha: blob.sha };
}

/**
 * Envia um ou mais arquivos de uma vez só (ex: pasta de um site inteiro),
 * criando um único commit para todos.
 */
export async function uploadFiles(files: { path: string; buffer: ArrayBuffer }[]) {
  if (files.length === 0) return;
  const { token, owner, repo, branch, root } = config();
  const headers = { ...githubHeaders(token), "Content-Type": "application/json" };

  const refRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    headers,
  });
  if (!refRes.ok) throw new Error(`Não achei a branch "${branch}": ${await refRes.text()}`);
  const ref = await refRes.json();
  const latestCommitSha = ref.object.sha;

  const commitRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, {
    headers,
  });
  const commit = await commitRes.json();
  const baseTreeSha = commit.tree.sha;

  const treeEntries = await Promise.all(
    files.map((f) => uploadOne(headers, owner, repo, `${root}/${f.path}`, f.buffer))
  );

  const treeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  });
  if (!treeRes.ok) throw new Error(`Falha ao criar tree: ${await treeRes.text()}`);
  const tree = await treeRes.json();

  const message =
    files.length === 1 ? `Adiciona/atualiza ${files[0].path}` : `Adiciona/atualiza ${files.length} arquivos`;

  const newCommitRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, tree: tree.sha, parents: [latestCommitSha] }),
  });
  if (!newCommitRes.ok) throw new Error(`Falha ao criar commit: ${await newCommitRes.text()}`);
  const newCommit = await newCommitRes.json();

  const updateRefRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  if (!updateRefRes.ok) throw new Error(`Falha ao atualizar branch: ${await updateRefRes.text()}`);
}

/** Apaga um arquivo do repositório pelo caminho relativo. */
export async function deleteFile(path: string) {
  const { token, owner, repo, branch, root } = config();
  const headers = { ...githubHeaders(token), "Content-Type": "application/json" };
  const filePath = `${root}/${path}`;
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");

  const fileRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`, {
    headers,
  });
  if (!fileRes.ok) throw new Error(`Arquivo não encontrado no GitHub: ${await fileRes.text()}`);
  const file = await fileRes.json();

  const delRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${encodedPath}`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ message: `Remove ${path}`, sha: file.sha, branch }),
  });
  if (!delRes.ok) throw new Error(`Falha ao apagar arquivo: ${await delRes.text()}`);
}
