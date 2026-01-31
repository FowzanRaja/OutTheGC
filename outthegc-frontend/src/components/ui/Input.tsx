export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm outline-none focus:border-indigo-500 ${props.className ?? ""}`} />;
}
