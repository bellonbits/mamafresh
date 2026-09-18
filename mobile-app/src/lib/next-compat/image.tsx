// Drop-in replacement for next/image's default export — a plain <img>, since
// Capacitor ships a static bundle with no image-optimization server. Ported
// pages import this as `Image` in place of next/image. Supports the subset of
// the next/image API this codebase actually uses: src, alt, fill, width,
// height, className, sizes, priority, onError.
interface NextImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export default function Image({ src, alt, fill, width, height, className, priority, onError }: NextImageProps) {
  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        onError={onError}
        loading={priority ? "eager" : "lazy"}
        className={className}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      onError={onError}
      loading={priority ? "eager" : "lazy"}
      className={className}
    />
  );
}
