const KEY = "outthegc_session";

export type Session = {
  tripId: string;
  memberId: string;
};

export function saveSession(s: Session) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function loadSession(): Session | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
