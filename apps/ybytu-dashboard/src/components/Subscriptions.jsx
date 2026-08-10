import { useState, useEffect } from 'react';

export default function Subscriptions() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Assinaturas</h2>
        <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Não existe fonte real de assinatura/cobrança no Supabase -- planos,
          receita, MRR e transações vivem no WooCommerce (WordPress), fora
          deste app. subscription_types aqui é só catálogo (nomes de plano),
          não assinatura-por-usuário. A versão anterior desta tela mostrava
          uma tabela de "transações recentes" 100% inventada, com números de
          cartão fake -- risco real de alguém achar que era dado de verdade.
          Regra da Taina: aviso claro > dado falso. */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '40px 32px' }}>
          <span style={{ display: 'inline-flex', width: '52px', height: '52px', borderRadius: '14px', background: 'var(--brand-soft)', color: 'var(--brand)', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M2 10h20"></path></svg>
          </span>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Assinaturas são gerenciadas no WordPress</h1>
          <p style={{ margin: '10px 0 0', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>
            Planos, cobrança, MRR e transações ficam no WooCommerce, fora do painel Ybytu.
            Este app não tem essa fonte de dado — acesse o admin do WordPress pra ver ou gerenciar assinaturas.
          </p>
        </div>
      </main>
    </>
  );
}
