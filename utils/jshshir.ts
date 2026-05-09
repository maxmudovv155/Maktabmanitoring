export function normalizeJshshirDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidJshshir(value: string): boolean {
  return normalizeJshshirDigits(value).length === 14;
}
