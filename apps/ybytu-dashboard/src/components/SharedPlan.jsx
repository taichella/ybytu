import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import UserPlan from './UserPlan';

export default function SharedPlan() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'error'
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    document.title = 'Seu plano — Ybytu';

    const robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    robotsMeta.content = 'noindex, nofollow';
    document.head.appendChild(robotsMeta);

    const cacheMeta = document.createElement('meta');
    cacheMeta.httpEquiv = 'Cache-Control';
    cacheMeta.content = 'no-store';
    document.head.appendChild(cacheMeta);

    return () => {
      document.head.removeChild(robotsMeta);
      document.head.removeChild(cacheMeta);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus('loading');
      const { data, error } = await supabase.functions.invoke('ybytu-get-plan-payload', {
        body: { token },
      });

      if (cancelled) return;

      if (error || !data || data.error) {
        setStatus('error');
        return;
      }

      setPayload(data);
      setStatus('ok');
    }

    loadPayload();
    return () => { cancelled = true; };
  }, [token]);

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#E9ECF1', fontFamily: "'Inter', sans-serif", color: '#697586', fontSize: '14px',
      }}>
        Carregando seu plano…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '10px', background: '#E9ECF1', fontFamily: "'Inter', sans-serif", padding: '24px', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#121826', margin: 0 }}>Link expirado ou inválido</h1>
        <p style={{ fontSize: '14px', color: '#697586', margin: 0, maxWidth: '360px' }}>
          Este link de acesso ao plano não está mais disponível. Fale com a gente para receber um novo.
        </p>
      </div>
    );
  }

  return <UserPlan payload={payload} />;
}
