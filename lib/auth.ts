import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

/** Verifica se a senha enviada bate com a senha configurada no ambiente. */
export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("Variável ADMIN_PASSWORD não configurada.");
  return password === expected;
}

/** Confere se a requisição atual já está autenticada (cookie válido). */
export function isAuthenticated(): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const cookieValue = cookies().get(COOKIE_NAME)?.value;
  return cookieValue === expected;
}

export { COOKIE_NAME };
