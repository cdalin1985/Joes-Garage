/**
 * Per-service line art. Each icon has one or more `.ico-part` elements that
 * animate independently when the surrounding `.svc-card` is hovered — the
 * rotor spins, the droplet drips, the spring compresses, the piston strokes.
 *
 * The piston is deliberate: it's the shape in the shop's own logo.
 *
 * Server component — pure SVG, no JavaScript ships for any of this.
 */

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={label} className="h-7 w-7" {...S}>
      {children}
    </svg>
  );
}

export function ServiceIcon({ slug, name }: { slug: string; name: string }) {
  switch (slug) {
    /* Gauge — the needle sweeps across the dial. */
    case "diagnostics":
      return (
        <Svg label={name}>
          <path d="M3.6 17a8.4 8.4 0 0 1 16.8 0" />
          <path className="ico-part ico-needle" d="M12 17 8.1 12.9" />
          <circle cx="12" cy="17" r="1.25" fill="currentColor" stroke="none" />
        </Svg>
      );

    /* Brake rotor — the cooling holes rotate. */
    case "brake-repair":
      return (
        <Svg label={name}>
          <circle cx="12" cy="12" r="8.4" />
          <circle cx="12" cy="12" r="2.6" />
          <g className="ico-part ico-spin">
            <circle cx="12" cy="6.7" r="0.95" />
            <circle cx="17.3" cy="12" r="0.95" />
            <circle cx="12" cy="17.3" r="0.95" />
            <circle cx="6.7" cy="12" r="0.95" />
          </g>
        </Svg>
      );

    /* Oil — the drop swells and a bead falls away. */
    case "oil-change":
      return (
        <Svg label={name}>
          <path
            className="ico-part ico-drop"
            d="M12 3.8c3.2 3.9 5 6.4 5 8.6a5 5 0 0 1-10 0c0-2.2 1.8-4.7 5-8.6Z"
          />
          <circle className="ico-part ico-drip" cx="12" cy="20.8" r="1.05" />
        </Svg>
      );

    /* Snowflake — spins on hover. */
    case "ac-and-heating":
      return (
        <Svg label={name}>
          <g className="ico-part ico-spin">
            <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
            <path d="M12 6.6 9.9 4.7M12 6.6l2.1-1.9M12 17.4l-2.1 1.9M12 17.4l2.1 1.9" />
          </g>
        </Svg>
      );

    /* Battery — the bolt re-draws on hover. */
    case "batteries-and-electrical":
      return (
        <Svg label={name}>
          <rect x="2.6" y="7.6" width="15.2" height="9.6" rx="2.2" />
          <path d="M17.8 11h2.8v2.8h-2.8" />
          <path className="ico-part ico-draw" d="M11.6 9.4 9 13.1h3.2l-1.8 3" />
        </Svg>
      );

    /* Coil spring — compresses under load. */
    case "suspension-and-alignment":
      return (
        <Svg label={name}>
          <path d="M5.5 3.6h13M5.5 20.4h13" />
          <g className="ico-part ico-squish">
            <path d="M6.5 6.4h11M6.5 6.4l11 3.7M17.5 10.1h-11M6.5 10.1l11 3.7M17.5 13.8h-11M6.5 13.8l11 3.7M17.5 17.5h-11" />
          </g>
        </Svg>
      );

    /* Tire — rolls half a turn. */
    case "tires":
      return (
        <Svg label={name}>
          <circle cx="12" cy="12" r="8.6" />
          <circle cx="12" cy="12" r="3.3" />
          <g className="ico-part ico-spin-half">
            <path d="M12 3.4v5.3M12 15.3v5.3M3.4 12h5.3M15.3 12h5.3" />
          </g>
        </Svg>
      );

    /* Piston and rod — the shape from the shop's logo. Strokes upward. */
    case "engine-and-transmission":
      return (
        <Svg label={name}>
          <g className="ico-part ico-lift">
            <rect x="7.2" y="3.4" width="9.6" height="7" rx="1.5" />
            <path d="M7.2 6h9.6M7.2 8.1h9.6" />
            <path d="M12 10.4v3.2" />
          </g>
          <path d="M12 13.6 10.9 16M12 13.6 13.1 16" />
          <circle cx="12" cy="18.2" r="2.9" />
        </Svg>
      );

    /* Calendar — the checkmark draws in. */
    case "scheduled-maintenance":
      return (
        <Svg label={name}>
          <rect x="3.4" y="5" width="17.2" height="15.6" rx="2.4" />
          <path d="M3.4 9.6h17.2M8.2 3.4v3.1M15.8 3.4v3.1" />
          <path className="ico-part ico-draw" d="m8.6 14.6 2.5 2.5 4.3-4.5" />
        </Svg>
      );

    /* Magnifier — zooms in. */
    case "pre-purchase-inspection":
      return (
        <Svg label={name}>
          <g className="ico-part ico-zoom">
            <circle cx="10.4" cy="10.4" r="5.9" />
            <path d="M14.8 14.8 20.4 20.4" />
          </g>
        </Svg>
      );

    /* Work truck — drives forward. */
    case "fleet-service":
      return (
        <Svg label={name}>
          <g className="ico-part ico-slide">
            <path d="M2.6 7.4h9.8v9.2H2.6z" />
            <path d="M12.4 10.9h4.2l3 3v2.7h-7.2" />
            <circle cx="6.6" cy="17.6" r="1.75" />
            <circle cx="16.6" cy="17.6" r="1.75" />
          </g>
        </Svg>
      );

    /* Fallback — wrench. */
    default:
      return (
        <Svg label={name}>
          <path
            className="ico-part ico-spin"
            d="M15.5 6.5a4.2 4.2 0 0 0-5.6 5.1L4 17.5 6.5 20l5.9-5.9a4.2 4.2 0 0 0 5.1-5.6l-2.6 2.6-2.1-2.1Z"
          />
        </Svg>
      );
  }
}
