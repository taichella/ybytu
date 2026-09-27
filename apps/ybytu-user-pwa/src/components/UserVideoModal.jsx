import { useEffect } from 'react';
import { resolveR2Media } from '../lib/media';

export default function UserVideoModal({ videoUrl, title, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!videoUrl) return null;

  const fullUrl = resolveR2Media(videoUrl);

  return (
    <div className="video-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="video-modal-card" onClick={e => e.stopPropagation()}>
        <div className="video-modal-header">
          <h4 className="video-modal-title">{title || 'Demonstração do Exercício'}</h4>
          <button
            type="button"
            className="video-modal-close"
            onClick={onClose}
            aria-label="Fechar vídeo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <video
          src={fullUrl}
          className="video-player-frame"
          controls
          playsInline
          autoPlay
          muted
        >
          Seu navegador não suporta a reprodução deste vídeo.
        </video>
      </div>
    </div>
  );
}
