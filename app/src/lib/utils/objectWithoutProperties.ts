export function objectWithoutProperties<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  return Object.entries(obj)
    .filter(([key]) => !keys.includes(key as K))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}) as Omit<T, K>;
}
