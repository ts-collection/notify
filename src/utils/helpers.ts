export function deriveLabel(
  promiseOrFn: Promise<unknown> | (() => Promise<unknown>),
): string {
  if (typeof promiseOrFn === 'function') {
    const name = promiseOrFn.name;
    if (name) return `${name}: `;
  }
  return '';
}
