/** Short, dependency-free unique id generator (not cryptographically secure — fine for UI keys/filenames). */
export function generateId(prefix = ""): string {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return prefix ? `${prefix}_${time}${random}` : `${time}${random}`;
}
