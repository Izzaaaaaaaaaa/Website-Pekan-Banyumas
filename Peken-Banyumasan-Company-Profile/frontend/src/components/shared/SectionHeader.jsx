import { Eyebrow } from './Typography.jsx';

/**
 * SectionHeader — eyebrow + headline pair.
 * Inline styles & layout identical to original Shared.jsx.
 */
export default function SectionHeader({
  eyebrow,
  title,
  right,
  style,
  align = 'left',
}) {
  return (
    <div
      style={{
        display: align === 'center' ? 'block' : 'grid',
        gridTemplateColumns: align === 'center' ? undefined : '1fr auto',
        alignItems: 'baseline',
        paddingBottom: 24,
        marginBottom: 40,
        textAlign: align,
        ...(style || {}),
      }}
    >
      <div>
        {eyebrow && (
          <Eyebrow
            style={{
              color: 'var(--accent)',
              marginBottom: 14,
              ...(align === 'center' ? { display: 'inline-block' } : {}),
            }}
          >
            {eyebrow}
          </Eyebrow>
        )}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 32,
            color: '#fff',
            lineHeight: 1.25,
            maxWidth: 800,
            marginInline: align === 'center' ? 'auto' : undefined,
          }}
        >
          {title}
        </div>
      </div>
      {right}
    </div>
  );
}
