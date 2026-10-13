/**
 * Joe's spark-plug logo, painted with CSS.
 *
 * The traced logo (public/brand/joes-spark-plug.svg) is used as a mask, so the
 * same artwork can be chrome, glowing, or split into an exploded view without
 * shipping extra images. Server component: no state, safe anywhere.
 */

type Props = {
  className?: string;
  /** Soft colored halo behind the plug. */
  glow?: boolean;
  /** Animated light sweep across the chrome. */
  shine?: boolean;
  /** Render as three separately movable bands (top / nut / threads). */
  exploded?: boolean;
  /** Add a scanner beam that lights only the plug's metal (hidden until shown via [data-scan]). */
  scan?: boolean;
  children?: React.ReactNode;
};

function Body({ glow, shine, scan }: { glow: boolean; shine: boolean; scan: boolean }) {
  return (
    <>
      {glow && (
        <div className="plug-glow" aria-hidden="true">
          <div className="plug-mask" />
        </div>
      )}
      <div className="plug-mask plug-chrome" />
      {shine && <div className="plug-mask plug-shine" />}
      {scan && (
        <div data-scan className="plug-mask overflow-hidden opacity-0">
          <span className="scanline" />
        </div>
      )}
    </>
  );
}

export function SparkPlug({
  className = "",
  glow = true,
  shine = true,
  exploded = false,
  scan = false,
  children,
}: Props) {
  return (
    <div className={`plug ${className}`} role="img" aria-label="Joe's Garage spark plug logo">
      {exploded ? (
        (["top", "mid", "bottom"] as const).map((part) => (
          <div key={part} className="plug-part" data-part={part}>
            <Body glow={glow} shine={shine} scan={scan} />
          </div>
        ))
      ) : (
        <Body glow={glow} shine={shine} scan={scan} />
      )}
      {children}
    </div>
  );
}
