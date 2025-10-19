export function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) =>
    new Promise<ReturnType<T>>((resolve) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => resolve(fn(...args)), delay);
    });
}
