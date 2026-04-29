/**
 * Global footer — sage band, dark text, 3-column layout.
 * Note: previous version used the brand pillars (Culture/Creative/Circular)
 * as row labels for address/phone/social — those labels carry brand meaning
 * elsewhere on the site, so reusing them as generic data labels was confusing.
 * Switched to semantic Address / Contact / Social labels in --fg-muted.
 */
export default function PekenFooter({ onNavigate }) {
  const go = (p) => (e) => {
    e.preventDefault();
    onNavigate && onNavigate(p);
  };

  return (
    <footer>
      <div
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-ink)',
          padding: '80px 120px 60px',
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr 1fr',
          gap: 60,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <img
            src="/assets/logo-peken-banyumasan.png"
            alt=""
            style={{ width: 80, height: 80, mixBlendMode: 'multiply' }}
          />
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              lineHeight: 1.8,
              color: 'var(--accent-ink)',
              maxWidth: '32ch',
              margin: '32px 0 0',
            }}
          >
            Ruang budaya dan ekonomi kreatif di Banyumas yang mempertemukan
            seni, Artisan, dan masyarakat dalam satu ruang kolaborasi yang
            hidup dan berkelanjutan.
          </p>
          <div
            style={{
              marginTop: 40,
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            #MirapatBanyumasan
          </div>
        </div>

        <div style={{ display: 'grid', gap: 24 }}>
          <FooterRow
            label="Alamat"
            lines={[
              'Banyumas, Sudagaran, Kec. Banyumas,',
              'Kabupaten Banyumas, Jawa Tengah 53192',
            ]}
          />
          <FooterRow
            label="Kontak"
            lines={['(+62) 812 3456 7899', 'hello@pekenbanyumasan.id']}
          />
          <FooterRow
            label="Sosial"
            lines={['Instagram · @pekenbanyumasan']}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 20,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 12,
              letterSpacing: '.04em',
            }}
          >
            SITEMAP
          </div>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              textAlign: 'right',
              display: 'grid',
              gap: 10,
              fontFamily: 'var(--font-display)',
              fontSize: 14,
            }}
          >
            {['HOME', 'ABOUT', 'PROGRAM', 'KARYA', 'PUBLICATION', 'GALLERY'].map(
              (p) => (
                <li key={p}>
                  <a
                    href="#"
                    onClick={go(p)}
                    style={{
                      color: 'var(--accent-ink)',
                      textDecoration: 'none',
                    }}
                  >
                    {p}
                  </a>
                </li>
              )
            )}
          </ul>
          <div
            aria-hidden="true"
            style={{
              marginTop: 20,
              display: 'flex',
              gap: 4,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  background: 'var(--accent-ink)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-deep)',
          color: 'var(--fg-muted)',
          padding: '16px 120px',
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>
          © {new Date().getFullYear()} Peken Banyumasan. All Rights Reserved.
        </span>
        <span>Design &amp; Code · Kolektif Kota Lama</span>
      </div>
    </footer>
  );
}

function FooterRow({ label, lines }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 11,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: 'var(--fg-muted)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            lineHeight: 1.8,
            color: 'var(--accent-ink)',
          }}
        >
          {l}
        </div>
      ))}
    </div>
  );
}
