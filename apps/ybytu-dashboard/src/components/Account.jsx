import { useState, useEffect, useRef } from 'react';

export default function Account() {
  const [theme, setTheme] = useState('dark');
  const [tab, setTab] = useState('perfil'); // 'perfil', 'seguranca', 'pref', 'equipe'
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
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(false);
  };

  const togglePref = (index) => {
    const newPrefs = [...prefs];
    newPrefs[index] = !newPrefs[index];
    setPrefs(newPrefs);
  };

  const tabStyle = (isActive) => ({
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, padding: '11px 16px', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
    color: isActive ? 'var(--brand)' : 'var(--muted)'
  });

  const trackStyle = (isOn) => ({
    flexShrink: 0, width: '42px', height: '24px', borderRadius: '999px', position: 'relative', transition: 'background .2s',
    background: isOn ? 'var(--brand)' : 'var(--surface-2)',
    border: `1px solid ${isOn ? 'var(--brand)' : 'var(--border)'}`
  });

  const thumbStyle = (isOn) => ({
    position: 'absolute', top: '2px', left: '2px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'transform .2s',
    transform: `translateX(${isOn ? '18px' : '0'})`, boxShadow: '0 1px 3px rgba(0,0,0,.25)'
  });

  // Dados Mocados[cite: 17]
  const sessions = [
    { id: 1, icon: '💻', device: 'MacBook Pro · Chrome', where: 'São Paulo, BR · 192.168.0.1', current: true, canRevoke: false },
    { id: 2, icon: '📱', device: 'iPhone 15 · App', where: 'São Paulo, BR · há 3 horas', current: false, canRevoke: true },
  ];

  const prefDefs = [
    { title: 'Novos usuários', desc: 'Receba um e-mail quando um novo usuário se cadastrar.' },
    { title: 'Falhas de pagamento', desc: 'Avisos sobre cobranças recusadas ou estornos.' },
    { title: 'Resumo semanal', desc: 'Relatório consolidado de métricas toda segunda.' },
    { title: 'Atualizações do produto', desc: 'Novidades e mudanças na plataforma Ybytu.' },
  ];

  const team = [
    { id: 1, initials: 'A', name: 'Admin Principal', email: 'admin · Ybytu', role: 'Super Admin', roleBg: 'rgba(245,95,22,.14)', roleColor: '#F55F16', avatarBg: '#F55F16' },
    { id: 2, initials: 'BC', name: 'Bruno Coach', email: 'bruno · Ybytu', role: 'Editor', roleBg: 'rgba(59,130,246,.12)', roleColor: '#3b82f6', avatarBg: '#ec4899' },
    { id: 3, initials: 'NT', name: 'Nutri Tatiane', email: 'tatiane · Ybytu', role: 'Editor', roleBg: 'rgba(59,130,246,.12)', roleColor: '#3b82f6', avatarBg: '#16a34a' },
    { id: 4, initials: 'SF', name: 'Sofia Finance', email: 'sofia · Ybytu', role: 'Visualizador', roleBg: 'var(--surface-2)', roleColor: 'var(--muted)', avatarBg: '#a855f7' },
  ];

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}><span>Configurações</span><span>/</span><span style={{ color: 'var(--text)' }}>Minha conta</span></div>
          <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900 }}>Minha Conta</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"></path><path d="M17 21v-8H7v8M7 3v5h8"></path></svg> Salvar alterações
          </button>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>

          {/* Profile Hero[cite: 17] */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px', marginBottom: '22px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '76px', height: '76px', borderRadius: '20px', background: 'linear-gradient(135deg,#F55F16,#FF7A3D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '28px', color: '#fff' }}>A</div>
              <button title="Trocar foto" style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"></path><circle cx="12" cy="13" r="3"></circle></svg>
              </button>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>Admin Principal</h1>
                <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, background: 'rgba(245,95,22,.14)', color: '#F55F16', textTransform: 'uppercase' }}>Super Admin</span>
              </div>
              <p style={{ margin: '5px 0 0', fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>admin Ybytu · Acesso total · Membro desde jan 2025</p>
            </div>
          </div>

          {/* TABS[cite: 17] */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', marginBottom: '22px', overflowX: 'auto' }}>
            <button onClick={() => setTab('perfil')} style={tabStyle(tab === 'perfil')}>Perfil</button>
            <button onClick={() => setTab('seguranca')} style={tabStyle(tab === 'seguranca')}>Segurança</button>
            <button onClick={() => setTab('pref')} style={tabStyle(tab === 'pref')}>Preferências</button>
            <button onClick={() => setTab('equipe')} style={tabStyle(tab === 'equipe')}>Equipe & permissões</button>
          </div>

          {/* PERFIL */}
          {tab === 'perfil' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 18px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Informações Pessoais</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nome</label><input type="text" defaultValue="Admin" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Sobrenome</label><input type="text" defaultValue="Principal" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>E-mail</label><input type="text" defaultValue="admin@ybytu.com" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Telefone</label><input type="text" defaultValue="+55 11 91234-5678" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Cargo / Função</label><input type="text" defaultValue="Administrador da plataforma" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} /></div>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Idioma & Região</h3>
                <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'var(--muted)' }}>Afeta apenas o painel administrativo.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Idioma do painel</label><select style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>🇧🇷 Português (Brasil)</option><option>🇬🇧 English</option><option>🇫🇷 Français</option></select></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Fuso horário</label><select style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600, outline: 'none', cursor: 'pointer' }}><option>(GMT-3) São Paulo</option><option>(GMT-5) Nova York</option><option>(GMT+1) Paris</option></select></div>
                </div>
              </section>
            </div>
          )}

          {/* SEGURANÇA */}
          {tab === 'seguranca' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 18px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Alterar Senha</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '440px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Senha atual</label><input type="password" defaultValue="********" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nova senha</label><input type="password" placeholder="Mínimo 8 caracteres" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Confirmar nova senha</label><input type="password" placeholder="Repita a nova senha" style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} /></div>
                  <button onClick={handleSave} style={{ alignSelf: 'flex-start', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '11px 20px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Atualizar senha</button>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Autenticação em 2 fatores</h3>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>Adicione uma camada extra de segurança exigindo um código além da senha.</p>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, background: 'rgba(22,163,74,.12)', color: '#16a34a' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }}></span> Ativo
                  </span>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}><h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Sessões Ativas</h3></div>
                <div>
                  {sessions.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 24px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{s.device} {s.current && <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', marginLeft: '6px' }}>· esta sessão</span>}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{s.where}</p>
                      </div>
                      {s.canRevoke && (
                        <button style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Encerrar</button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* PREFERÊNCIAS */}
          {tab === 'pref' && (
            <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}><h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Notificações por E-mail</h3></div>
              <div>
                {prefDefs.map((p, i) => (
                  <div key={i} className="yb-hover-row" onClick={() => togglePref(i)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 24px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{p.title}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{p.desc}</p>
                    </div>
                    <span style={trackStyle(prefs[i])}><span style={thumbStyle(prefs[i])}></span></span>
                  </div>
                ))}
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

    {/* SNACKBAR (TOAST)[cite: 17] */}
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

  </>
  );
}