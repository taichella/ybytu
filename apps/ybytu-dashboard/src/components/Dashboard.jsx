import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pendingReviewsService } from '../services/pendingReviewsService.js';
import { campaignStatsService } from '../services/campaignStatsService.js';

export default function Dashboard() {
  const [theme, setTheme] = useState('dark');
  const [period, setPeriod] = useState('hoje');

  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState(null);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    pendingReviewsService.getAll()
      .then((data) => { if (!cancelled) setPending(data.pending ?? []); })
      .catch((e) => { if (!cancelled) setPendingError(e.message); })
      .finally(() => { if (!cancelled) setPendingLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    campaignStatsService.getAll()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((e) => { if (!cancelled) setStatsError(e.message); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const btnStyle = (isActive) => ({
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '7px', whiteSpace: 'nowrap',
    background: isActive ? 'var(--field)' : 'transparent',
    color: isActive ? 'var(--text)' : 'var(--muted)',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,.1)' : 'none'
  });

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
          
          <button title="Notificações" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
            <span style={{ position: 'absolute', top: '9px', right: '9px', width: '8px', height: '8px', background: 'var(--brand)', border: '2px solid var(--surface)', borderRadius: '50%' }}></span>
          </button>
          
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Novo
          </button>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px', position: 'relative' }}>
        {/* Efeito Glow Laranja de Fundo */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '480px', height: '480px', background: 'rgba(245,95,22,.05)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }}></div>

        <div style={{ position: 'relative', maxWidth: '1240px', margin: '0 auto' }}>

          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px', marginBottom: '26px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0 }}>Visão Geral</h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Bem-vindo de volta, Admin. Aqui está o resumo de hoje.</p>
            </div>
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              <button onClick={() => setPeriod('hoje')} style={btnStyle(period === 'hoje')}>Hoje</button>
              <button onClick={() => setPeriod('7')} style={btnStyle(period === '7')}>7 dias</button>
              <button onClick={() => setPeriod('mes')} style={btnStyle(period === 'mes')}>Mês</button>
            </div>
          </div>

          {/* Planos aguardando validação -- real, não mock */}
          {!pendingLoading && !pendingError && pending.length > 0 && (
            <div id="pending-section" style={{ background: 'rgba(245,95,22,.08)', border: '1px solid var(--brand)', borderRadius: '18px', padding: '20px 22px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>{pending.length} plano{pending.length > 1 ? 's' : ''} aguardando validação</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Alunos com plano gerado esperando parecer profissional</p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pending.map((p) => (
                  <Link key={p.id} to={`/users/${p.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{p.full_name || 'Aluno(a)'}</span>
                    <span style={{ fontSize: '12px', color: 'var(--brand)', fontWeight: 800 }}>
                      falta: {p.missing_roles.map((r) => r === 'personal' ? 'personal' : 'nutricionista').join(', ')}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Campanha em curso -- Pré-lançamento (Desafio 15 dias). Só números
              reais calculados via ybytu-campaign-stats; nenhum mock aqui. */}
          <div style={{ marginBottom: '10px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 2px' }}>Campanha: Pré-lançamento (Desafio 15 dias)</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>Acompanhamento em tempo real da operação</p>
          </div>

          {statsError && (
            <div style={{ background: 'rgba(220,38,38,.08)', border: '1px solid #dc2626', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px', fontSize: '13px', color: '#dc2626' }}>
              Não foi possível carregar os números da campanha: {statsError}
            </div>
          )}

          {!statsError && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '18px', marginBottom: '18px' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Onboardings completos</p>
                <p style={{ margin: '10px 0 0', fontSize: '28px', fontWeight: 900 }}>{statsLoading ? '—' : stats.onboardings_completed}</p>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Planos gerados (ok)</p>
                <p style={{ margin: '10px 0 0', fontSize: '28px', fontWeight: 900, color: '#16a34a' }}>{statsLoading ? '—' : stats.plans_generated_ok}</p>
              </div>
              <div style={{ background: stats?.plans_generated_failed > 0 ? 'rgba(220,38,38,.08)' : 'var(--surface)', border: stats?.plans_generated_failed > 0 ? '1px solid #dc2626' : '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Planos com falha</p>
                <p style={{ margin: '10px 0 0', fontSize: '28px', fontWeight: 900, color: stats?.plans_generated_failed > 0 ? '#dc2626' : 'var(--text)' }}>{statsLoading ? '—' : stats.plans_generated_failed}</p>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Aguardando validação</p>
                <p style={{ margin: '10px 0 0', fontSize: '28px', fontWeight: 900, color: 'var(--brand)' }}>{statsLoading ? '—' : stats.pending_validation}</p>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Planos entregues</p>
                <p style={{ margin: '10px 0 0', fontSize: '28px', fontWeight: 900 }}>{statsLoading ? '—' : stats.plans_delivered}</p>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ marginBottom: '10px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 12px' }}>Atalhos</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
            <a href="#pending-section" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>Ver planos pendentes</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Lista de quem espera parecer, logo acima</p>
            </a>
            <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '14px', padding: '18px', opacity: 0.7 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>Ver planos que falharam</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Ainda não existe tela/filtro pra isso — só o número acima. Preciso saber se você quer uma tela dedicada ou um filtro em Usuários (do jules).</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '14px', padding: '18px', opacity: 0.7 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>Convidar profissional</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Só existe a tela de aceitar convite (/aceitar-convite/:token). Não há tela pra gerar o convite ainda.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}