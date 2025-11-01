// src/lib/auth.ts
export type Role = "user" | "contributor";
export type Session = {
  id: string;
  email: string;
  name?: string;
  role: Role;
  hasOnboarded?: boolean;
  tokenBalance?: number;     // VGT
  dataCredits?: number;      // DC
};

const KEY = "vigia.session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function setSession(s: Session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function signOut() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export async function signIn(email: string, _pwd: string) {
  // TODO: replace with real API
  const s: Session = {
    id: crypto.randomUUID(),
    email,
    role: "user",
    hasOnboarded: false,
    tokenBalance: 0,
    dataCredits: 0,
  };
  setSession(s);
  return s;
}
// add this helper
export function updateSession(patch: Partial<Session>): Session | null {
  const curr = getSession();
  if (!curr) return null;
  const next: Session = { ...curr, ...patch };
  setSession(next);
  return next;
}
export async function signUpContributor(name: string, email: string, _pwd: string) {
  const s: Session = {
    id: crypto.randomUUID(),
    email,
    name,
    role: "contributor",
    hasOnboarded: false,
    tokenBalance: 0,
    dataCredits: 0,
  };
  setSession(s);
  return s;
}