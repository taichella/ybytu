import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { StaffContext } from '../lib/staffContextCore';
import UserPlan from './UserPlan';

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
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  // 👁 Ver / ✏️ Editar (#2, aprovado 2026-08-24): o documento embutido
  // (UserPlan) só fica editável quando o admin/personal clica "Editar" --
  // por padrão abre em modo leitura, igual ao que o aluno recebe.
  const [forceEdit, setForceEdit] = useState(false);
  // Evita disparar window.print() de novo a cada re-render enquanto ?print=1
  // continuar na URL -- só uma vez, assim que o payload carrega.
  const printTriggeredRef = useRef(false);

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

  // PDF (#2): ?print=1 na URL dispara window.print() automaticamente assim
  // que o documento do plano carrega -- reusa o fluxo "Salvar PDF" que já
  // existe dentro do UserPlan (window.print() com CSS @media print própria),
  // só automatizado pra funcionar como um ícone de lista. O admin ainda
  // salva o PDF manualmente no diálogo do navegador (ver aviso da Taina:
  // isso serve pro piloto, não gera arquivo no servidor).
  useEffect(() => {
    if (searchParams.get('print') === '1' && planPayload && !printTriggeredRef.current) {
      printTriggeredRef.current = true;
      setTab('plans');
      setTimeout(() => window.print(), 300);
    }
  }, [searchParams, planPayload]);

  // Admin tem acesso a tudo que personal/nutricionista têm (fix #1) -- pode
  // editar carga/reps mesmo sem o papel 'personal' explícito.
  const canEditTraining = Boolean(staff?.roles?.includes('personal') || staff?.roles?.includes('admin'));

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

    setIsSubmittingReview(true);
    try {
       const res = await supabase.functions.invoke('ybytu-submit-plan-review', {
          body: {
            user_id: id,
            role: reviewRole,
            note_ptbr: notePtbr,
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

  // Passo 5 -- "Salvar cargas" é uma ação separada de "Salvar Parecer", mas
  // ybytu-submit-plan-review faz upsert de note_ptbr/reviewer_credential
  // junto (onConflict user_id+role). Se mandássemos só load_updates sem
  // reenviar o parecer já salvo do personal, o upsert apagaria o texto
  // existente. Por isso reenviamos o note_ptbr/reviewer_credential atuais
  // (vindos do planPayload já carregado) junto do save de carga.
  const saveLoads = async ({ training_plan_id, load_updates, exercise_field_updates }) => {
    const existingReview = planPayload?.review?.personal;
    const res = await supabase.functions.invoke('ybytu-submit-plan-review', {
      body: {
        user_id: id,
        role: 'personal',
        note_ptbr: existingReview?.note_ptbr ?? null,
        reviewer_credential: existingReview?.reviewer_credential ?? null,
        training_plan_id,
        load_updates,
        exercise_field_updates,
      }
    });
    if (res.error) throw res.error;
    const planRes = await supabase.functions.invoke('ybytu-get-plan-for-staff', { body: { userId: id } });
    if (planRes.data && !planRes.error) {
      setPlanPayload(planRes.data);
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

              {planPayload ? (
                <>
                  {/* Layout de cards do mockup (UsuarioDetalhe.dc.html) -- sem barra de
                      progresso/aderência e sem "Histórico de Atribuições": esses dados
                      dependem de schema que ainda não existe (adesão/streak/histórico de
                      planos), descopado de propósito -- ver [[project_userdetail_design_gaps_product_decisions]].
                      "Ver plano" rola até o documento completo, já embutido logo abaixo. */}
                  {planPayload.training && (() => {
                    const status = planStatus(planPayload.training.is_active, Boolean(planPayload.review?.personal));
                    return (
                    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Plano de Treino Atual</h3>
                          <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', background: status.bg, color: status.color }}>{status.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button title="Ver" onClick={() => { setForceEdit(false); document.getElementById('user-plan-document')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>👁</button>
                          {canEditTraining && (
                            <button title="Editar" onClick={() => { setForceEdit(true); document.getElementById('user-plan-document')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>✏️</button>
                          )}
                          <button title="Baixar PDF" onClick={() => window.print()} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}>PDF</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'linear-gradient(135deg,#F55F16,#FF7A3D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                        </div>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>{resolvedLabels.goals?.length ? resolvedLabels.goals.join(' + ') : 'Plano de treino'}</p>
                          <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--muted)' }}>{planPayload.training.days_per_week} dias/sem · {planPayload.training.session_duration_min ? `${planPayload.training.session_duration_min} min/sessão` : 'duração não definida'}</p>
                        </div>
                      </div>
                    </section>
                    );
                  })()}

                  {planPayload.nutrition && (() => {
                    const status = planStatus(planPayload.nutrition.is_active, Boolean(planPayload.review?.nutricionista));
                    return (
                    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em' }}>Plano Alimentar Atual</h3>
                          <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', background: status.bg, color: status.color }}>{status.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button title="Ver" onClick={() => document.getElementById('user-plan-document')?.scrollIntoView({ behavior: 'smooth' })} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>👁</button>
                          <button title="Baixar PDF" onClick={() => window.print()} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}>PDF</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'linear-gradient(135deg,#16a34a,#4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>
                        </div>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>{resolvedLabels.dietaryPreference || 'Plano alimentar'}</p>
                          <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--muted)' }}>{MEALS_PER_DAY_LABELS[userData.meals_per_day] || `${planPayload.nutrition.meals_per_day} refeições`}/dia · meta {planPayload.nutrition.daily_kcal_target} kcal</p>
                        </div>
                      </div>
                    </section>
                    );
                  })()}

                  <div id="user-plan-document" style={{ border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
                      <UserPlan
                        payload={planPayload}
                        editable={canEditTraining && forceEdit}
                        onSaveLoads={saveLoads}
                        embedded
                      />
                  </div>
                </>
              ) : (
                  <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px', textAlign: 'center' }}>
                      <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Este usuário ainda não possui planos gerados.</p>
                  </section>
              )}

              {/* Formulário de Parecer Técnico */}
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
                  <button onClick={submitReview} disabled={isSubmittingReview} style={{ alignSelf: 'flex-start', padding: '10px 18px', borderRadius: '8px', background: 'var(--brand)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {isSubmittingReview ? 'Salvando...' : 'Salvar Parecer'}
                  </button>
                </div>
              </section>

              {/* Render Existing Reviews below form if we want to show it natively instead of inside UserPlan, or just rely on UserPlan */}
              {/* UserPlan already renders the plan_reviews internally in 'Análises & Diagnósticos' */}
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