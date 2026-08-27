import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { staffInviteService } from '../services/staffInviteService.js';
import { StaffContext } from '../lib/staffContextCore';

const ROLES = [
  { value: 'personal', label: 'Personal trainer' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'admin', label: 'Admin' },
];

export default function InviteStaff() {
  const staff = useContext(StaffContext);
  const isAdmin = staff?.roles?.includes('admin');

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null); // { token, email, role, expires_at }
  const [copied, setCopied] = useState(false);

  const inviteLink = invite ? `${window.location.origin}/accept-invite/${invite.token}` : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInvite(null);
    setCopied(false);
    setLoading(true);
    try {
      const data = await staffInviteService.create(email.trim(), role);
      setInvite(data);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Não foi possível criar o convite.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível — o link já está visível pra copiar na mão
    }
  };

  if (!isAdmin) {
    return (
      <>
        <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '16px' }}>
          <Link to="/campaign" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '13px' }}>&larr; Campanha</Link>
          <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Convidar profissional</h1>
        </header>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Só administradores podem gerar convites.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '16px' }}>
        <Link to="/campaign" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '13px' }}>&larr; Campanha</Link>
        <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Convidar profissional</h1>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: 0 }}>
            Gera um link de convite (válido por 7 dias) pra criar acesso de personal, nutricionista ou admin.
          </p>

          <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--muted)', marginBottom: '6px' }}>E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--muted)', marginBottom: '6px' }}>Papel</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }}
              >
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: 800, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Gerando…' : 'Gerar convite'}
            </button>
          </form>

          {invite && (
            <div style={{ marginTop: '18px', background: 'rgba(22,163,74,.08)', border: '1px solid #16a34a', borderRadius: '14px', padding: '18px 20px' }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>
                Convite criado para {invite.email} ({ROLES.find((r) => r.value === invite.role)?.label || invite.role})
              </p>
              <p style={{ margin: '4px 0 12px', fontSize: '12px', color: 'var(--muted)' }}>
                Expira em {new Date(invite.expires_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  readOnly
                  value={inviteLink}
                  onFocus={(e) => e.target.select()}
                  style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}
                />
                <button
                  onClick={handleCopy}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                Envie este link pro profissional — a tela de cadastro dele já está em produção (/accept-invite/:token).
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
