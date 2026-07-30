import { useEffect } from 'react';

const MEAL_ICONS = {
  'Café da manhã': '🥞',
  'Lanche': '🍎',
  'Almoço': '🥗',
  'Janta': '🍽️',
  'Jantar': '🍽️',
};

const WEEKDAY_ABBR = {
  'Domingo': 'Dom', 'Segunda-feira': 'Seg', 'Terça-feira': 'Ter', 'Quarta-feira': 'Qua',
  'Quinta-feira': 'Qui', 'Sexta-feira': 'Sex', 'Sábado': 'Sáb',
};

const GOAL_LABELS = {
  weight_loss: 'Emagrecer',
  hypertrophy: 'Ganhar massa muscular',
  conditioning: 'Melhorar o condicionamento físico',
  health_routine: 'Criar uma rotina saudável',
};

const BMI_COLOR = {
  'Faixa saudável': 'var(--green)',
  'Abaixo do peso': 'var(--amber)',
  'Sobrepeso': 'var(--amber)',
  'Obesidade': 'var(--red)',
};

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
}

function abbrevWeekday(name) {
  if (!name) return '—';
  return WEEKDAY_ABBR[name] || name.slice(0, 3);
}

function formatIssuedDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
}

function macroPercents(macros) {
  if (!macros) return null;
  const { protein_g = 0, carb_g = 0, fat_g = 0 } = macros;
  const kcal = protein_g * 4 + carb_g * 4 + fat_g * 9;
  if (!kcal) return { protein: 0, carb: 0, fat: 0 };
  return {
    protein: Math.round(((protein_g * 4) / kcal) * 100),
    carb: Math.round(((carb_g * 4) / kcal) * 100),
    fat: Math.round(((fat_g * 9) / kcal) * 100),
  };
}

function findMenuCalendarInfo(calendar, menuDay) {
  return calendar.find((d) => d.type === 'treino' && d.meal_day_ref === menuDay) || null;
}

export default function UserPlan({ payload }) {

  useEffect(() => {
    // Altera a cor de fundo do body especificamente para esta página
    document.body.style.background = '#E9ECF1';
    return () => {
      document.body.style.background = ''; // Limpa ao sair
    };
  }, []);

  if (!payload) return null;

  const meta = payload.meta || {};
  const profile = payload.profile || {};
  const training = payload.training || null;
  const nutrition = payload.nutrition || null;
  const review = payload.review || {};
  const cycleGoals = payload.cycle_goals || [];

  const calendar = meta.calendar || [];
  const goals = profile.goals_ptbr || [];
  const physicalLimitations = profile.physical_limitations_ptbr || [];
  const healthLimitations = profile.health_limitations_ptbr || [];
  const hasReview = Boolean(review.personal || review.nutricionista);
  const reviewCount = (review.personal ? 1 : 0) + (review.nutricionista ? 1 : 0);
  const dailyMacroPct = nutrition ? macroPercents(nutrition.macro_distribution) : null;

  return (
    <>
      <style>{`
        :root {
          --brand:#F55F16; --brand-2:#FF7A3D; --brand-soft:#FEF0E9; --brand-ink:#B4400A;
          --ink:#121826; --muted:#697586; --faint:#9AA4B2;
          --line:#ECEFF3; --line-2:#F4F6F9; --bg:#FFFFFF; --panel:#FAFBFD;
          --prot:#3B82F6; --carb:#F59E0B; --fat:#A855F7;
          --green:#15A34A; --red:#EF4444; --amber:#D97706; --blue:#3B82F6; --violet:#A855F7;
          --shadow:0 1px 2px rgba(16,24,40,.04), 0 6px 18px rgba(16,24,40,.05);
          --shadow-lg:0 12px 36px rgba(16,24,40,.10);
        }
        .user-plan-wrapper {
          color: var(--ink);
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          font-size: 14px;
          line-height: 1.62;
          padding: 20px 0;
        }
        .doc { box-sizing:border-box; max-width:8.5in; margin:0 auto; background:var(--bg); padding:0 0 60px; box-shadow:0 18px 60px rgba(16,24,40,.16); }
        .doc-frame { width:100%; border-collapse:collapse; }
        .doc-frame td { padding:0; }
        .hdr-space, .ftr-space { display:none; }

        .doc h1, .doc h2, .doc h3, .doc h4 { text-wrap:balance; margin:0; }
        .doc p, .doc li { text-wrap:pretty; }
        .doc .body { padding:0 52px; }

        /* ---------- cover ---------- */
        .cover { background:#15110E; color:#fff; padding:44px 52px 96px; position:relative; overflow:hidden; }
        .cover::before { content:""; position:absolute; inset:0; background: radial-gradient(120% 90% at 88% -10%, rgba(245,95,22,.95), rgba(245,95,22,0) 55%), radial-gradient(90% 70% at 8% 120%, rgba(255,122,61,.45), rgba(255,122,61,0) 55%); }
        .cover .peak { position:absolute; right:-40px; top:-30px; width:330px; opacity:.10; }
        .brandrow { display:flex; align-items:center; gap:11px; position:relative; }
        .brandrow .mark { display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:11px; background:rgba(255,255,255,.14); backdrop-filter:blur(4px); }
        .brandrow .name { font-weight:900; font-size:19px; letter-spacing:.14em; }
        .brandrow .tag { margin-left:auto; font-size:10px; font-weight:800; letter-spacing:.16em; background:rgba(255,255,255,.16); padding:6px 12px; border-radius:999px; }
        .cover .eyebrow { position:relative; font-size:12px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--brand-2); margin:42px 0 0; }
        .cover h1 { font-size:38px; font-weight:900; letter-spacing:-.025em; line-height:1.03; margin:12px 0 0; position:relative; }
        .cover .sub { font-size:15.5px; color:rgba(255,255,255,.78); margin:14px 0 0; font-weight:500; position:relative; max-width:480px; }

        /* floating profile + metrics overlapping cover */
        .float { position:relative; margin:-66px 52px 0; display:flex; gap:14px; align-items:stretch; z-index:3; }
        .pcard { flex:1; background:var(--bg); border:1px solid var(--line); border-radius:18px; box-shadow:var(--shadow-lg); padding:18px 20px; display:flex; align-items:center; gap:16px; }
        .pcard .ava { width:60px; height:60px; border-radius:16px; background:linear-gradient(135deg,#F55F16,#FF7A3D); display:flex; align-items:center; justify-content:center; font-weight:900; color:#fff; font-size:24px; flex-shrink:0; box-shadow:0 6px 16px rgba(245,95,22,.35); }
        .pcard .nm { font-size:19px; font-weight:900; letter-spacing:-.01em; }
        .pcard .rw { display:flex; gap:8px; margin-top:6px; flex-wrap:wrap; }
        .mini { background:var(--bg); border:1px solid var(--line); border-radius:18px; box-shadow:var(--shadow-lg); padding:14px 18px; display:flex; flex-direction:column; justify-content:center; min-width:104px; }
        .mini .l { font-size:10px; font-weight:800; letter-spacing:.05em; color:var(--muted); text-transform:uppercase; }
        .mini .v { font-size:20px; font-weight:900; margin-top:3px; line-height:1; }
        .mini .v small { font-size:12px; color:var(--muted); font-weight:700; }

        .pill { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:800; padding:4px 10px; border-radius:999px; }
        .pill.pro { background:var(--brand-soft); color:var(--brand-ink); }
        .pill.ok { background:#E8F6EE; color:var(--green); }
        .pill.ok::before { content:""; width:6px; height:6px; border-radius:50%; background:currentColor; }

        /* ---------- program summary band ---------- */
        .summary { margin:26px 52px 0; background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:8px 8px; display:grid; grid-template-columns:repeat(5,1fr); }
        .summary .cell { padding:14px 16px; position:relative; }
        .summary .cell + .cell::before { content:""; position:absolute; left:0; top:14px; bottom:14px; width:1px; background:var(--line); }
        .summary .ic { width:30px; height:30px; border-radius:9px; background:var(--brand-soft); color:var(--brand); display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
        .summary .l { font-size:10.5px; font-weight:800; letter-spacing:.04em; color:var(--muted); text-transform:uppercase; }
        .summary .v { font-size:15px; font-weight:800; margin-top:3px; }

        /* ---------- sections ---------- */
        .section { margin-top:40px; }
        .sec-head { display:flex; align-items:flex-start; gap:14px; margin-bottom:18px; }
        .sec-head .idx { flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:11px; background:linear-gradient(135deg,#F55F16,#FF7A3D); color:#fff; font-weight:900; font-size:14px; box-shadow:0 5px 14px rgba(245,95,22,.30); }
        .sec-head h2 { font-size:21px; font-weight:900; letter-spacing:-.02em; line-height:1.1; }
        .sec-head .d { font-size:13px; color:var(--muted); font-weight:500; margin-top:3px; }

        .grid { display:grid; gap:14px; }
        .g2 { grid-template-columns:1fr 1fr; }
        .g3 { grid-template-columns:1fr 1fr 1fr; }
        .g4 { grid-template-columns:repeat(4,1fr); }

        .card { background:var(--bg); border:1px solid var(--line); border-radius:16px; padding:20px; box-shadow:var(--shadow); }
        .card.tint { background:var(--panel); box-shadow:none; }
        .card h3 { font-size:11px; font-weight:800; letter-spacing:.07em; color:var(--muted); text-transform:uppercase; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
        .card h3 svg { color:var(--brand); }

        .cond-card { background:#FFFCF7; border-color:#F6E0BE; }
        .cond-h3, .cond-h3 svg { color:var(--amber) !important; }
        .cond-note { font-size:12px; color:#8A6A2F; font-weight:600; margin:-6px 0 12px; line-height:1.5; }

        .kv { display:flex; justify-content:space-between; align-items:baseline; gap:14px; padding:8px 0; border-bottom:1px solid var(--line-2); font-size:13.5px; }
        .kv:last-child { border-bottom:none; padding-bottom:0; }
        .kv .k { color:var(--muted); font-weight:600; }
        .kv .v { font-weight:700; text-align:right; }

        /* preference card layout */
        .pref-facts { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:18px; padding-bottom:16px; border-bottom:1px solid var(--line-2); }
        .pref-facts .f .l2 { font-size:10px; font-weight:800; letter-spacing:.05em; color:var(--muted); text-transform:uppercase; }
        .pref-facts .f .v2 { font-size:15px; font-weight:800; margin-top:5px; letter-spacing:-.01em; }
        .pref-group + .pref-group { margin-top:16px; }
        .pref-group .lab { font-size:10.5px; font-weight:800; letter-spacing:.05em; color:var(--muted); text-transform:uppercase; margin-bottom:9px; }

        .statline { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .stat { background:var(--bg); border:1px solid var(--line); border-radius:15px; padding:16px; box-shadow:var(--shadow); }
        .stat .lab { font-size:10px; font-weight:800; letter-spacing:.05em; color:var(--muted); text-transform:uppercase; }
        .stat .num { font-size:26px; font-weight:900; margin-top:6px; line-height:1; letter-spacing:-.02em; }
        .stat .num small { font-size:13px; color:var(--muted); font-weight:700; }
        .stat .hint { font-size:11px; color:var(--green); font-weight:700; margin-top:6px; }

        .chips { display:flex; flex-wrap:wrap; gap:7px; }
        .chip { display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:700; padding:6px 12px; border-radius:999px; background:var(--panel); border:1px solid var(--line); color:var(--ink); }
        .chip.brand { background:var(--brand); color:#fff; border-color:var(--brand); }
        .chip.soft { background:var(--brand-soft); color:var(--brand-ink); border-color:transparent; }
        .chip.warn { background:#FEF3E2; color:var(--amber); border-color:#F6E0BE; }
        .chip.dot::before { content:""; width:7px; height:7px; border-radius:50%; background:currentColor; }

        .diag { display:flex; gap:14px; align-items:flex-start; padding:18px; border-radius:16px; border:1px solid var(--line); box-shadow:var(--shadow); }
        .diag .av { flex-shrink:0; width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:13px; }
        .diag .who { font-size:11px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; color:var(--brand-ink); }
        .diag p { margin:6px 0 0; font-size:13.5px; line-height:1.62; color:#374151; }
        .diag .role { font-size:12px; color:var(--faint); font-weight:600; margin-top:2px; }

        /* macros ring */
        .macros { display:flex; align-items:center; gap:22px; }
        .macros svg { flex-shrink:0; }
        .legend { display:flex; flex-direction:column; gap:11px; flex:1; }
        .legrow { display:flex; align-items:center; gap:9px; font-size:13px; }
        .legrow .sw { width:11px; height:11px; border-radius:3px; flex-shrink:0; }
        .legrow .nm { font-weight:700; }
        .legrow .g { margin-left:auto; color:var(--muted); font-weight:700; }

        /* challenge calendar (15 days) */
        .cal15 { display:flex; flex-wrap:wrap; gap:7px; }
        .cd { width:calc(20% - 6px); text-align:center; border:1px solid var(--line); border-radius:12px; padding:9px 4px; background:var(--bg); }
        .cd.on { background:linear-gradient(160deg,#FFF4EE,#FEF0E9); border-color:#F8D8C7; }
        .cd .dnum { font-size:9px; font-weight:800; color:var(--faint); }
        .cd .dn { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.02em; margin:1px 0 0; }
        .cd.on .dn { color:var(--brand); }
        .cd.off .dn { color:var(--faint); }
        .cd .tt { font-size:10.5px; font-weight:800; margin-top:4px; }
        .cd.off .tt { color:var(--muted); font-weight:700; }
        .fine { font-size:10.5px; color:var(--muted); font-weight:600; }

        /* workout day */
        .day { border:1px solid var(--line); border-radius:16px; overflow:hidden; margin-bottom:14px; box-shadow:var(--shadow); }
        .day-head { display:flex; align-items:center; gap:13px; padding:15px 18px; border-left:4px solid var(--brand); }
        .day-head .tagn { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,#F55F16,#FF7A3D); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:15px; flex-shrink:0; }
        .day-head .t { font-size:15.5px; font-weight:900; letter-spacing:-.01em; }
        .day-head .m { font-size:12px; color:var(--muted); font-weight:600; margin-top:1px; }
        .day-head .time { margin-left:auto; font-size:12px; color:var(--muted); font-weight:700; display:flex; align-items:center; gap:6px; background:var(--panel); border:1px solid var(--line); padding:6px 11px; border-radius:999px; }

        table.ex { width:100%; border-collapse:collapse; }
        table.ex th { text-align:left; font-size:9.5px; font-weight:800; letter-spacing:.03em; color:var(--muted); text-transform:uppercase; padding:9px 12px; background:var(--panel); border-top:1px solid var(--line); }
        table.ex th.c, table.ex td.c { text-align:center; }
        table.ex td { padding:11px 12px; border-top:1px solid var(--line-2); font-size:12.5px; vertical-align:top; }
        table.ex tr td:first-child { font-weight:700; }
        .exname { display:flex; align-items:flex-start; gap:10px; }
        .exname .ltr { width:22px; height:22px; border-radius:7px; background:var(--brand-soft); color:var(--brand-ink); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:10.5px; flex-shrink:0; margin-top:1px; }
        .exname .exbody .instr { font-size:11px; color:var(--muted); font-weight:500; margin-top:3px; line-height:1.45; }
        .exname .exbody .vid { font-size:11px; font-weight:800; color:var(--brand); text-decoration:none; display:inline-flex; align-items:center; gap:4px; margin-top:5px; }
        .dash { color:var(--faint); }
        .mono { font-variant-numeric:tabular-nums; font-weight:800; }

        /* meal */
        .meal { border:1px solid var(--line); border-radius:16px; padding:17px 18px; margin-bottom:13px; box-shadow:var(--shadow); }
        .meal-head { display:flex; align-items:center; gap:12px; margin-bottom:13px; }
        .meal-head .ico { width:42px; height:42px; border-radius:12px; background:var(--brand-soft); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .meal-head .nm { font-size:15.5px; font-weight:900; letter-spacing:-.01em; }
        .meal-head .when { font-size:12px; color:var(--muted); font-weight:600; margin-top:1px; display:flex; align-items:center; gap:6px; }
        .meal-head .kcal { margin-left:auto; text-align:right; }
        .meal-head .kcal .n { font-size:19px; font-weight:900; letter-spacing:-.02em; }
        .meal-head .kcal .l { font-size:10px; color:var(--muted); font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .ing { display:flex; justify-content:space-between; gap:12px; padding:7px 0; border-bottom:1px dashed var(--line); font-size:13px; }
        .ing:last-of-type { border-bottom:none; }
        .ing .q { color:var(--muted); font-weight:600; white-space:nowrap; }
        .prep { margin-top:12px; padding-top:12px; border-top:1px solid var(--line-2); font-size:12.5px; color:#374151; }
        .prep b { font-weight:800; color:var(--ink); }
        .mbar { display:flex; height:8px; border-radius:999px; overflow:hidden; margin-top:14px; gap:2px; }
        .mbar i { height:100%; border-radius:2px; }
        .mleg { display:flex; gap:16px; margin-top:10px; font-size:11.5px; color:var(--muted); font-weight:700; }
        .mleg span { display:inline-flex; align-items:center; gap:6px; }
        .mleg em { width:9px; height:9px; border-radius:3px; display:inline-block; font-style:normal; }

        .note { display:flex; gap:12px; align-items:flex-start; background:var(--brand-soft); border:1px solid #F8D8C7; border-radius:14px; padding:14px 16px; font-size:13px; line-height:1.55; color:#5C4435; }
        .note svg { flex-shrink:0; color:var(--brand); margin-top:1px; }

        .footer { margin-top:42px; padding:20px 52px 0; border-top:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; color:var(--faint); font-size:11.5px; font-weight:600; }
        .footer .fb { display:flex; align-items:center; gap:8px; }
        .footer .fb svg { color:var(--brand); }

        .toolbar { position:fixed; top:18px; right:18px; display:flex; gap:9px; z-index:50; }
        .toolbar button { font-family:inherit; font-size:13px; font-weight:800; border:none; border-radius:11px; padding:11px 17px; cursor:pointer; box-shadow:0 6px 18px rgba(245,95,22,.35); background:var(--brand); color:#fff; display:flex; align-items:center; gap:7px; }

        @page { size:letter; margin:0; }
        @media print {
          html, body { margin:0; padding:0; background:#fff !important; }
          .user-plan-wrapper { padding: 0; }
          .doc { max-width:none!important; margin:0!important; box-shadow:none!important; padding-bottom: 0 !important;}
          .hdr-space, .ftr-space { display:table-cell; height:0.5in; }
          h1, h2, h3, h4 { break-after:avoid; }
          .card, .day, .meal, .diag, .stat, .note, .mini, .pcard, table.ex tr, .meal-head { break-inside:avoid; }
          .day-head { break-after:avoid; }
          .section { break-inside:avoid-page; }
          p, li { orphans:3; widows:3; }
          .screen-only { display:none!important; }
        }
      `}</style>

      <div className="user-plan-wrapper">
        <div className="toolbar screen-only">
          <button onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"></path></svg> Salvar PDF
          </button>
        </div>

        <main className="doc">
          <table className="doc-frame" role="presentation">
            <thead><tr><td className="hdr-space"></td></tr></thead>
            <tbody><tr><td>

              {/* ============ COVER ============ */}
              <header className="cover">
                <svg className="peak" viewBox="119 94 275 323" fill="#fff"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg>
                <div className="brandrow">
                  <span className="mark"><svg viewBox="119 94 275 323" style={{ width: '22px', height: 'auto' }} fill="#fff"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg></span>
                  <span className="name">YBYTU</span>
                  <span className="tag">PLANO PERSONALIZADO · #{meta.plan_code || '—'}</span>
                </div>
                <p className="eyebrow">Desafio {meta.cycle_days || 15} dias</p>
                <h1>Plano de Treino<br />&amp; Nutrição</h1>
                <p className="sub">Montado a partir do seu perfil, objetivos e condições de saúde — com acompanhamento de personal e nutricionista.</p>
              </header>

              {/* floating identity + key metrics */}
              <div className="float">
                <div className="pcard">
                  <div className="ava">{initials(profile.name)}</div>
                  <div>
                    <p className="nm">{profile.name || '—'}</p>
                    <div className="rw"><span className="pill pro">Plano Pro</span><span className="pill ok">Onboarding completo</span></div>
                  </div>
                </div>
                <div className="mini"><span className="l">Emitido</span><span className="v" style={{ fontSize: '15px' }}>{formatIssuedDate(meta.issued_at)}</span></div>
                <div className="mini"><span className="l">Objetivo</span><span className="v" style={{ fontSize: '15px' }}>{goals[0] || '—'}</span></div>
              </div>

              {/* program summary band */}
              <div className="summary">
                <div className="cell"><div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></div><p className="l">Ambiente de treino</p><p className="v">{training?.environment_ptbr || '—'}</p></div>
                <div className="cell"><div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg></div><p className="l">Frequência</p><p className="v">{training ? `${training.days_per_week} dias / semana` : '—'}</p></div>
                <div className="cell"><div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg></div><p className="l">Gasto médio</p><p className="v">{training?.avg_estimated_kcal_per_session ? `~${training.avg_estimated_kcal_per_session} kcal / sessão` : '—'}</p></div>
                <div className="cell"><div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 0 20"></path></svg></div><p className="l">Preferência alimentar</p><p className="v">{nutrition?.preference_ptbr || '—'}</p></div>
                <div className="cell"><div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V3M7 3v18M21 15V3a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"></path></svg></div><p className="l">Nutrição</p><p className="v">{nutrition ? `${nutrition.daily_kcal_target} kcal · ${nutrition.meals_per_day} ref.` : '—'}</p></div>
              </div>

              <div className="body">

                {/* ============ 1 · FICHA DO USUÁRIO ============ */}
                <section className="section">
                  <div className="sec-head"><span className="idx"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span><div><h2>Ficha do Aluno</h2><p className="d">Perfil físico, objetivos e preferências que orientam todo o programa.</p></div></div>

                  <div className="statline" style={{ marginBottom: '14px' }}>
                    <div className="stat"><p className="lab">Idade</p><p className="num">{profile.age ?? '—'}<small> anos</small></p></div>
                    <div className="stat"><p className="lab">Peso</p><p className="num">{profile.weight_kg ?? '—'}<small> kg</small></p></div>
                    <div className="stat"><p className="lab">Altura</p><p className="num">{profile.height_cm ?? '—'}<small> cm</small></p></div>
                    <div className="stat">
                      <p className="lab">IMC</p>
                      <p className="num" style={{ color: BMI_COLOR[profile.bmi_class_ptbr] || 'var(--ink)' }}>{profile.bmi ?? '—'}</p>
                      {profile.bmi_class_ptbr && <p className="hint" style={{ color: BMI_COLOR[profile.bmi_class_ptbr] || 'var(--muted)' }}>{profile.bmi_class_ptbr}</p>}
                    </div>
                  </div>

                  <div className="card">
                    <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Características Físicas</h3>
                    <div className="pref-facts" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
                      <div className="f"><p className="l2">Nome completo</p><p className="v2">{profile.name || '—'}</p></div>
                      <div className="f"><p className="l2">Gênero</p><p className="v2">{profile.gender_ptbr || '—'}</p></div>
                      <div className="f"><p className="l2">Nível de atividade</p><p className="v2">{profile.activity_level_ptbr || '—'}</p></div>
                      <div className="f"><p className="l2">Nível de treino</p><p className="v2">{profile.training_level_ptbr || '—'}</p></div>
                    </div>
                    {goals.length > 0 && (
                      <div className="pref-group">
                        <p className="lab">Objetivos</p>
                        <div className="chips">
                          {goals.map((g, i) => (
                            <span className={`chip ${i === 0 ? 'brand' : 'soft'}`} key={g}>{g}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {physicalLimitations.length > 0 && (
                      <div className="pref-group">
                        <p className="lab">Limitações físicas</p>
                        <div className="chips">
                          {physicalLimitations.map((l) => (
                            <span className="chip warn dot" key={l}>{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {healthLimitations.length > 0 && (
                      <div className="pref-group">
                        <p className="lab">Limitações de saúde</p>
                        <div className="chips">
                          {healthLimitations.map((l) => (
                            <span className="chip warn dot" key={l}>{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {calendar.length > 0 && (
                    <div className="card" style={{ marginTop: '14px' }}>
                      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg> Calendário do Desafio · {meta.cycle_days || calendar.length} dias</h3>
                      <p className="fine" style={{ marginBottom: '10px' }}>Nos dias ON: mesmo dia cobre treino e dieta. Dias-tipo em rodízio ao longo do desafio.</p>
                      <div className="cal15">
                        {calendar.map((day) => (
                          <div className={`cd ${day.type === 'treino' ? 'on' : 'off'}`} key={day.day}>
                            <p className="dnum">dia {day.day}</p>
                            <p className="dn">{abbrevWeekday(day.weekday_ptbr)}</p>
                            <p className="tt">{day.type === 'treino' ? `Treino ${day.training_day_ref}` : 'Livre'}</p>
                            {day.type === 'treino' && day.meal_day_ref != null && (
                              <p style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 700, marginTop: '2px' }}>Cardápio {day.meal_day_ref}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* ============ 2 · ANÁLISES E DIAGNÓSTICOS ============ */}
                {hasReview && (
                  <section className="section">
                    <div className="sec-head"><span className="idx"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></span><div><h2>Análises &amp; Diagnósticos</h2><p className="d">Parecer técnico da equipe e as metas do ciclo.</p></div></div>
                    <div className="grid g2" style={reviewCount === 1 ? { gridTemplateColumns: '1fr' } : undefined}>
                      {review.personal && (
                        <div className="diag" style={{ background: '#F5F9FF', borderColor: '#DCE8FB' }}>
                          <span className="av" style={{ background: 'linear-gradient(135deg,#3B82F6,#60A5FA)' }}>{initials(review.personal.reviewer_name)}</span>
                          <div>
                            <p className="who" style={{ color: '#1E5FBF' }}>Diagnóstico do Personal</p>
                            <p className="role">{[review.personal.reviewer_name, review.personal.reviewer_credential].filter(Boolean).join(' · ')}</p>
                            <p>{review.personal.note_ptbr}</p>
                          </div>
                        </div>
                      )}
                      {review.nutricionista && (
                        <div className="diag" style={{ background: '#F3FBF6', borderColor: '#D5EEDD' }}>
                          <span className="av" style={{ background: 'linear-gradient(135deg,#15A34A,#4ADE80)' }}>{initials(review.nutricionista.reviewer_name)}</span>
                          <div>
                            <p className="who" style={{ color: '#11823B' }}>Diagnóstico da Nutricionista</p>
                            <p className="role">{[review.nutricionista.reviewer_name, review.nutricionista.reviewer_credential].filter(Boolean).join(' · ')}</p>
                            <p>{review.nutricionista.note_ptbr}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {cycleGoals.length > 0 && (
                      <div className="card tint" style={{ marginTop: '14px' }}>
                        <h3>Metas do Ciclo</h3>
                        <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(cycleGoals.length, 4)},1fr)` }}>
                          {cycleGoals.map((g, i) => (
                            <div key={i}>
                              <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'var(--brand)', letterSpacing: '-.01em' }}>{g.expectation_ptbr}</p>
                              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{GOAL_LABELS[g.goal] || g.goal}</p>
                              {g.window_ptbr && <p style={{ margin: '2px 0 0', fontSize: '10.5px', color: 'var(--faint)', fontWeight: 600 }}>{g.window_ptbr}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* ============ 3 · PLANO DE EXERCÍCIO ============ */}
                <section className="section">
                  <div className="sec-head"><span className="idx"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></span><div><h2>Plano de Exercício</h2><p className="d">Sessões semanais com séries, repetições e cadência.</p></div></div>

                  {!training ? (
                    <div className="note">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>
                      <span>Nenhum plano de treino ativo para esta conta.</span>
                    </div>
                  ) : (
                    <>
                      <div className="note" style={{ marginBottom: '16px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>
                        <span>Ajuste as cargas para manter a faixa de repetições com boa execução. Aqueça 5–8 min antes de cada sessão e alongue ao final.</span>
                      </div>

                      <div className="card" style={{ marginBottom: '16px' }}>
                        <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> Preferências de Treino</h3>
                        <div className="pref-facts" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                          <div className="f"><p className="l2">Ambiente</p><p className="v2">{training.environment_ptbr || '—'}</p></div>
                          <div className="f"><p className="l2">Dias/semana</p><p className="v2">{training.days_per_week} dias</p></div>
                          <div className="f"><p className="l2">Duração</p><p className="v2">{training.session_duration_min ? `${training.session_duration_min} min` : '—'}</p></div>
                          <div className="f"><p className="l2">Nível</p><p className="v2">{profile.training_level_ptbr || '—'}</p></div>
                        </div>
                        {training.priority_muscle_groups_ptbr?.length > 0 && (
                          <div className="pref-group">
                            <p className="lab">Grupos prioritários</p>
                            <div className="chips">{training.priority_muscle_groups_ptbr.map((m) => <span className="chip soft" key={m}>{m}</span>)}</div>
                          </div>
                        )}
                        {training.available_equipment_ptbr?.length > 0 && (
                          <div className="pref-group">
                            <p className="lab">Equipamentos disponíveis</p>
                            <div className="chips">{training.available_equipment_ptbr.map((e) => <span className="chip" key={e}>{e}</span>)}</div>
                          </div>
                        )}
                      </div>

                      {training.days.map((day) => (
                        <div className="day" key={day.day_number}>
                          <div className="day-head" style={day.adapted_note_ptbr ? { borderLeftColor: 'var(--amber)' } : undefined}>
                            <span className="tagn" style={day.adapted_note_ptbr ? { background: 'linear-gradient(135deg,#D97706,#F59E0B)' } : undefined}>{day.day_number}</span>
                            <div>
                              <p className="t">
                                {day.region_label_ptbr}{day.muscle_groups_ptbr?.length ? ` — ${day.muscle_groups_ptbr.join(' & ')}` : ''}
                                {day.adapted_note_ptbr && (
                                  <span style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '11px', background: '#FEF3E2', padding: '2px 8px', borderRadius: '999px', marginLeft: '6px' }}>{day.adapted_note_ptbr}</span>
                                )}
                              </p>
                              <p className="m">{day.weekday_ptbr || '—'}</p>
                            </div>
                            <span className="time"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> ~{day.estimated_minutes} min</span>
                          </div>
                          <table className="ex">
                            <thead><tr><th>Exercício</th><th className="c">Séries</th><th className="c">Reps</th><th className="c">Cadência*</th><th className="c">Descanso</th></tr></thead>
                            <tbody>
                              {day.exercises.map((ex) => (
                                <tr key={ex.order}>
                                  <td>
                                    <div className="exname">
                                      <span className="ltr">{ex.order}</span>
                                      <div className="exbody">
                                        <div>{ex.name_ptbr || '—'}</div>
                                        {ex.instruction_ptbr && <div className="instr">{ex.instruction_ptbr}</div>}
                                        {ex.video_url && <a className="vid" href={ex.video_url} target="_blank" rel="noreferrer">▶ Ver vídeo</a>}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="c mono">{ex.sets}</td>
                                  <td className="c mono">{ex.reps_ptbr}</td>
                                  <td className="c mono">{ex.cadence_ptbr}</td>
                                  <td className="c mono">{ex.rest_seconds}s</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </>
                  )}
                </section>

                {/* ============ 4 · PLANO DE REFEIÇÕES ============ */}
                <section className="section">
                  <div className="sec-head"><span className="idx"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V3M7 3v18M21 15V3a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"></path></svg></span><div><h2>Plano de Refeições</h2><p className="d">{nutrition ? `Cardápio de ${nutrition.daily_kcal_target} kcal em ${nutrition.meals_per_day} refeições — um menu para cada dia-tipo do treino.` : 'Plano alimentar personalizado.'}</p></div></div>

                  {!nutrition ? (
                    <div className="note">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>
                      <span>Nenhum plano de refeições ativo para esta conta.</span>
                    </div>
                  ) : (
                    <>
                      <div className="card" style={{ marginBottom: '16px' }}>
                        <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V3M7 3v18M21 15V3a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"></path></svg> Preferências Nutricionais</h3>
                        <div className="pref-facts">
                          <div className="f"><p className="l2">Preferência</p><p className="v2">{nutrition.preference_ptbr || '—'}</p></div>
                          <div className="f"><p className="l2">Dias/semana</p><p className="v2">{nutrition.days_per_week} dias</p></div>
                          <div className="f"><p className="l2">Refeições/dia</p><p className="v2">{nutrition.meals_per_day} refeições</p></div>
                        </div>
                      </div>

                      <div className="grid g2" style={{ marginBottom: '16px' }}>
                        <div className="card">
                          <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 0 20"></path></svg> Meta Diária</h3>
                          <div className="grid g2" style={{ gap: '10px' }}>
                            <div className="stat" style={{ boxShadow: 'none' }}><p className="lab">Calorias</p><p className="num" style={{ fontSize: '21px' }}>{nutrition.daily_kcal_target}<small> kcal</small></p></div>
                            <div className="stat" style={{ boxShadow: 'none' }}><p className="lab">Refeições</p><p className="num" style={{ fontSize: '21px' }}>{nutrition.meals_per_day}<small>/dia</small></p></div>
                          </div>
                        </div>
                        <div className="card">
                          <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg> Distribuição de Macros</h3>
                          {dailyMacroPct ? (
                            <div className="macros">
                              <svg viewBox="0 0 42 42" width="106" height="106" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="21" cy="21" r="15.915" fill="none" stroke="#EEF1F4" strokeWidth="6"/>
                                <circle cx="21" cy="21" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="6" strokeDasharray={`${dailyMacroPct.protein} ${100 - dailyMacroPct.protein}`} strokeDashoffset="0" strokeLinecap="round"/>
                                <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="6" strokeDasharray={`${dailyMacroPct.carb} ${100 - dailyMacroPct.carb}`} strokeDashoffset={-dailyMacroPct.protein} strokeLinecap="round"/>
                                <circle cx="21" cy="21" r="15.915" fill="none" stroke="#A855F7" strokeWidth="6" strokeDasharray={`${dailyMacroPct.fat} ${100 - dailyMacroPct.fat}`} strokeDashoffset={-(dailyMacroPct.protein + dailyMacroPct.carb)} strokeLinecap="round"/>
                              </svg>
                              <div className="legend">
                                <div className="legrow"><span className="sw" style={{ background: '#3B82F6' }}></span><span className="nm">Proteína</span><span className="g">{dailyMacroPct.protein}% · {nutrition.macro_distribution.protein_g}g</span></div>
                                <div className="legrow"><span className="sw" style={{ background: '#F59E0B' }}></span><span className="nm">Carboidrato</span><span className="g">{dailyMacroPct.carb}% · {nutrition.macro_distribution.carb_g}g</span></div>
                                <div className="legrow"><span className="sw" style={{ background: '#A855F7' }}></span><span className="nm">Gordura</span><span className="g">{dailyMacroPct.fat}% · {nutrition.macro_distribution.fat_g}g</span></div>
                              </div>
                            </div>
                          ) : <p className="fine">Sem dados de macros.</p>}
                        </div>
                      </div>

                      {nutrition.menus.map((menu) => {
                        const calInfo = findMenuCalendarInfo(calendar, menu.menu_day);
                        return (
                          <div className="day" key={menu.menu_day}>
                            <div className="day-head">
                              <span className="tagn">{menu.menu_day}</span>
                              <div>
                                <p className="t">Cardápio {menu.menu_day}</p>
                                {calInfo && <p className="m">{calInfo.weekday_ptbr} · Treino {calInfo.training_day_ref}</p>}
                              </div>
                            </div>
                            <div style={{ padding: '16px 18px' }}>
                              {menu.meals.map((meal, i) => {
                                const pct = macroPercents(meal.macros);
                                const when = [meal.meal_name_ptbr, meal.time_ptbr].filter(Boolean).join(' · ');
                                return (
                                  <div className="meal" key={i}>
                                    <div className="meal-head">
                                      <span className="ico">{MEAL_ICONS[meal.name_ptbr] || '🍽️'}</span>
                                      <div><p className="nm">{meal.name_ptbr}</p>{when && <p className="when">{when}</p>}</div>
                                      <div className="kcal"><p className="n">{meal.kcal ?? '—'}</p><p className="l">kcal</p></div>
                                    </div>
                                    {meal.ingredients.map((ing, j) => (
                                      <div className="ing" key={j}><span>{ing.name_ptbr || '—'}</span><span className="q">{ing.quantity_ptbr}</span></div>
                                    ))}
                                    {meal.prep_ptbr && <div className="prep"><b>Modo de preparo:</b> {meal.prep_ptbr}</div>}
                                    {pct && meal.macros && (
                                      <>
                                        <div className="mbar">
                                          <i style={{ width: `${pct.protein}%`, background: '#3B82F6' }}></i>
                                          <i style={{ width: `${pct.carb}%`, background: '#F59E0B' }}></i>
                                          <i style={{ width: `${pct.fat}%`, background: '#A855F7' }}></i>
                                        </div>
                                        <div className="mleg">
                                          <span><em style={{ background: '#3B82F6' }}></em>P {meal.macros.protein_g}g</span>
                                          <span><em style={{ background: '#F59E0B' }}></em>C {meal.macros.carb_g}g</span>
                                          <span><em style={{ background: '#A855F7' }}></em>G {meal.macros.fat_g}g</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      <div className="note" style={{ marginTop: '6px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75-1.06 4-2.94 1.5-2.25 2-5.5 2-7 0-2.5-1.5-4-3.5-4-1.5 0-2.5 1-3 1.5-.5-.5-1.5-1.5-3-1.5C5 7 3.5 8.5 3.5 11c0 1.5.5 4.75 2 7 1.25 1.88 2.5 2.94 4 2.94Z"></path><path d="M10 2c1 .5 2 2 2 5"></path></svg>
                        <span>Substituições equivalentes em calorias e macros podem ser combinadas com a nutricionista. Priorize alimentos integrais e hidratação constante.</span>
                      </div>
                    </>
                  )}
                </section>

              </div>

              <div className="footer">
                <span className="fb"><svg width="16" height="16" viewBox="119 94 275 323" fill="currentColor"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg> Ybytu · Plano personalizado · #{meta.plan_code || '—'}</span>
                <span>{profile.name || '—'} · Emitido {formatIssuedDate(meta.issued_at)}</span>
              </div>

            </td></tr></tbody>
            <tfoot><tr><td className="ftr-space"></td></tr></tfoot>
          </table>
        </main>
      </div>
    </>
  );
}
