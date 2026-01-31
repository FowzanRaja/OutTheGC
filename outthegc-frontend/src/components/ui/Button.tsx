export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"secondary"|"danger" }) {
  const { variant="primary", className="", ...rest } = props;
  const base = "px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary" ? "bg-indigo-500 hover:bg-indigo-400 text-white" :
    variant === "secondary" ? "bg-slate-800 hover:bg-slate-700 text-slate-100" :
    "bg-rose-600 hover:bg-rose-500 text-white";
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
}
