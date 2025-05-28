export function Input({ type = 'text', ...props }) {
  return <input type={type} {...props} className="border px-3 py-2 w-full rounded" />;
}