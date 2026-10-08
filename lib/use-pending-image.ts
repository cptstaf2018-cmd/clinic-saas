"use client";

import { useCallback, useEffect, useState } from "react";

/** A picture chosen but not yet uploaded, with a preview URL that is released when replaced. */
export function usePendingImage() {
  const [state, setState] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    const url = state?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [state]);

  const choose = useCallback((file: File | null) => {
    setState(file ? { file, url: URL.createObjectURL(file) } : null);
  }, []);

  return { file: state?.file ?? null, previewUrl: state?.url ?? null, choose };
}
