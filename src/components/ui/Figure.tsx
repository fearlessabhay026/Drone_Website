import { useCallback, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MediaAsset } from '../../data/media';

type FigureProps = {
  asset: MediaAsset;
  className?: string;
  imgClassName?: string;
  /** Hero and featured imagery must not be lazy — it is the LCP element. */
  priority?: boolean;
  sizes?: string;
  style?: CSSProperties;
};

/**
 * The single image primitive. Handles object-cover, intrinsic dimensions
 * (so nothing reflows on load) and a blur-up from the inline placeholder.
 */
export function Figure({
  asset,
  className = '',
  imgClassName = '',
  priority = false,
  sizes,
  style,
}: FigureProps) {
  const [loaded, setLoaded] = useState(false);

  // A cached image can finish decoding before React attaches `onLoad`, which
  // would leave the picture parked at opacity 0 forever. Checking `complete`
  // as the node mounts closes that window.
  const attach = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <div className={`relative overflow-hidden bg-ink-soft ${className}`} style={style}>
      {asset.blur ? (
        <div
          aria-hidden
          className="absolute inset-0 scale-110 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url(${asset.blur})`, opacity: loaded ? 0 : 1 }}
        />
      ) : null}
      <img
        ref={attach}
        src={asset.src}
        srcSet={asset.srcSet}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        // index.html's <noscript> styles show it: without JS onLoad never fires.
        data-figure-img=""
        className={`relative h-full w-full object-cover transition-opacity duration-700 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
      />
    </div>
  );
}
