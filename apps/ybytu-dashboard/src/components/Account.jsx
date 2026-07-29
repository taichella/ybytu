import { useState, useEffect, useRef } from 'react';

export default function Account() {
  const [theme, setTheme] = useState('dark');
  const [tab, setTab] = useState('perfil'); // 'perfil', 'assinatura', 'equipe'
  const [toast, setToast] = useState(false);
  const [prefs, setPrefs] = useState([true, true, false, true]);
  
  const timerRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Limpa o timer caso o componente seja desmontado para evitar leaks de memória
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleSave = () => {
    setToast(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(false), 3200);
  };
  const hideToast = () => {
    setToast(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const tabs = [
    { id: 'perfil', label: 'Meu Perfil' },
    { id: 'assinatura', label: 'Assinatura & Faturamento' },
    { id: 'equipe', label: 'Equipe' }
  ];

  const togglePref = (i) => setPrefs(prev => {
    const next = [...prev];
    next[i] = !next[i];
    return next;
  });

  const prefsList = [
    { title: 'Novas inscrições', desc: 'Notifique-me quando um novo aluno entrar.' },
    { title: 'Planos vencendo', desc: 'Alertas de alunos que precisam renovar.' },
    { title: 'Feedback de treino', desc: 'Quando o aluno completar um treino e avaliar.' },
    { title: 'Atualizações do produto', desc: 'Novidades e mudanças na plataforma Ybytu.' },
  ];

  const team = [
    { id: 1, initials: 'A', name: 'Admin Principal', email: 'admin · Ybytu', role: 'Super Admin', roleBg: 'rgba(245,95,22,.14)', roleColor: '#F55F16', avatarBg: '#F55F16' },
    { id: 2, initials: 'BC', name: 'Bruno Coach', email: 'bruno · Ybytu', role: 'Editor', roleBg: 'rgba(59,130,246,.12)', roleColor: '#3b82f6', avatarBg: '#ec4899' },
    { id: 3, initials: 'NT', name: 'Nutri Tatiane', email: 'tatiane · Ybytu', role: 'Editor', roleBg: 'rgba(59,130,246,.12)', roleColor: '#3b82f6', avatarBg: '#16a34a' },
    { id: 4, initials: 'SF', name: 'Sofia Finance', email: 'sofia · Ybytu', role: 'Visualizador', roleBg: 'var(--surface-2)', roleColor: 'var(--muted)', avatarBg: '#a855f7' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}><span>Configurações</span><span>/</span><span style={{ color: 'var(--text)' }}>Minha conta</span></div>
          <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900 }}>Minha Conta</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* TABS HEADER */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border)', padding: '0 28px', display: 'flex', gap: '20px' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', padding: '16px 0',
              fontSize: '13px', fontWeight: 800, fontFamily: 'inherit',
              color: tab === t.id ? 'var(--brand)' : 'var(--muted)',
              borderBottom: tab === t.id ? '3px solid var(--brand)' : '3px solid transparent',
              cursor: 'pointer'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* PERFIL */}
          {tab === 'perfil' && (
            <>
              {/* Card Dados Pessoais */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 900 }}>Dados Pessoais</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900 }}>
                    A
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Trocar foto</button>
                      <button style={{ background: 'none', border: '1px solid transparent', color: '#ef4444', padding: '8px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Remover</button>
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--muted)' }}>Formatos suportados: JPG, PNG ou GIF (máx. 2MB)</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Nome Completo</label>
                    <input type="text" defaultValue="Admin Principal" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>E-mail</label>
                    <input type="text" defaultValue="admin@ybytu.app" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Bio Curta</label>
                    <textarea defaultValue="Treinador especialista em hipertrofia e performance. Criador da metodologia Ybytu." rows="3" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 500, outline: 'none', resize: 'vertical' }}></textarea>
                  </div>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleSave} style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>Salvar Alterações</button>
                </div>
              </section>

              {/* Card Notificações */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Preferências de Notificação</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Escolha o que você quer receber no seu e-mail.</p>
                </div>
                <div style={{ padding: '8px 24px' }}>
                  {prefsList.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < prefsList.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{p.title}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{p.desc}</p>
                      </div>
                      <button onClick={() => togglePref(i)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: prefs[i] ? 'var(--brand)' : 'var(--surface-2)', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all .2s' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: prefs[i] ? '23px' : '3px', transition: 'all .2s', boxShadow: '0 2px 5px rgba(0,0,0,.2)' }}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ASSINATURA */}
          {tab === 'assinatura' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', background: 'rgba(245,95,22,.1)', color: 'var(--brand)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Plano Ativo</span>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>Ybytu Pro</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>Até 100 alunos · Relatórios Avançados · IA Ilimitada</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>R$ 149<span style={{ fontSize: '14px', color: 'var(--muted)' }}>/mês</span></p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Próxima cobrança em 15/09/2025</p>
                </div>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 900 }}>Método de Pagamento</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--field)' }}>
                  <div style={{ width: '48px', height: '32px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px', color: '#3b82f6' }}>VISA</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Visa terminando em 4242</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Expira em 12/28</p>
                  </div>
                  <button style={{ background: 'var(--surface-2)', border: 'none', padding: '8px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>Atualizar</button>
                </div>
              </div>
            </section>
          )}

          {/* EQUIPE */}
          {tab === 'equipe' && (
            <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Membros da Equipe</h3>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--brand-soft)', color: 'var(--brand)', border: 'none', borderRadius: '9px', padding: '8px 13px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Convidar membro
                </button>
              </div>
              <div>
                {team.map((m) => (
                  <div key={m.id} className="yb-hover-row" style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '15px 24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: m.avatarBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>{m.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{m.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{m.email}</p>
                    </div>
                    <span style={{ display: 'inline-flex', padding: '4px 11px', borderRadius: '7px', fontSize: '12px', fontWeight: 800, background: m.roleBg, color: m.roleColor }}>{m.role}</span>
                    <button style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      {/* SNACKBAR (TOAST) */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 80, display: 'flex', alignItems: 'center', gap: '11px', background: 'var(--text)', color: 'var(--bg)', padding: '13px 18px', borderRadius: '13px', boxShadow: '0 12px 40px rgba(0,0,0,.28)', animation: 'ybToastIn .25s ease-out both' }}>
          <span style={{ display: 'inline-flex', width: '24px', height: '24px', borderRadius: '50%', background: '#16a34a', color: '#fff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700 }}>Alterações salvas com sucesso</span>
          <button onClick={hideToast} style={{ background: 'none', border: 'none', color: 'var(--bg)', opacity: .6, cursor: 'pointer', display: 'flex', padding: '2px', marginLeft: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
          </button>
        </div>
      )}
    </div>
  );
}
