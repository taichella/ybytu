import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './tokens.css';
import './index.css';

const UserAuth = lazy(() => import('./components/UserAuth'));
const UserToday = lazy(() => import('./components/UserToday'));
const UserBlocked = lazy(() => import('./components/UserBlocked'));

function LoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--yb-bg, #F8F9FA)',
      color: 'var(--yb-muted, #718096)',
      fontSize: '14px',
      fontFamily: 'var(--yb-font, sans-serif)',
      fontWeight: 600,
    }}>
      Carregando…
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/hoje" replace />} />
          <Route path="/login" element={<UserAuth />} />
          <Route path="/hoje" element={<UserToday />} />
          <Route path="/bloqueio" element={<UserBlocked />} />
          {/* Fallback de rota desconhecida */}
          <Route path="*" element={<Navigate to="/hoje" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
