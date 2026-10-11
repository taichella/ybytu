import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { emailHealthService } from '../services/emailHealthService.js';

// Falhas de envio de e-mail e alunos sem o link do plano (2026-10-11, e-mail
// virou o caminho crítico com o WhatsApp fora). Mesmo layout de
// FailedPlans.jsx. Admin-only (a function exige o papel).

const KIND_LABEL = {
  user_plan_ready: 'Link do plano (aluno)',
  user_login_code: 'Código de login (aluno)',
  user_onboarding_received: 'Confirmação de onboarding (aluno)',
  staff_review_pending: 'Parecer pendente (staff)',
  staff_review_reminder: 'Lembrete de parecer (staff)',
  admin_new_onboarding: 'Novo aluno (admin)',
  admin_email_alert: 'Alerta de e-mail (admin)',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px' };

export default function EmailAlerts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    emailHealthService.get()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const failures = data?.recent_failures ?? [];
  const students = data?.students_without_link ?? [];

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '16px' }}>
        <Link to="/campaign" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '13px' }}>&larr; Campanha</Link>
        <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Envio de e-mails</h1>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: 0 }}>
            O e-mail é o único canal com o aluno enquanto o WhatsApp está fora. "Enviado" quer dizer que o Resend aceitou; não confirma a chegada na caixa de entrada.
          </p>

          {error && (
            <div style={{ background: 'rgba(220,38,38,.08)', border: '1px solid #dc2626', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px', fontSize: '13px', color: '#dc2626' }}>
              Não foi possível carregar: {error}
            </div>
          )}

          {loading && <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Carregando…</p>}

          {!loading && data && (
            <>
              {data.open_alert && (
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>
                  Incidente aberto desde {formatDate(data.open_alert.opened_at)} (última verificação {formatDate(data.open_alert.last_seen_at)}).
                </p>
              )}

              <h2 style={{ fontSize: '16px', fontWeight: 900, margin: '24px 0 12px' }}>
                Alunos com plano aprovado sem o link ({students.length})
              </h2>
              {students.length === 0 ? (
                <div style={{ ...card, textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
                  Todos os planos aprovados há mais de {data.stuck_after_hours}h tiveram o link entregue.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {students.map((s) => (
                    <div key={s.user_id} style={card}>
                      <Link to={`/users/${s.user_id}`} style={{ fontWeight: 800, fontSize: '15px', color: 'inherit', textDecoration: 'none' }}>
                        {s.full_name || 'Aluno(a)'}
                      </Link>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                        Plano aprovado em {formatDate(s.approved_at)} · nenhum e-mail com o link foi aceito pelo Resend
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <h2 style={{ fontSize: '16px', fontWeight: 900, margin: '28px 0 12px' }}>
                Falhas de envio nas últimas {data.failure_window_hours}h ({failures.length})
              </h2>
              {failures.length === 0 ? (
                <div style={{ ...card, textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
                  Nenhuma falha de envio.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {failures.map((f) => (
                    <div key={f.id} style={card}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>{KIND_LABEL[f.kind] || f.kind}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                        Para {f.to_email} · {formatDate(f.created_at)}
                        {f.user_id && <> · <Link to={`/users/${f.user_id}`} style={{ color: 'var(--brand)' }}>ver aluno</Link></>}
                      </p>
                      {f.error && (
                        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#dc2626', fontFamily: 'monospace', background: 'rgba(220,38,38,.06)', borderRadius: '8px', padding: '8px 10px', wordBreak: 'break-word' }}>
                          {f.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
