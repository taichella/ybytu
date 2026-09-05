import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Users() {
  const [theme, setTheme] = useState('dark');

  // Sincroniza o tema
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const SUB = {
    free: { sub: 'Free', subBg: 'var(--surface-2)', subColor: 'var(--muted)' },
    start: { sub: 'Start', subBg: 'rgba(59,130,246,.12)', subColor: '#3b82f6' },
    pro: { sub: 'Pro', subBg: 'rgba(245,95,22,.14)', subColor: '#F55F16' },
  };
  
  const avatars = ['#ec4899','#3b82f6','#16a34a','#a855f7','#f59e0b','#06b6d4','#ef4444','#8b5cf6'];
  
  const [usersData, setUsersData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data, error: funcError } = await supabase.functions.invoke('ybytu-admin-users');
        if (funcError) throw funcError;

        if (isMounted && data) {
          const mapped = data.map((u, i) => {
            const subName = u.resolvedSub || 'Free';
            let subKey = 'free';
            if (subName.toLowerCase().includes('start')) subKey = 'start';
            else if (subName.toLowerCase().includes('pro')) subKey = 'pro';

            const initialsStr = (u.full_name || 'U').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

            return {
              id: u.id,
              initials: initialsStr,
              name: u.full_name || 'Usuário',
              meta: `ID: ${u.id.substring(0, 8)}`,
              subKey,
              ...SUB[subKey],
              goal: u.resolvedGoals?.[0] || '—',
              level: u.resolvedLevel || '—',
              trainPlan: u.current_training_plan_id ? 'Sim' : '—',
              mealPlan: u.current_meal_plan_id ? 'Sim' : '—',
              // Sem tabela de treino/refeicao concluido no schema hoje -- nao
              // ha adesao real pra calcular. Antes disso era Math.random(),
              // recalculado a cada render (achado 2026-09-05): mesmo aluno
              // mostrava numero diferente a cada reload, como se fosse medicao
              // real. "Sem dados ainda" e o padrao ja usado em Dashboard.jsx/
              // Subscriptions.jsx/Account.jsx pro mesmo tipo de ausencia.
              adherence: null,
              onbDone: u.onboarding_completed,
              avatarBg: avatars[i % avatars.length],
              needsReview: u.needsReview
            };
          });
          setUsersData(mapped);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchUsers();
    return () => { isMounted = false; };
  }, []);

  // Paginacao real (mesmo padrao de Exercises.jsx) -- ate 2026-09-05 os
  // controles "Mostrando 1-8 de 12.450" / botoes 1 2 3 eram so texto/JSX sem
  // onClick nenhum: a tabela renderizava usersData inteiro, filtrado so pela
  // busca, sem fatiar nada. Mesma categoria do achado de adesao fabricada --
  // UI prometendo paginas que nao existiam.
  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return usersData.filter((u) => u.name.toLowerCase().includes(s) || u.id.toLowerCase().includes(s));
  }, [usersData, searchTerm]);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const paged = useMemo(() => filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE), [filtered, pageSafe]);
  const pageStart = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  return (
    <>
      {/* ===================== HEADER ===================== */}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 100% { transform: rotate(360deg); } }` }}></style>
<header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
          <input type="text" placeholder="Buscar por nome, ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '9px 14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"></path></svg> Exportar
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M19 8v6M22 11h-6"></path></svg> Convidar
          </button>
        </div>
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '22px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.02em', margin: 0, textTransform: 'uppercase' }}>Usuários</h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Base de usuários do app com perfil, assinatura, planos atribuídos e adesão. <strong style={{ color: 'var(--text)' }}>{isLoading ? '—' : usersData.length}</strong> usuários.</p>
          </div>

          {/* Stat strip -- os 4 valores eram fixos, copiados do mockup, nunca
              trocados por dado real (achado 2026-09-05). "Onboarding completo"
              e "Assinantes pagos" SÃO calculáveis agora, do que já está em
              usersData -- não é dado ausente, só não estava sendo calculado.
              "Ativos (30d)" e "Adesão média" continuam "—": exigiriam rastreio
              de sessão/atividade e de treino/refeição concluído que não
              existe hoje (mesma ausência já registrada em
              docs/PENDENCIAS_USERDETAIL_POS_PILOTO_20260904.md). */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }} title="Exige rastreio de sessão/atividade, que não existe hoje">
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Ativos (30d)</p>
              <p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: 900, color: 'var(--muted)' }}>—</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Onboarding completo</p>
              <p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: 900 }}>{isLoading || usersData.length === 0 ? '—' : Math.round(100 * usersData.filter(u => u.onbDone).length / usersData.length)}{!isLoading && usersData.length > 0 && <span style={{ fontSize: '14px', color: 'var(--muted)' }}>%</span>}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Assinantes pagos</p>
              <p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: 900, color: 'var(--brand)' }}>{isLoading ? '—' : usersData.filter(u => u.subKey !== 'free').length}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }} title="Exige rastreio de treino/refeição concluído, que não existe hoje">
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Adesão média</p>
              <p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: 900, color: 'var(--muted)' }}>—</p>
            </div>
          </div>

          {/* Filters[cite: 8] */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Qualquer assinatura</option><option>Free</option><option>Start</option><option>Pro</option></select>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Qualquer objetivo</option><option>Emagrecimento</option><option>Hipertrofia</option><option>Condicionamento</option></select>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Onboarding</option><option>Completo</option><option>Incompleto</option></select>
            <select style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>Adesão</option><option>Alta (≥80%)</option><option>Média (40–79%)</option><option>Baixa (&lt;40%)</option></select>
          </div>

          {/* Table[cite: 8] */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    <th style={{ width: '44px', textAlign: 'center', padding: '13px 16px' }}><input type="checkbox" style={{ width: '15px', height: '15px', accentColor: 'var(--brand)' }} /></th>
                    <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Usuário</th>
                    <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Assinatura</th>
                    <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Objetivo / Nível</th>
                    <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Planos atuais</th>
                    <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Adesão (30d)</th>
                    <th style={{ textAlign: 'center', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Onboarding</th>
                    <th style={{ textAlign: 'right', padding: '13px 16px', fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>

                  {isLoading && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                        <p style={{ margin: '8px 0 0', fontSize: '13px', fontWeight: 600 }}>Carregando usuários...</p>
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--red)' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Erro ao carregar usuários: {error}</p>
                      </td>
                    </tr>
                  )}
                  {!isLoading && !error && filtered.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Nenhum usuário encontrado.</p>
                      </td>
                    </tr>
                  )}
                  {!isLoading && !error && paged.map((u) => (
                    <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ textAlign: 'center', padding: '12px 16px' }}><input type="checkbox" style={{ width: '15px', height: '15px', accentColor: 'var(--brand)' }} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link to={`/users/${u.id}`} style={{ display: 'flex', alignItems: 'center', gap: '13px', textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: u.avatarBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0, position: 'relative' }}>
                             {u.initials}
                             {u.needsReview && (
                                <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, background: 'var(--red)', borderRadius: '50%', border: '2px solid var(--surface)' }} title="Parecer pendente"></span>
                             )}
                          </div>
                          <div><p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{u.name}</p><p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{u.meta}</p></div>
                        </Link>
                      </td>
                      <td style={{ padding: '12px 16px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 11px', borderRadius: '7px', fontSize: '12px', fontWeight: 800, background: u.subBg, color: u.subColor }}>{u.sub}</span></td>
                      <td style={{ padding: '12px 16px' }}><div><p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{u.goal}</p><p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{u.level}</p></div></td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F55F16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> {u.trainPlan}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg> {u.mealPlan}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }} title="Exige rastreio de treino/refeição concluído, que não existe hoje">
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>Sem dados ainda</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {u.onbDone ? (
                          <span title="Onboarding completo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(22,163,74,.12)', color: '#16a34a' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg></span>
                        ) : (
                          <span title="Onboarding incompleto" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(217,119,6,.14)', color: '#d97706' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4M12 16h.01"></path><circle cx="12" cy="12" r="9"></circle></svg></span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Link to={`/users/${u.id}`} style={{ display: 'inline-flex', color: 'var(--muted)', padding: '6px', borderRadius: '8px', textDecoration: 'none' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginacao real -- antes eram controles decorativos (sem
                onClick) sobre uma tabela que renderizava tudo de uma vez.
                Mesmo padrao/PAGE_SIZE de Exercises.jsx. */}
            {!isLoading && !error && filtered.length > 0 && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)', background: 'var(--bg)', flexWrap: 'wrap', gap: '10px' }}>
                <span>Mostrando <strong style={{ color: 'var(--text)' }}>{pageStart}–{pageEnd}</strong> de {filtered.length} usuários</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--muted)', fontWeight: 700, fontSize: '13px', cursor: pageSafe === 1 ? 'not-allowed' : 'pointer', opacity: pageSafe === 1 ? 0.5 : 1, fontFamily: 'inherit' }}>Anterior</button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, pageSafe - 3), pageSafe + 2).map((p) => (
                    <button key={p} onClick={() => setPage(p)} style={{ padding: '6px 12px', border: p === pageSafe ? 'none' : '1px solid var(--border)', borderRadius: '8px', background: p === pageSafe ? 'var(--brand)' : 'var(--surface)', color: p === pageSafe ? '#fff' : 'var(--text)', fontWeight: p === pageSafe ? 800 : 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={pageSafe === pageCount} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, fontSize: '13px', cursor: pageSafe === pageCount ? 'not-allowed' : 'pointer', opacity: pageSafe === pageCount ? 0.5 : 1, fontFamily: 'inherit' }}>Próximo</button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}