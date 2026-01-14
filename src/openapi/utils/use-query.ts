import { useMemo, useRef, useState } from "react";

export function useQuery<I extends unknown[], T>(
  fn: (...input: I) => Promise<T>,
  initialData?: T,
): {
  start: (...input: I) => void;
  reset: () => void;
  setData: (data: T | undefined) => void;
  data?: T;
  error?: unknown;
  isLoading: boolean;
} {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<T>();
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useMemo(
    () => ({
      isLoading: loading,
      data,
      error,
      setData,
      start(...input) {
        setLoading(true);

        void fnRef
          .current(...input)
          .then((res) => {
            setData(res);
            setError(undefined);
          })
          .catch((err) => {
            setData(undefined);
            setError(err);
          })
          .finally(() => {
            setLoading(false);
          });
      },
      reset() {
        setData(undefined);
        setError(undefined);
        setLoading(false);
      },
    }),
    [error, data, loading],
  );
}
