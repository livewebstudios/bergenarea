/** A town as shown anywhere on the site: "Paramus, NJ". Blank stays blank; a name already ending in NJ is left alone. */
export function townNJ(town: string): string {
  const t = town.trim();
  if (!t || /,?\s*NJ$/i.test(t)) return t;
  return `${t}, NJ`;
}
