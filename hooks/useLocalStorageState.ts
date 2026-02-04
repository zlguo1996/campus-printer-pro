import { useEffect, useState } from 'react';

type UseLocalStorageOptions<T> = {
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T | null;
};

const useLocalStorageState = <T,>(
  key: string,
  getInitialValue: () => T,
  options: UseLocalStorageOptions<T> = {}
) => {
  const { serialize, deserialize } = options;

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return getInitialValue();
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        const parsed = deserialize ? deserialize(raw) : (JSON.parse(raw) as T);
        if (parsed != null) return parsed;
      }
    } catch {
      // Ignore localStorage/JSON errors and fall back to default
    }
    return getInitialValue();
  });

  useEffect(() => {
    try {
      const raw = serialize ? serialize(value) : JSON.stringify(value);
      window.localStorage.setItem(key, raw);
    } catch (err) {
      console.warn('Failed to persist to localStorage:', err);
    }
  }, [key, serialize, value]);

  return [value, setValue] as const;
};

export default useLocalStorageState;
