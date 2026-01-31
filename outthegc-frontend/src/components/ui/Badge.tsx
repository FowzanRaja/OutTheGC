export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-200">{children}</span>;
}
