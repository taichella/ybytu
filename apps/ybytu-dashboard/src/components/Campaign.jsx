import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pendingReviewsService } from '../services/pendingReviewsService.js';
import { campaignStatsService } from '../services/campaignStatsService.js';

export default function Campaign() {
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

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 28px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Campanha — Pré-lançamento (Desafio 15 dias)</h1>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '480px', height: '480px', background: 'rgba(245,95,22,.05)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }}></div>

        <div style={{ position: 'relative', maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ marginBottom: '22px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>Acompanhamento em tempo real da operação — só números reais.</p>
          </div>

          {/* Planos aguardando validação */}
          {!pendingLoading && !pendingError && (
            pending.length > 0 ? (
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
            ) : (
              <div id="pending-section" style={{ background: 'rgba(245,95,22,.08)', border: '1px dashed var(--brand)', borderRadius: '18px', padding: '20px 22px', marginBottom: '18px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
                Nenhum plano aguardando validação no momento.
              </div>
            )
          )}

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
              {/* Degradação IA->determinístico (2026-08-27) -- só destaca em
                  laranja quando > 0 (a cota estourar é o caso raro que precisa
                  chamar atenção, não o normal). "Hoje" pra sinalizar cota diária. */}
              <div style={{ background: stats?.fully_deterministic_plans_today > 0 ? 'rgba(217,119,6,.08)' : 'var(--surface)', border: stats?.fully_deterministic_plans_today > 0 ? '1px solid #d97706' : '1px solid var(--border)', borderRadius: '18px', padding: '22px' }} title="Planos gerados hoje onde a IA não colou em nenhum slot -- sinal de cota estourada ou provedor fora do ar">
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>100% determinístico hoje</p>
                <p style={{ margin: '10px 0 0', fontSize: '28px', fontWeight: 900, color: stats?.fully_deterministic_plans_today > 0 ? '#d97706' : 'var(--text)' }}>{statsLoading ? '—' : stats.fully_deterministic_plans_today}</p>
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
            <Link to="/campaign/failed-plans" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>Ver planos que falharam</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Lista com o motivo real do erro e botão de tentar de novo</p>
            </Link>
            <Link to="/campaign/invite-staff" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>Convidar profissional</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Gera o link de convite (personal/nutricionista/admin)</p>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
