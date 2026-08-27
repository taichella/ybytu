import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { StaffContext } from '../lib/staffContextCore';

const VALID_TABS = new Set(['overview', 'health', 'plans', 'activity']);

// Mesmas opções do passo "meals_per_day" do onboarding (OnboardingPreLaunch.html)
// -- profiles.meals_per_day guarda só o número (3-6), o rótulo nunca foi
// resolvido aqui, aparecia cru ("5 refeições") em vez do que a pessoa
// escolheu. Bug encontrado 2026-08-22 (teste E2E da Taina).
const MEALS_PER_DAY_LABELS = {
  3: '3 refeições principais',
  4: '3 refeições + 1 lanche',
  5: '3 refeições + 2 lanches',
  6: '3 refeições + 3 lanches',
};

export default function UserDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [theme, setTheme] = useState('dark');
  // Botão "Visit website" de template do WhatsApp na Meta só aceita um
  // sufixo dinâmico simples (sem query string -- risco de rejeição no
  // cadastro do template, confirmado 2026-08-10). Por isso a rota
  // /review/:id (base separada, cadastrada na Meta) força a aba de plano
  // direto, em vez de mandar ?tab=plans na URL. ?tab= continua funcionando
  // pra quem navegar manualmente/via outros links internos.
  const [tab, setTab] = useState(() => {
    if (location.pathname.startsWith('/review/')) return 'plans';
    const requested = searchParams.get('tab');
    return VALID_TABS.has(requested) ? requested : 'overview';
  });
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleBlock = () => setIsBlocked(!isBlocked);

  const tabStyle = (isActive) => ({
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, padding: '11px 16px', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
    color: isActive ? 'var(--brand)' : 'var(--muted)'
  });


  const { id } = useParams();
  // StaffContext.Provider carrega { fullName, roles } diretamente (ver
  // staffContextCore.js) -- não um objeto encapado num .staff. Era lido
  // como useContext(StaffContext)?.staff aqui, que é sempre undefined,
  // quebrando silenciosamente o seletor de papel do parecer e (agora) o
  // editable de carga -- achado na varredura de qualidade de 2026-08-10.
  const staff = useContext(StaffContext);

  const [userData, setUserData] = useState(null);
  const [resolvedLabels, setResolvedLabels] = useState({});
  const [planPayload, setPlanPayload] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [notePtbr, setNotePtbr] = useState('');
  const [reviewRole, setReviewRole] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Rótulo do veredito do parecer (não confundir com planStatus, que é o
  // ciclo de vida do PLANO — rascunho/aguardando/validado). Este é o
  // resultado que o profissional deu: aprovado ou pediu ajuste. Pareceres
  // antigos (antes da migration 20260827130000) têm status null — sem badge.
  function reviewVerdict(status) {
    if (status === 'approved') return { label: 'Aprovado', bg: 'rgba(22,163,74,.12)', color: '#16a34a' };
    if (status === 'needs_changes') return { label: 'Ajuste solicitado', bg: 'rgba(217,119,6,.12)', color: '#d97706' };
    return null;
  }

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [userRes, planRes] = await Promise.all([
          supabase.functions.invoke('ybytu-admin-users', { body: { id } }),
          supabase.functions.invoke('ybytu-get-plan-for-staff', { body: { userId: id } })
        ]);

        if (userRes.error) throw userRes.error;
        // Do not throw on planRes.error, it might be that user has no plan, or let's handle gracefully

        if (isMounted) {
          if (userRes.data && userRes.data.profile) {
            setUserData(userRes.data.profile);
            setResolvedLabels(userRes.data.resolved || {});
          }
          if (planRes.data && !planRes.error) {
            setPlanPayload(planRes.data);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (id) fetchData();
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (staff && staff.roles) {
      if (staff.roles.includes('personal')) setReviewRole('personal');
      else if (staff.roles.includes('nutricionista')) setReviewRole('nutricionista');
    }
  }, [staff]);

  // Status computado (#2) -- nunca um campo novo no schema: is_active
  // (rascunho/publicado, controlado por ybytu-admin-trainings/-meal-plans)
  // cruzado com plan_reviews (parecer do personal pro treino, do
  // nutricionista pra nutrição). Ver buildPlanPayload.ts pra origem de is_active.
  function planStatus(isActive, hasReview) {
    if (!isActive) return { label: 'Rascunho', bg: 'var(--surface-2)', color: 'var(--muted)' };
    if (!hasReview) return { label: 'Aguardando validação', bg: 'rgba(217,119,6,.12)', color: '#d97706' };
    return { label: 'Validado', bg: 'rgba(22,163,74,.12)', color: '#16a34a' };
  }

  const submitReview = async () => {
    if (!notePtbr.trim()) return alert("Digite um parecer antes de enviar.");
    if (!reviewRole) return alert("Selecione o papel do avaliador.");
    if (!reviewStatus) return alert("Selecione o resultado: aprovado ou ajuste solicitado.");

    setIsSubmittingReview(true);
    try {
       const res = await supabase.functions.invoke('ybytu-submit-plan-review', {
          body: {
            user_id: id,
            role: reviewRole,
            note_ptbr: notePtbr,
            status: reviewStatus,
            // training_plan_id aqui precisa ser o slug texto (training_plans.training_plan_id),
            // não o uuid de profiles.current_training_plan_id -- plan_reviews.training_plan_id
            // tem FK pra training_plans.training_plan_id (texto). Usar o uuid quebrava o upsert
            // com violação de FK (500 silencioso pro usuário). Achado testando o fluxo ao vivo,
            // 2026-08-16.
            training_plan_id: planPayload?.training?.training_plan_id ?? null
          }
       });
       if (res.error) throw res.error;
       alert("Parecer salvo com sucesso!");
       setNotePtbr('');
       setReviewStatus('');
       // Refresh plan payload to get the new review
       const planRes = await supabase.functions.invoke('ybytu-get-plan-for-staff', { body: { userId: id } });
       if (planRes.data && !planRes.error) {
         setPlanPayload(planRes.data);
       }
    } catch(err) {
       alert("Erro ao salvar parecer: " + err.message);
    } finally {
       setIsSubmittingReview(false);
    }
  };

  const initialsStr = userData?.full_name ? userData.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : 'U';
  const isActive = userData?.subscription_type_id ? true : false;
  const isBlockedMode = isBlocked;

  const memberSinceLabel = userData?.created_at
    ? new Date(userData.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    : null;

  // IMC: peso(kg) / altura(m)^2 -- classificação padrão OMS, mesmas faixas
  // que o design mostra (ex: "22.7 · Saudável").
  let imc = null;
  if (userData?.weight_kg && userData?.height_cm) {
    const heightM = userData.height_cm / 100;
    const value = userData.weight_kg / (heightM * heightM);
    let label = 'Abaixo do peso', color = '#3b82f6';
    if (value >= 30) { label = 'Obesidade'; color = 'var(--danger)'; }
    else if (value >= 25) { label = 'Sobrepeso'; color = '#d97706'; }
    else if (value >= 18.5) { label = 'Saudável'; color = '#16a34a'; }
    imc = { value: value.toFixed(1), label, color };
  }

  const lastSignInLabel = resolvedLabels.lastSignInAt
    ? new Date(resolvedLabels.lastSignInAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Nunca acessou';

  if (isLoading) {
    return <main style={{ padding: '40px', textAlign: 'center' }}><p>Carregando perfil...</p></main>;
  }
  if (error) {
    return <main style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}><p>Erro: {error}</p></main>;
  }
  if (!userData) {
    return <main style={{ padding: '40px', textAlign: 'center' }}><p>Usuário não encontrado.</p></main>;
  }

  return (
    <>
      <header style={{ height: '72px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button onClick={() => navigate('/users')} style={{ display: 'inline-flex', width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>Usuários</span><span>/</span><span style={{ color: 'var(--text)' }}>Perfil</span>
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userData.full_name}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={toggleTheme} title="Alternar tema" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={toggleBlock} style={{ background: isBlocked ? 'rgba(239,68,68,.1)' : 'var(--surface)', color: isBlocked ? 'var(--danger)' : 'var(--text)', border: `1px solid ${isBlocked ? 'var(--danger)' : 'var(--border)'}`, borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            {isBlocked ? 'Desbloquear Conta' : 'Bloquear Usuário'}
          </button>
          <button style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Mensagem</button>
          <button onClick={() => navigate('/trainings')} title="Escolher/criar outro plano de treino no catálogo" style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '11px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,95,22,.25)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> Reatribuir plano
          </button>
        </div>
      </header>


      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>

          {/* Profile Hero (Avatar à frente e SVG decorativo laranja)[cite: 9] */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', marginBottom: '22px', opacity: isBlocked ? 0.6 : 1, transition: 'opacity 0.3s' }}>
            <div style={{ height: '84px', background: isBlocked ? 'var(--border)' : 'linear-gradient(135deg,#F55F16,#FF7A3D)', position: 'relative' }}>
              <svg viewBox="119 94 275 323" style={{ position: 'absolute', right: '-30px', top: '-40px', width: '200px', opacity: '.14' }} fill="#fff"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
            </div>
            <div style={{ padding: '0 24px 22px', display: 'flex', alignItems: 'flex-end', gap: '18px', flexWrap: 'wrap', marginTop: '-36px' }}>
              <div style={{ width: '84px', height: '84px', borderRadius: '22px', background: isBlocked ? 'var(--muted)' : '#ec4899', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '30px', border: '4px solid var(--surface)', flexShrink: 0, zIndex: 10 }}>{initialsStr}</div>
              <div style={{ flex: 1, minWidth: '200px', paddingBottom: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-.02em', textDecoration: isBlocked ? 'line-through' : 'none' }}>{userData.full_name}</h1>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, background: 'rgba(245,95,22,.14)', color: '#F55F16', textTransform: 'uppercase' }}>{resolvedLabels.subscriptionName || 'Free'}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, background: isBlocked ? 'rgba(239,68,68,.12)' : 'rgba(22,163,74,.12)', color: isBlocked ? 'var(--danger)' : '#16a34a', textTransform: 'uppercase' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isBlocked ? 'var(--danger)' : '#16a34a' }}></span> {isBlocked ? 'Inativo' : 'Ativo'}
                  </span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>
                  {memberSinceLabel ? `Membro desde ${memberSinceLabel} · ` : ''}ID {userData.id.slice(0, 4)}…{userData.id.slice(-4)}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', marginBottom: '22px', overflowX: 'auto' }}>
            <button onClick={() => setTab('overview')} style={tabStyle(tab === 'overview')}>Visão geral</button>
            <button onClick={() => setTab('health')} style={tabStyle(tab === 'health')}>Saúde & metas</button>
            <button onClick={() => setTab('plans')} style={tabStyle(tab === 'plans')}>Planos atribuídos</button>
            <button onClick={() => setTab('activity')} style={tabStyle(tab === 'activity')}>Atividade & adesão</button>
          </div>

          {/* ===== TAB: VISÃO GERAL ===== */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Dados Pessoais</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Nome completo</span><span style={{ fontWeight: 700 }}>{userData.full_name}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Sexo</span><span style={{ fontWeight: 700 }}>{resolvedLabels.gender || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Idade</span><span style={{ fontWeight: 700 }}>{userData.age ? `${userData.age} anos` : '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Peso</span><span style={{ fontWeight: 700 }}>{userData.weight_kg ? `${userData.weight_kg} kg` : '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Altura</span><span style={{ fontWeight: 700 }}>{userData.height_cm ? `${userData.height_cm} cm` : '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 600 }}>IMC</span>
                    <span style={{ fontWeight: 800, color: imc ? imc.color : 'var(--muted)' }}>{imc ? `${imc.value} · ${imc.label}` : '—'}</span>
                  </div>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Conta & Assinatura</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Plano</span><span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, background: 'rgba(245,95,22,.14)', color: '#F55F16' }}>{resolvedLabels.subscriptionName || 'Free'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Onboarding</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 800, color: userData.onboarding_completed ? '#16a34a' : 'var(--muted)' }}>{userData.onboarding_completed ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg> Completo</> : 'Incompleto'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Último acesso</span><span style={{ fontWeight: 700 }}>{lastSignInLabel}</span></div>
                </div>
              </section>
            </div>
          )}

          {/* ===== TAB: SAÚDE & METAS ===== */}
          {tab === 'health' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Objetivos</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(resolvedLabels.goals && resolvedLabels.goals.length > 0) ? resolvedLabels.goals.map((g, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 13px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'var(--brand-soft)', color: 'var(--brand)', border: '1px solid rgba(245,95,22,.2)' }}>{g}</span>
                  )) : <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Não informado</span>}
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Condições de Saúde</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(resolvedLabels.healthConditions && resolvedLabels.healthConditions.length > 0) ? resolvedLabels.healthConditions.map((g, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 13px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,.2)' }}>{g}</span>
                  )) : <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Não informado</span>}
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Condições Físicas & Lesões</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(resolvedLabels.physicalConditions && resolvedLabels.physicalConditions.length > 0) ? resolvedLabels.physicalConditions.map((g, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 13px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'rgba(217,119,6,.12)', color: '#d97706', border: '1px solid rgba(217,119,6,.2)' }}>{g}</span>
                  )) : <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Não informado</span>}
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Restrições Alimentares</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(resolvedLabels.dietaryRestrictions && resolvedLabels.dietaryRestrictions.length > 0) ? resolvedLabels.dietaryRestrictions.map((g, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 13px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>{g}</span>
                  )) : <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Não informado</span>}
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Preferências de Treino</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Nível</span><span style={{ fontWeight: 700 }}>{resolvedLabels.exerciseLevel || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Ambiente</span><span style={{ fontWeight: 700 }}>{resolvedLabels.exerciseEnvironment || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Dias/semana</span><span style={{ fontWeight: 700 }}>{userData.training_days_per_week ? `${userData.training_days_per_week} dias` : '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Duração/sessão</span><span style={{ fontWeight: 700 }}>{userData.training_duration_minutes ? `${userData.training_duration_minutes} min` : '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', fontSize: '14px' }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>Equipamentos</span>
                    <span style={{ fontWeight: 700, textAlign: 'right' }}>{(resolvedLabels.exerciseEquipments && resolvedLabels.exerciseEquipments.length > 0) ? resolvedLabels.exerciseEquipments.join(', ') : '—'}</span>
                  </div>
                </div>
              </section>

              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Preferências Nutricionais</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Preferência</span><span style={{ fontWeight: 700 }}>{resolvedLabels.dietaryPreference || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Refeições/dia</span><span style={{ fontWeight: 700 }}>{MEALS_PER_DAY_LABELS[userData.meals_per_day] || userData.meals_per_day || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Dias/semana</span><span style={{ fontWeight: 700 }}>{userData.nutrition_days_per_week ? `${userData.nutrition_days_per_week} dias` : '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', fontSize: '14px' }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>Não gosta de</span>
                    <span style={{ fontWeight: 700, textAlign: 'right' }}>{userData.disliked_foods || '—'}</span>
                  </div>
                </div>
              </section>
            </div>
          )}


          {/* ===== TAB: PLANOS ATRIBUÍDOS ===== */}
          {tab === 'plans' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Faixa de assinatura (UsuarioDetalhe.dc.html, versão nova 2026-08-25).
                  "Desde"/"Renovação" (billing) e a pill "Acompanhamento" do mockup NÃO
                  entraram -- não existe data de assinatura/renovação nem flag de tier-pro
                  em subscription_types; ver [[project_userdetail_design_gaps_product_decisions]].
                  Flagado pra Taina antes de implementar, não inventado aqui. */}
              <section style={{ background: 'linear-gradient(135deg,#F55F16,#FF7A3D)', borderRadius: '18px', padding: '22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                  <span style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.4 9.3 8 10 4.6-.7 8-5 8-10V6Z"></path><path d="m9 12 2 2 4-4"></path></svg>
                  </span>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, letterSpacing: '.08em', opacity: .9, textTransform: 'uppercase' }}>Tipo de assinatura</p>
                    <p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: 900, letterSpacing: '-.02em' }}>{resolvedLabels.subscriptionName || 'Free'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {resolvedLabels.subscriptionIncludesTraining && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, padding: '6px 12px', borderRadius: '999px', background: 'rgba(255,255,255,.24)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> Treino</span>
                    )}
                    {resolvedLabels.subscriptionIncludesMeals && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, padding: '6px 12px', borderRadius: '999px', background: 'rgba(255,255,255,.24)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75-1.06 4-2.94 1.5-2.25 2-5.5 2-7 0-2.5-1.5-4-3.5-4-1.5 0-2.5 1-3 1.5-.5-.5-1.5-1.5-3-1.5C5 7 3.5 8.5 3.5 11c0 1.5.5 4.75 2 7 1.25 1.88 2.5 2.94 4 2.94Z"></path></svg> Nutrição</span>
                    )}
                  </div>
                </div>
                {/* Profissionais = quem já assinou parecer pra este plano (dado real,
                    plan_reviews.reviewer_name) -- só aparece o que já foi validado. */}
                {(planPayload?.review?.personal?.reviewer_name || planPayload?.review?.nutricionista?.reviewer_name) && (
                  <div style={{ position: 'relative', display: 'flex', gap: '26px', marginTop: '20px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,.22)', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 800, opacity: .85, textTransform: 'uppercase', letterSpacing: '.05em' }}>Profissionais</p>
                      <p style={{ margin: '3px 0 0', fontSize: '14px', fontWeight: 800 }}>
                        {[planPayload?.review?.personal?.reviewer_name, planPayload?.review?.nutricionista?.reviewer_name].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {planPayload ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {planPayload.training && (() => {
                      const status = planStatus(planPayload.training.is_active, Boolean(planPayload.review?.personal));
                      const verdict = reviewVerdict(planPayload.review?.personal?.status);
                      return (
                      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
                        <div style={{ height: '5px', background: 'linear-gradient(135deg,#F55F16,#FF7A3D)' }}></div>
                        <div style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                            <span style={{ width: '48px', height: '48px', borderRadius: '13px', background: 'linear-gradient(135deg,#F55F16,#FF7A3D)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 800, letterSpacing: '.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>Plano de Treino</p>
                                <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', background: status.bg, color: status.color }}>{status.label}</span>
                                {verdict && (
                                  <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', background: verdict.bg, color: verdict.color }}>Parecer: {verdict.label}</span>
                                )}
                              </div>
                              <p style={{ margin: '3px 0 0', fontSize: '17px', fontWeight: 900, letterSpacing: '-.01em' }}>{planPayload.training.name_ptbr || (resolvedLabels.goals?.length ? resolvedLabels.goals.join(' + ') : 'Plano de treino')}</p>
                              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--muted)', fontWeight: 500 }}>{planPayload.training.days_per_week} dias/sem · {planPayload.training.session_duration_min ? `${planPayload.training.session_duration_min} min/sessão` : 'duração não definida'}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => navigate(`/users/${id}/plano`)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '11px', background: 'var(--brand-soft)', color: 'var(--brand)', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg> Ver plano</button>
                            <button onClick={() => navigate('/trainings')} title="Escolher outro plano de treino no catálogo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', borderRadius: '11px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6M3 12a9 9 0 0 0 15 6.7l3-2.7"></path></svg> Trocar</button>
                          </div>
                        </div>
                      </section>
                      );
                    })()}

                    {planPayload.nutrition && (() => {
                      const status = planStatus(planPayload.nutrition.is_active, Boolean(planPayload.review?.nutricionista));
                      const verdict = reviewVerdict(planPayload.review?.nutricionista?.status);
                      return (
                      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
                        <div style={{ height: '5px', background: 'linear-gradient(135deg,#16a34a,#4ade80)' }}></div>
                        <div style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                            <span style={{ width: '48px', height: '48px', borderRadius: '13px', background: 'linear-gradient(135deg,#16a34a,#4ade80)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 800, letterSpacing: '.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>Plano Alimentar</p>
                                <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', background: status.bg, color: status.color }}>{status.label}</span>
                                {verdict && (
                                  <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', background: verdict.bg, color: verdict.color }}>Parecer: {verdict.label}</span>
                                )}
                              </div>
                              <p style={{ margin: '3px 0 0', fontSize: '17px', fontWeight: 900, letterSpacing: '-.01em' }}>{planPayload.nutrition.name_ptbr || resolvedLabels.dietaryPreference || 'Plano alimentar'}</p>
                              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--muted)', fontWeight: 500 }}>{MEALS_PER_DAY_LABELS[userData.meals_per_day] || `${planPayload.nutrition.meals_per_day} refeições`}/dia · meta {planPayload.nutrition.daily_kcal_target} kcal</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => navigate(`/users/${id}/plano`)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '11px', background: 'var(--brand-soft)', color: 'var(--brand)', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg> Ver plano</button>
                            <button onClick={() => navigate('/meal-plans')} title="Escolher outro plano alimentar no catálogo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', borderRadius: '11px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6M3 12a9 9 0 0 0 15 6.7l3-2.7"></path></svg> Trocar</button>
                          </div>
                        </div>
                      </section>
                      );
                    })()}

                    {/* Card de módulo bloqueado -- só quando a assinatura EXPLICITAMENTE
                        (=== false, não null/undefined) não inclui o módulo. Sem
                        subscription_type_id (Free), fica sem card -- não dá pra saber se é
                        "bloqueado" ou "ainda não atribuído". */}
                    {resolvedLabels.subscriptionIncludesTraining === false && (
                      <section style={{ background: 'var(--field)', border: '1px dashed var(--border)', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '10px', minHeight: '160px' }}>
                        <span style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'var(--surface-2)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Módulo de Treino</p>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, maxWidth: '230px' }}>Não incluído no plano atual.</p>
                      </section>
                    )}
                    {resolvedLabels.subscriptionIncludesMeals === false && (
                      <section style={{ background: 'var(--field)', border: '1px dashed var(--border)', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '10px', minHeight: '160px' }}>
                        <span style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'var(--surface-2)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Módulo de Nutrição</p>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, maxWidth: '230px' }}>Não incluído no plano atual.</p>
                      </section>
                    )}
                  </div>
                </>
              ) : (
                  <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px', textAlign: 'center' }}>
                      <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Este usuário ainda não possui planos gerados.</p>
                  </section>
              )}

              {/* Histórico de Atribuições (UsuarioDetalhe.dc.html) -- versão mínima:
                  user_training_plans/user_meal_plans são logs reais append-only (nome do
                  plano + data). NÃO tem aderência/duração/status/"responsável"/PDF
                  arquivado por linha -- nada disso existe no schema hoje, ver análise
                  trazida antes de implementar (2026-08-25) e
                  [[project_userdetail_design_gaps_product_decisions]]. Sem link de "ver
                  infos" pq o payload só carrega o plano ATUAL, não versões passadas. */}
              {resolvedLabels.planHistory?.filter(h => !h.isCurrent).length > 0 && (
                <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Histórico de Atribuições</h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>Planos atribuídos anteriormente. Aderência, duração e PDF arquivado não são rastreados hoje.</p>
                  </div>
                  <div>
                    {resolvedLabels.planHistory.filter(h => !h.isCurrent).map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 22px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--surface-2)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {h.kind === 'training'
                            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>{h.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{h.kind === 'training' ? 'Plano de treino' : 'Plano alimentar'}</p>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>{new Date(h.assignedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Formulário de Parecer Técnico -- não está no mockup novo, mas é a
                  única forma hoje do personal/nutricionista validar um plano; mantido
                  por decisão explícita (2026-08-25), não é regressão silenciosa. */}
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Escrever Parecer Técnico</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Admin tem acesso a ambos os papeis (mesma regra do backend em
                      ybytu-submit-plan-review), mas nao tem 'personal'/'nutricionista'
                      no staff.roles -- sem isso o seletor nunca aparecia pra admin e
                      reviewRole ficava vazio pra sempre, travando o submit no alert
                      "Selecione o papel do avaliador." (achado testando em prod 2026-08-25). */}
                  {(staff?.roles?.includes('admin') || (staff?.roles?.includes('personal') && staff?.roles?.includes('nutricionista'))) && (
                     <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                           <input type="radio" name="reviewRole" value="personal" checked={reviewRole === 'personal'} onChange={() => setReviewRole('personal')} /> Personal
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                           <input type="radio" name="reviewRole" value="nutricionista" checked={reviewRole === 'nutricionista'} onChange={() => setReviewRole('nutricionista')} /> Nutricionista
                        </label>
                     </div>
                  )}
                  <textarea
                    value={notePtbr}
                    onChange={e => setNotePtbr(e.target.value)}
                    placeholder="Escreva seu diagnóstico e metas..."
                    style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>
                      <input type="radio" name="reviewStatus" value="approved" checked={reviewStatus === 'approved'} onChange={() => setReviewStatus('approved')} /> Aprovado
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: '#d97706' }}>
                      <input type="radio" name="reviewStatus" value="needs_changes" checked={reviewStatus === 'needs_changes'} onChange={() => setReviewStatus('needs_changes')} /> Precisa de ajuste
                    </label>
                  </div>
                  <button onClick={submitReview} disabled={isSubmittingReview} style={{ alignSelf: 'flex-start', padding: '10px 18px', borderRadius: '8px', background: 'var(--brand)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {isSubmittingReview ? 'Salvando...' : 'Salvar Parecer'}
                  </button>
                </div>
              </section>

              {/* Pareceres já salvos (Análises & Diagnósticos) ficam dentro do
                  documento -- ver "Ver plano" acima, agora em /users/:id/plano. */}
            </div>
          )}



          {/* ===== TAB: ATIVIDADE & ADESÃO ===== */}
          {tab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px', textAlign: 'center' }}>
                 <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Dados de atividade não disponíveis.</p>
              </section>
            </div>
          )}


        </div>
      </main>
    </>
  );
}