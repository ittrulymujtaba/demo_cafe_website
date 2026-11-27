// Server-side length checks for text the admin can type. The forms also set maxLength,
// but the server is the one that decides.
export function clip(value: string, max: number, label: string): string {
  if (value.length > max) {
    throw new Error(`${label} can be at most ${max} characters.`);
  }
  return value;
}
