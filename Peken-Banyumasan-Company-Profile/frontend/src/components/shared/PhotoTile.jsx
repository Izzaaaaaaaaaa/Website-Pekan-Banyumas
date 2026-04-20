/**
 * PhotoTile — three behavioural modes via the `mode` prop:
 *   "hover"   — full pixel cross-fade colourise (Home image-run, Program rows).
 *   "caption" — static colour image, only the caption overlay slides in
 *               on hover (Works masonry — shows creator name).
 *   "static"  — no hover effect at all (Gallery masonry).
 * `caption` slot accepts JSX rendered in the bottom-overlay area.
 */
export default function PhotoTile({
  src,
  alt = '',
  aspect = '480/260',
  mode = 'static',
  corner,
  caption,
  onClick,
  style,
  eager = false,
  ariaLabel,
}) {
  const isHover = mode === 'hover';
  const isStatic = mode === 'static';
  const cls = 'photo-tile' + (isHover ? ' photo-tile--hover' : '');

  return (
    <div
      className={cls}
      role={onClick ? 'button' : undefined}
      aria-label={ariaLabel}
      style={{
        aspectRatio: aspect,
        cursor: onClick ? 'pointer' : 'default',
        ...(style || {}),
      }}
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e);
        }
      }}
    >
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} />
      {isHover && (
        <>
          <img
            src={src}
            alt=""
            aria-hidden="true"
            loading={eager ? 'eager' : 'lazy'}
            className="photo-tile__color"
          />
          <div aria-hidden="true" className="photo-tile__pixelgrid" />
        </>
      )}
      {corner && !isStatic && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
            color: 'var(--accent)',
            fontSize: 12,
            fontFamily: 'var(--font-display)',
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          {corner}
        </div>
      )}
      {caption && <div className="photo-tile__caption">{caption}</div>}
    </div>
  );
}
