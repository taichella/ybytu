import { useState, useEffect, useMemo } from 'react';
import { campaignStatsService } from '../services/campaignStatsService.js';

const DONUT_COLORS = ['#F55F16', '#3b82f6', '#a855f7', '#16a34a', '#9ca3af', '#0ea5e9'];

function buildGrowthPath(series) {
  const W = 580, H = 210, PAD_BOTTOM = 25;
  const max = Math.max(1, ...series.map((s) => s.count));
  const stepX = series.length > 1 ? W / (series.length - 1) : W;
  const points = series.map((s, i) => {
    const x = series.length > 1 ? i * stepX : 0;
    const y = (H - PAD_BOTTOM) - (s.count / max) * (H - PAD_BOTTOM - 15);
    return [x, y];
  });
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${H - PAD_BOTTOM} L0,${H - PAD_BOTTOM} Z`;
  return { line, area, points };
}

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

  const growth = useMemo(() => stats?.growth_series?.length ? buildGrowthPath(stats.growth_series) : null, [stats]);
  const growthTotal = stats?.growth_series?.reduce((a, s) => a + s.count, 0) ?? 0;
  const distribution = stats?.plan_distribution ?? [];
  const distributionTotal = distribution.reduce((a, d) => a + d.count, 0);

  const designCards = stats ? [
    { label: 'Total de Usuários', value: stats.total_users, color: 'var(--brand)', bg: 'var(--brand-soft)' },
    { label: 'Assinaturas Ativas', value: stats.active_subscriptions, color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    { label: 'Refeições Realizadas', value: stats.meals_completed, color: '#a855f7', bg: 'rgba(168,85,247,.1)' },
    { label: 'Base de Alimentos', value: stats.foods_count, color: '#16a34a', bg: 'rgba(22,163,74,.1)' },
  ] : [];

  const cards = stats ? [
    { label: 'Onboardings completos', value: stats.onboardings_completed, color: 'var(--brand)', bg: 'var(--brand-soft)' },
    { label: 'Planos gerados (ok)', value: stats.plans_generated_ok, color: '#16a34a', bg: 'rgba(22,163,74,.1)' },
    { label: 'Planos com falha', value: stats.plans_generated_failed, color: '#dc2626', bg: 'rgba(220,38,38,.1)' },
    { label: 'Aguardando validação', value: stats.pending_validation, color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    { label: 'Planos entregues', value: stats.plans_delivered, color: '#a855f7', bg: 'rgba(168,85,247,.1)' },
    { label: 'Refeições realizadas', value: stats.meals_completed, color: '#0ea5e9', bg: 'rgba(14,165,233,.1)' },
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

          {/* 4 cards do design original (Dashboard.dc.html), dado real vindo
              de ybytu-campaign-stats (profiles/foods/completed_meals).
              MRR/Ticket médio/Churn NÃO voltam -- sem WooCommerce/assinaturas
              no Supabase ainda não há fonte real pra esses três (ver tela
              Assinaturas). "Treinos Realizados" do design vira "Refeições
              Realizadas" -- decisão já tomada pela Taina em 2026-08-11,
              não existe tabela de treino concluído, completed_meals sim. */}
          {!error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '18px', marginBottom: '18px' }}>
              {(loading ? Array.from({ length: 4 }) : designCards).map((c, i) => (
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

          {/* Gráfico de crescimento + donut de distribuição -- dado real,
              nunca ausente: se não houver cadastro/assinatura ainda, mostra
              o card com estado vazio em vez de sumir. */}
          {!error && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)', gap: '18px', marginBottom: '18px' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Crescimento de Usuários</h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Novos cadastros nos últimos 6 meses</p>
                  </div>
                </div>
                {growthTotal === 0 ? (
                  <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '13px' }}>Sem dados ainda</div>
                ) : (
                  <>
                    <svg viewBox="0 0 580 210" preserveAspectRatio="none" style={{ width: '100%', height: '200px', marginTop: '8px', display: 'block' }}>
                      <defs>
                        <linearGradient id="ybArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F55F16" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#F55F16" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="40" x2="580" y2="40" stroke="var(--border)" strokeWidth="1" />
                      <line x1="0" y1="90" x2="580" y2="90" stroke="var(--border)" strokeWidth="1" />
                      <line x1="0" y1="140" x2="580" y2="140" stroke="var(--border)" strokeWidth="1" />
                      <path d={growth.area} fill="url(#ybArea)" />
                      <path d={growth.line} fill="none" stroke="#F55F16" strokeWidth="3" strokeLinecap="round" />
                      {growth.points.map(([x, y], i) => (
                        <circle key={i} cx={x} cy={y} r="4" fill="var(--surface)" stroke="#F55F16" strokeWidth="2.5" />
                      ))}
                    </svg>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>
                      {stats.growth_series.map((s, i) => <span key={i}>{s.label}</span>)}
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900 }}>Distribuição de Planos</h3>
                {distributionTotal === 0 ? (
                  <div style={{ height: '128px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '13px' }}>Sem dados ainda</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <svg viewBox="0 0 42 42" style={{ width: '128px', height: '128px', flexShrink: 0, transform: 'rotate(-90deg)' }}>
                      <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--border)" strokeWidth="6" />
                      {(() => {
                        let offset = 0;
                        return distribution.map((d, i) => {
                          const pct = (d.count / distributionTotal) * 100;
                          const el = (
                            <circle key={i} cx="21" cy="21" r="15.915" fill="none" stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} />
                          );
                          offset += pct;
                          return el;
                        });
                      })()}
                    </svg>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {distribution.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }}></span>
                          <span style={{ fontWeight: 700 }}>{d.name}</span>
                          <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontWeight: 600 }}>{Math.round((d.count / distributionTotal) * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campanha (Desafio 15 dias) -- números operacionais do pré-lançamento,
              já existiam e continuam reais (ybytu-campaign-stats). */}
          {!error && (
            <>
              <h2 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '.03em', color: 'var(--muted)' }}>Campanha (Desafio 15 dias)</h2>
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
            </>
          )}
        </div>
      </main>
    </>
  );
}
