import manifestData from '../generated/image-manifest.json';

type ImageVariant = {
  src: string;
  width: number;
  height: number;
  bytes: number;
};

type ImageManifestEntry = {
  src: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  variants: ImageVariant[];
};

const manifest = manifestData as Record<string, ImageManifestEntry | undefined>;

function manifestEntry(src: string): ImageManifestEntry | undefined {
  if (manifest[src]) return manifest[src];
  try {
    return manifest[decodeURIComponent(src)];
  } catch {
    return undefined;
  }
}

export function optimizedSrc(src: string): string {
  return manifestEntry(src)?.src ?? src;
}

export function optimizedSrcSet(src: string): string | undefined {
  const variants = manifestEntry(src)?.variants;
  if (!variants?.length) return undefined;
  return variants.map((variant) => `${variant.src} ${variant.width}w`).join(', ');
}

export function optimizedDimensions(src: string): { width: number; height: number } | undefined {
  const entry = manifestEntry(src);
  if (!entry) return undefined;
  return { width: entry.width, height: entry.height };
}

export function optimizedPoster(src: string): string {
  return optimizedSrc(src);
}
