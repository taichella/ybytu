import { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { failedPlansService } from '../services/failedPlansService.js';
import { StaffContext } from '../lib/staffContextCore';

const SUB_LABEL = {
  '3a5ccc00-77ed-4b87-8e83-bc35be63a862': 'Treino',
  '7458939c-ed4b-4a16-960e-b647f94e6a9b': 'Nutrição',
  '7b5502f1-eeed-4640-8c4f-0ebc0502481e': 'Completo',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function FailedPlans() {
  const staff = useContext(StaffContext);
  const isAdmin = staff?.roles?.includes('admin');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(null); // id em retry
  const [retryResult, setRetryResult] = useState({}); // id -> mensagem

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    failedPlansService.getAll()
      .then((data) => setItems(data.failed ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (userId) => {
    setRetrying(userId);
    setRetryResult((prev) => ({ ...prev, [userId]: null }));
    try {
      const result = await failedPlansService.retry(userId);
      const parts = [];
      if (result.results?.training) parts.push(`treino: ${result.results.training.ok ? 'ok' : 'falhou'}`);
      if (result.results?.meal) parts.push(`nutrição: ${result.results.meal.ok ? 'ok' : 'falhou'}`);
      setRetryResult((prev) => ({ ...prev, [userId]: parts.join(' · ') || 'concluído' }));
      load();
    } catch (e) {
      setRetryResult((prev) => ({ ...prev, [userId]: `Erro: ${e.message}` }));
    } finally {
      setRetrying(null);
    }
  };

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '16px' }}>
        <Link to="/campaign" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '13px' }}>&larr; Campanha</Link>
        <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Planos que falharam</h1>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: 0 }}>
            Perfis com <code>plan_generation_status = 'failed'</code> — motivo real gravado pelo próprio gerador (não é mais o timeout do navegador do aluno).
          </p>

          {error && (
            <div style={{ background: 'rgba(220,38,38,.08)', border: '1px solid #dc2626', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px', fontSize: '13px', color: '#dc2626' }}>
              Não foi possível carregar: {error}
            </div>
          )}

          {loading && <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Carregando…</p>}

          {!loading && !error && items.length === 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
              Nenhum plano com falha agora.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((p) => (
              <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <Link to={`/users/${p.id}`} style={{ fontWeight: 800, fontSize: '15px', color: 'inherit', textDecoration: 'none' }}>
                      {p.full_name || 'Aluno(a)'}
                    </Link>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                      {SUB_LABEL[p.subscription_type_id] || 'Assinatura desconhecida'} · onboarding em {formatDate(p.created_at)}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                      {p.has_training_plan ? '✅' : '—'} treino &nbsp; {p.has_meal_plan ? '✅' : '—'} nutrição
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRetry(p.id)}
                      disabled={retrying === p.id}
                      style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 800, cursor: retrying === p.id ? 'default' : 'pointer', opacity: retrying === p.id ? 0.6 : 1, flexShrink: 0 }}
                    >
                      {retrying === p.id ? 'Tentando de novo…' : 'Tentar de novo'}
                    </button>
                  )}
                </div>

                {p.error_message && (
                  <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#dc2626', fontFamily: 'monospace', background: 'rgba(220,38,38,.06)', borderRadius: '8px', padding: '8px 10px', wordBreak: 'break-word' }}>
                    {p.error_message}
                  </p>
                )}

                {retryResult[p.id] && (
                  <p style={{ margin: '10px 0 0', fontSize: '12px', fontWeight: 700, color: retryResult[p.id].startsWith('Erro') ? '#dc2626' : '#16a34a' }}>
                    {retryResult[p.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
