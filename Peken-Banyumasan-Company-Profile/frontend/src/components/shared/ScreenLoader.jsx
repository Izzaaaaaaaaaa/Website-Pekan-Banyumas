// Peken Banyumasan — shared loading state for CP public screens.
// Shown while a screen's primary CMS fetch is in flight, so visitors never
// see bundled fallback content presented as real data (then swapped on load).
export default function ScreenLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        background: 'var(--bg-page)',
      }}
    >
      <div
        aria-label="Memuat"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid rgba(195,202,150,.2)',
          borderTopColor: 'var(--accent, #C3CA96)',
          animation: 'spin .8s linear infinite',
        }}
      />
    </div>
  );
}
