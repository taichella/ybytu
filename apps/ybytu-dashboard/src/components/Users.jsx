import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Users() {
  const [theme, setTheme] = useState('dark');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sincroniza o tema
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const { supabase } = await import('../lib/supabase.js');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase.functions.invoke('ybytu-get-users-for-staff', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!error && data) {
          setUsers(data);
        }
      } catch (err) {
        console.error('Failed to load users', err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const SUB = {
    free: { sub: 'Free', subBg: 'var(--surface-2)', subColor: 'var(--muted)' },
    start: { sub: 'Start', subBg: 'rgba(59,130,246,.12)', subColor: '#3b82f6' },
    pro: { sub: 'Pro', subBg: 'rgba(245,95,22,.14)', subColor: '#F55F16' },
  };
  
  const getAdColor = (v) => v >= 80 ? '#16a34a' : (v >= 40 ? '#d97706' : '#ef4444');
  const avatars = ['#ec4899','#3b82f6','#16a34a','#a855f7','#f59e0b','#06b6d4','#ef4444','#8b5cf6'];
  
  function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
  }

  const usersData = users.map((u, i) => {
    const fullName = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Usuário Sem Nome';
    const gender = u.gender_id === 'female' ? 'F' : (u.gender_id === 'male' ? 'M' : '?');

    // Simplification for prototype mapping
    const subKey = 'free'; // default to free if we don't have accurate mapping here

    return {
      id: u.id,
      initials: initials(fullName),
      name: fullName,
      meta: `${u.age || '?'} anos · ${gender} · Brasil`,
      subKey,
      goal: u.goals_ids?.length ? u.goals_ids[0].split('_')[0] : 'Indefinido',
      level: u.exercise_level_id || 'Iniciante',
      trainPlan: u.current_training_plan_id ? 'Plano Atribuído' : '—',
      mealPlan: u.current_meal_plan_id ? 'Plano Atribuído' : '—',
      adherence: Math.floor(Math.random() * 100), // mock adherence since it's not stored yet
      onbDone: u.plan_generation_status !== 'pending',
      ...SUB[subKey],
      adColor: getAdColor(Math.floor(Math.random() * 100)),
      avatarBg: avatars[i % avatars.length]
    }
  });

  return (
    <>
      {/* ===================== HEADER ===================== */}
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
          <input type="text" placeholder="Buscar por nome, e-mail…" style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
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
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '5px 0 0' }}>Base de usuários do app com perfil, assinatura, planos atribuídos e adesão. <strong style={{ color: 'var(--text)' }}>12.450</strong> usuários.</p>
          </div>

          {/* Stat strip[cite: 8] */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Ativos (30d)</p><p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: 900 }}>8.230</p></div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Onboarding completo</p><p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: 900 }}>76<span style={{ fontSize: '14px', color: 'var(--muted)' }}>%</span></p></div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Assinantes pagos</p><p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: 900, color: 'var(--brand)' }}>3.910</p></div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}><p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Adesão média</p><p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: 900 }}>71<span style={{ fontSize: '14px', color: 'var(--muted)' }}>%</span></p></div>
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
                  {loading && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                        Carregando usuários...
                      </td>
                    </tr>
                  )}
                  {!loading && usersData.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                  {!loading && usersData.map((u, index) => (
                    <tr key={index} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ textAlign: 'center', padding: '12px 16px' }}><input type="checkbox" style={{ width: '15px', height: '15px', accentColor: 'var(--brand)' }} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link to={`/users/${u.id}`} style={{ display: 'flex', alignItems: 'center', gap: '13px', textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: u.avatarBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>{u.initials}</div>
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
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{ width: '64px', height: '7px', borderRadius: '4px', background: 'var(--surface-2)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${u.adherence}%`, background: u.adColor, borderRadius: '4px' }}></div>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: u.adColor }}>{u.adherence}%</span>
                        </div>
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

            {/* Pagination[cite: 8] */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)', background: 'var(--bg)', flexWrap: 'wrap', gap: '10px' }}>
              <span>Mostrando <strong style={{ color: 'var(--text)' }}>1–8</strong> de 12.450 usuários</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--muted)', fontWeight: 700, fontSize: '13px', cursor: 'not-allowed', opacity: .5, fontFamily: 'inherit' }}>Anterior</button>
                <button style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>1</button>
                <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>2</button>
                <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>3</button>
                <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Próximo</button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}