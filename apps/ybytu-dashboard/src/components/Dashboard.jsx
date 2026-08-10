import { useState, useEffect } from 'react';
import { campaignStatsService } from '../services/campaignStatsService.js';

export default function Dashboard() {
  const [theme, setTheme] = useState('dark');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    campaignStatsService.getAll()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const cards = stats ? [
    { label: 'Onboardings completos', value: stats.onboardings_completed, color: 'var(--brand)', bg: 'var(--brand-soft)' },
    { label: 'Planos gerados (ok)', value: stats.plans_generated_ok, color: '#16a34a', bg: 'rgba(22,163,74,.1)' },
    { label: 'Planos com falha', value: stats.plans_generated_failed, color: '#dc2626', bg: 'rgba(220,38,38,.1)' },
    { label: 'Aguardando validação', value: stats.pending_validation, color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    { label: 'Planos entregues', value: stats.plans_delivered, color: '#a855f7', bg: 'rgba(168,85,247,.1)' },
  ] : [];

  return (
    <>
      {/* ===================== HEADER ===================== */}
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          </span>
          <input type="text" placeholder="Buscar usuários, alimentos, treinos…" style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
            )}
          </button>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px', position: 'relative' }}>
        {/* Efeito Glow Laranja de Fundo */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '480px', height: '480px', background: 'rgba(245,95,22,.05)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }}></div>

        <div style={{ position: 'relative', maxWidth: '1240px', margin: '0 auto' }}>

          {/* Title row */}
          <div style={{ marginBottom: '18px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0 }}>Visão Geral</h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Resumo em tempo real da campanha de pré-lançamento.</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(220,38,38,.08)', border: '1px solid #dc2626', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px', fontSize: '13px', color: '#dc2626' }}>
              Não foi possível carregar os números: {error}
            </div>
          )}

          {/* Stat cards -- só números reais, vindos de ybytu-campaign-stats
              (mesma fonte da tela Campanha). Removidos MRR/ticket médio/churn/
              gráfico de crescimento/distribuição de planos/listas de usuários
              e atividade recente -- eram todos dado de exemplo, sem fonte real
              (WooCommerce/assinaturas ainda não estão no Supabase -- ver tela
              Assinaturas). Regra da Taina: tela removida > dado falso. */}
          {!error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '18px' }}>
              {(loading ? Array.from({ length: 5 }) : cards).map((c, i) => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                  {c && (
                    <span style={{ width: '44px', height: '44px', borderRadius: '12px', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', fontWeight: 900, fontSize: '18px' }}>
                      {c.value}
                    </span>
                  )}
                  <p style={{ margin: c ? '18px 0 0' : 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>{c ? c.label : '—'}</p>
                  <p style={{ margin: '5px 0 0', fontSize: '28px', fontWeight: 900 }}>{c ? c.value : '…'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
