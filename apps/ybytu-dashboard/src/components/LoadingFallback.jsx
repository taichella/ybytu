export default function LoadingFallback({ message = 'Carregando…' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        height: '100%',
        width: '100%',
        gap: '14px',
        color: 'var(--muted)',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--brand)',
          borderRadius: '50%',
          animation: 'yb-spin 0.75s linear infinite',
        }}
      />
      <style>{`@keyframes yb-spin { to { transform: rotate(360deg); } }`}</style>
      {message && (
        <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '.01em' }}>
          {message}
        </span>
      )}
    </div>
  );
}
