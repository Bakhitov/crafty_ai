"use client";

import React from "react";

type Props = {
  base64?: string;
  uint8Array?: Uint8Array;
  mediaType?: string;
  alt?: string;
  className?: string;
};

export function AIImage({ base64, uint8Array, mediaType, alt, className }: Props) {
  const src = React.useMemo(() => {
    if (typeof base64 === "string" && base64.length > 0) {
      if (base64.startsWith("data:")) return base64;
      const mt = mediaType || "image/png";
      return `data:${mt};base64,${base64}`;
    }
    if (uint8Array && typeof window !== "undefined") {
      try {
        // Create ArrayBuffer copy to satisfy DOM BlobPart typing
        const ab = new ArrayBuffer(uint8Array.byteLength);
        const view = new Uint8Array(ab);
        view.set(uint8Array);
        const blob = new Blob([ab], { type: mediaType || "image/png" });
        return URL.createObjectURL(blob);
      } catch {}
    }
    return undefined;
  }, [base64, uint8Array, mediaType]);

  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt || "AI image"} className={className} />;
}


