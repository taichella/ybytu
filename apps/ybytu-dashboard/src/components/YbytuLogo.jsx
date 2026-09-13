export default function YbytuLogo({
  size = 34,
  iconSize,
  bg = 'var(--brand)',
  color = '#ffffff',
  showText = false,
  text = 'Ybytu',
  badge = null,
  style = {},
  className = '',
}) {
  const glyphSize = iconSize || Math.round(size * 0.58);
  const borderRadius = Math.max(6, Math.round(size * 0.26));

  const iconElement = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${borderRadius}px`,
        background: bg,
        color: color,
        boxShadow: bg === 'var(--brand)' ? '0 4px 12px rgba(245,95,22,.3)' : 'none',
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="119 94 275 323"
        style={{ width: `${glyphSize}px`, height: 'auto' }}
        fill={color}
        aria-hidden="true"
      >
        <path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z" />
        <path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z" />
        <path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z" />
      </svg>
    </span>
  );

  if (!showText) {
    return iconElement;
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        ...style,
      }}
    >
      {iconElement}
      <span
        style={{
          fontWeight: 900,
          fontSize: `${Math.max(15, Math.round(size * 0.5))}px`,
          letterSpacing: '.02em',
          color: 'var(--text)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {text}
        {badge && (
          <span
            style={{
              color: 'var(--brand)',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
            }}
          >
            {badge}
          </span>
        )}
      </span>
    </div>
  );
}
