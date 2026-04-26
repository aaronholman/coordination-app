export function formatEnumLabel(value: string): string {
  const normalized = value.replace(/_/g, " ");
  if (!normalized) {
    return normalized;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
