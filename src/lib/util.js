export function escape(src) {
  const res = src.replace(/`/g, '\\`').replace(/\$\{/g, '\\$\\{')
  return res
}

export function unescape(src) {
  const res = src.replace(/\\`/g, '`').replace(/\\\$\\\{/g, '${')
  return res
}
