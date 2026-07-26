import { useEffect } from 'react';

export default function UserPlan() {

  useEffect(() => {
    // Altera a cor de fundo do body especificamente para esta página
    document.body.style.background = '#E9ECF1';
    return () => {
      document.body.style.background = ''; // Limpa ao sair
    };
  }, []);

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
                  <span className="tag">PLANO PERSONALIZADO · #PL-28471</span>
                </div>
                <p className="eyebrow">Desafio 15 dias</p>
                <h1>Plano de Treino<br />&amp; Nutrição</h1>
                <p className="sub">Montado a partir do seu perfil, objetivos e condições de saúde — com acompanhamento de personal e nutricionista.</p>
              </header>

              {/* floating identity + key metrics */}
              <div className="float">
                <div className="pcard">
                  <div className="ava">MS</div>
                  <div>
                    <p className="nm">Mariana Silva</p>
                    <div className="rw"><span className="pill pro">Plano Pro</span><span className="pill ok">Onboarding completo</span></div>
                  </div>
                </div>
                <div className="mini"><span className="l">Emitido</span><span className="v" style={{ fontSize: '15px' }}>28 jun 2026</span></div>
                <div className="mini"><span className="l">Revisão</span><span className="v" style={{ fontSize: '15px' }}>12 semanas</span></div>
              </div>

              {/* program summary band */}
              <div className="summary">
                <div className="cell"><div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></div><p className="l">Ambiente de treino</p><p className="v">Academia</p></div>
                <div className="cell"><div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg></div><p className="l">Frequência</p><p className="v">5 dias / semana</p></div>
                <div className="cell"><div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg></div><p className="l">Gasto médio</p><p className="v">~320 kcal / sessão</p></div>
                <div className="cell"><div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 0 20"></path></svg></div><p className="l">Preferência alimentar</p><p className="v">Onívora (Como de tudo)</p></div>
                <div className="cell"><div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V3M7 3v18M21 15V3a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"></path></svg></div><p className="l">Nutrição</p><p className="v">1.800 kcal · 5 ref.</p></div>
              </div>

              <div className="body">

                {/* ============ 1 · FICHA DO USUÁRIO ============ */}
                <section className="section">
                  <div className="sec-head"><span className="idx">01</span><div><h2>Ficha do Aluno</h2><p className="d">Perfil físico, objetivos e preferências que orientam todo o programa.</p></div></div>

                  <div className="statline" style={{ marginBottom: '14px' }}>
                    <div className="stat"><p className="lab">Idade</p><p className="num">32<small> anos</small></p></div>
                    <div className="stat"><p className="lab">Peso</p><p className="num">64<small> kg</small></p></div>
                    <div className="stat"><p className="lab">Altura</p><p className="num">168<small> cm</small></p></div>
                    <div className="stat"><p className="lab">IMC</p><p className="num" style={{ color: 'var(--green)' }}>22.7</p><p className="hint">Faixa saudável</p></div>
                  </div>

                  <div className="grid g2">
                    <div className="card">
                      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Características Físicas</h3>
                      <div className="kv"><span className="k">Nome completo</span><span className="v">Mariana Silva</span></div>
                      <div className="kv"><span className="k">Gênero</span><span className="v">Feminino</span></div>
                      <div className="kv"><span className="k">Nível de atividade</span><span className="v">Moderadamente ativa</span></div>
                      <div className="kv"><span className="k">Nível de treino</span><span className="v">Intermediário</span></div>
                    </div>

                    <div className="card">
                      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg> Objetivos</h3>
                      <div className="chips" style={{ marginBottom: '18px' }}>
                        <span className="chip brand">Hipertrofia</span>
                        <span className="chip soft">Definição muscular</span>
                        <span className="chip soft">Mais energia no dia</span>
                      </div>
                      <h3 style={{ marginTop: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4M12 17h.01"></path></svg> Limitações físicas</h3>
                      <div className="chips" style={{ marginBottom: '18px' }}>
                        <span className="chip warn dot">Lesão no joelho (direito)</span>
                        <span className="chip warn dot">Dor lombar ocasional</span>
                      </div>
                      <h3 style={{ marginTop: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4M12 17h.01"></path></svg> Limitações de saúde</h3>
                      <div className="chips">
                        <span className="chip warn dot">Asma leve controlada</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid g2" style={{ marginTop: '14px' }}>
                    <div className="card">
                      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> Preferências de Treino</h3>
                      <div className="pref-facts" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                        <div className="f"><p className="l2">Ambiente</p><p className="v2">Academia</p></div>
                        <div className="f"><p className="l2">Dias/semana</p><p className="v2">5 dias</p></div>
                        <div className="f"><p className="l2">Duração</p><p className="v2">45 min</p></div>
                        <div className="f"><p className="l2">Nível</p><p className="v2">Intermediário</p></div>
                      </div>
                      <div className="pref-group">
                        <p className="lab">Grupos prioritários</p>
                        <div className="chips"><span className="chip soft">Glúteos</span><span className="chip soft">Pernas</span><span className="chip soft">Costas</span></div>
                      </div>
                      <div className="pref-group">
                        <p className="lab">Equipamentos disponíveis</p>
                        <div className="chips"><span className="chip">Barra</span><span className="chip">Halteres</span><span className="chip">Máquina</span><span className="chip">Polia</span><span className="chip">Anilhas</span></div>
                      </div>
                    </div>

                    <div className="card">
                      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V3M7 3v18M21 15V3a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"></path></svg> Preferências Nutricionais</h3>
                      <div className="pref-facts">
                        <div className="f"><p className="l2">Preferência</p><p className="v2">Onívora</p></div>
                        <div className="f"><p className="l2">Dias/semana</p><p className="v2">7 dias</p></div>
                        <div className="f"><p className="l2">Refeições/dia</p><p className="v2">5 refeições</p></div>
                      </div>
                      <div className="pref-group">
                        <p className="lab">Restrições</p>
                        <div className="chips"><span className="chip soft">Sem lactose</span></div>
                      </div>
                      <div className="pref-group">
                        <p className="lab">Não gosta de / evitar</p>
                        <div className="chips"><span className="chip">Fígado</span><span className="chip">Jiló</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ marginTop: '14px' }}>
                    <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg> Calendário do Desafio · 15 dias</h3>
                    <p className="fine" style={{ marginBottom: '10px' }}>Nos dias ON: mesmo dia cobre treino e dieta. Dias-tipo em rodízio ao longo do desafio.</p>
                    <div className="cal15">
                      <div className="cd on"><p className="dnum">dia 1</p><p className="dn">Seg</p><p className="tt">Treino A</p></div>
                      <div className="cd on"><p className="dnum">dia 2</p><p className="dn">Ter</p><p className="tt">Treino B</p></div>
                      <div className="cd on"><p className="dnum">dia 3</p><p className="dn">Qua</p><p className="tt">Treino C</p></div>
                      <div className="cd off"><p className="dnum">dia 4</p><p className="dn">Qui</p><p className="tt">Livre</p></div>
                      <div className="cd on"><p className="dnum">dia 5</p><p className="dn">Sex</p><p className="tt">Treino D</p></div>
                      <div className="cd on"><p className="dnum">dia 6</p><p className="dn">Sáb</p><p className="tt">Treino E</p></div>
                      <div className="cd off"><p className="dnum">dia 7</p><p className="dn">Dom</p><p className="tt">Livre</p></div>
                      <div className="cd on"><p className="dnum">dia 8</p><p className="dn">Seg</p><p className="tt">Treino A</p></div>
                      <div className="cd on"><p className="dnum">dia 9</p><p className="dn">Ter</p><p className="tt">Treino B</p></div>
                      <div className="cd on"><p className="dnum">dia 10</p><p className="dn">Qua</p><p className="tt">Treino C</p></div>
                      <div className="cd off"><p className="dnum">dia 11</p><p className="dn">Qui</p><p className="tt">Livre</p></div>
                      <div className="cd on"><p className="dnum">dia 12</p><p className="dn">Sex</p><p className="tt">Treino D</p></div>
                      <div className="cd on"><p className="dnum">dia 13</p><p className="dn">Sáb</p><p className="tt">Treino E</p></div>
                      <div className="cd off"><p className="dnum">dia 14</p><p className="dn">Dom</p><p className="tt">Livre</p></div>
                      <div className="cd on"><p className="dnum">dia 15</p><p className="dn">Seg</p><p className="tt">Treino A</p></div>
                    </div>
                  </div>
                </section>

                {/* ============ 2 · ANÁLISES E DIAGNÓSTICOS ============ */}
                <section className="section">
                  <div className="sec-head"><span className="idx">02</span><div><h2>Análises &amp; Diagnósticos</h2><p className="d">Parecer técnico da equipe e as metas mensuráveis do ciclo.</p></div></div>
                  <div className="grid g2">
                    <div className="diag" style={{ background: '#F5F9FF', borderColor: '#DCE8FB' }}>
                      <span className="av" style={{ background: 'linear-gradient(135deg,#3B82F6,#60A5FA)' }}>BC</span>
                      <div>
                        <p className="who" style={{ color: '#1E5FBF' }}>Diagnóstico do Personal</p>
                        <p className="role">Coach Bruno · CREF 012345-G/SP</p>
                        <p>Aluna intermediária com boa base de força. Foco em volume progressivo para membros inferiores e dorsais. <strong>Atenção ao joelho direito</strong>: exercícios de alto impacto e agachamento profundo foram substituídos por leg press e cadeiras com amplitude controlada. Progressão de carga a cada 2 semanas.</p>
                      </div>
                    </div>
                    <div className="diag" style={{ background: '#F3FBF6', borderColor: '#D5EEDD' }}>
                      <span className="av" style={{ background: 'linear-gradient(135deg,#15A34A,#4ADE80)' }}>NT</span>
                      <div>
                        <p className="who" style={{ color: '#11823B' }}>Diagnóstico da Nutricionista</p>
                        <p className="role">Nutri Tatiane · CRN 45678</p>
                        <p>Meta calórica de <strong>1.800 kcal/dia</strong> em leve déficit para recomposição corporal, com prioridade proteica (1,8 g/kg). Cardápio <strong>sem lactose</strong>, distribuído em 5 refeições. Itens rejeitados (fígado, jiló) excluídos. Hidratação alvo: 2,5 L/dia.</p>
                      </div>
                    </div>
                  </div>

                  <div className="card tint" style={{ marginTop: '14px' }}>
                    <h3>Metas do Ciclo · 12 semanas</h3>
                    <div className="grid g4">
                      <div><p style={{ margin: 0, fontSize: '25px', fontWeight: 900, color: 'var(--brand)', letterSpacing: '-.02em' }}>−3%</p><p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Gordura corporal</p></div>
                      <div><p style={{ margin: 0, fontSize: '25px', fontWeight: 900, color: 'var(--brand)', letterSpacing: '-.02em' }}>+2 kg</p><p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Massa magra</p></div>
                      <div><p style={{ margin: 0, fontSize: '25px', fontWeight: 900, color: 'var(--brand)', letterSpacing: '-.02em' }}>80%</p><p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Adesão mínima</p></div>
                      <div><p style={{ margin: 0, fontSize: '25px', fontWeight: 900, color: 'var(--brand)', letterSpacing: '-.02em' }}>+15%</p><p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Força nos básicos</p></div>
                    </div>
                  </div>
                </section>

                {/* ============ 3 · PLANO DE EXERCÍCIO ============ */}
                <section className="section">
                  <div className="sec-head"><span className="idx">03</span><div><h2>Plano de Exercício</h2><p className="d">Cinco sessões semanais com séries, cargas de referência e cadência.</p></div></div>
                  <div className="note" style={{ marginBottom: '16px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>
                    <span>As cargas são <strong>referência inicial</strong> — ajuste para manter a faixa de repetições com boa execução. Aqueça 5–8 min antes de cada sessão e alongue ao final.</span>
                  </div>

                  {/* Day 1 */}
                  <div className="day">
                    <div className="day-head"><span className="tagn">1</span><div><p className="t">Superior — Peito &amp; Tríceps</p><p className="m">Segunda-feira</p></div><span className="time"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> ~48 min</span></div>
                    <table className="ex">
                      <thead><tr><th>Exercício</th><th className="c">Séries</th><th className="c">Reps</th><th className="c">Cadência*</th><th className="c">Carga</th><th className="c">Descanso</th></tr></thead>
                      <tbody>
                        <tr><td><div className="exname"><span className="ltr">A</span><div className="exbody"><div>Supino Reto</div><div className="instr">Deite no banco e empurre a barra para cima até estender os braços, controlando a descida.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">4</td><td className="c mono">8–12</td><td className="c mono">2-0-2-0</td><td className="c mono">60 kg</td><td className="c mono">90s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">B</span><div className="exbody"><div>Supino Inclinado (halteres)</div><div className="instr">No banco inclinado, empurre os halteres para cima até quase se tocarem.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">10–12</td><td className="c mono">2-0-2-0</td><td className="c mono">24 kg</td><td className="c mono">75s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">C</span><div className="exbody"><div>Crossover</div><div className="instr">Na polia, puxe os cabos à frente do corpo em movimento de arco, contraindo o peitoral.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">12–15</td><td className="c mono">2-0-2-0</td><td className="c mono">20 kg</td><td className="c mono">60s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">D</span><div className="exbody"><div>Tríceps Pulley</div><div className="instr">Na polia alta, estenda os cotovelos empurrando a barra para baixo.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">12–15</td><td className="c mono">2-0-2-0</td><td className="c mono">30 kg</td><td className="c mono">45s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">E</span><div className="exbody"><div>Tríceps Testa</div><div className="instr">Deitado, flexione os cotovelos levando a barra em direção à testa e estenda de volta.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">10–12</td><td className="c mono">2-0-2-0</td><td className="c mono">30 kg</td><td className="c mono">60s</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Day 2 */}
                  <div className="day">
                    <div className="day-head"><span className="tagn">2</span><div><p className="t">Superior — Costas &amp; Bíceps</p><p className="m">Terça-feira</p></div><span className="time"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> ~52 min</span></div>
                    <table className="ex">
                      <thead><tr><th>Exercício</th><th className="c">Séries</th><th className="c">Reps</th><th className="c">Cadência*</th><th className="c">Carga</th><th className="c">Descanso</th></tr></thead>
                      <tbody>
                        <tr><td><div className="exname"><span className="ltr">A</span><div className="exbody"><div>Puxada Frontal</div><div className="instr">Puxe a barra em direção à parte superior do peito, controlando a volta.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">4</td><td className="c mono">10–12</td><td className="c mono">2-0-2-0</td><td className="c mono">50 kg</td><td className="c mono">90s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">B</span><div className="exbody"><div>Remada Curvada</div><div className="instr">Com o tronco inclinado à frente, puxe a barra em direção ao abdômen.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">4</td><td className="c mono">8–10</td><td className="c mono">2-0-2-0</td><td className="c mono">40 kg</td><td className="c mono">90s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">C</span><div className="exbody"><div>Remada Unilateral</div><div className="instr">Apoiado no banco, puxe o halter em direção ao quadril de um lado por vez.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">10–12</td><td className="c mono">2-0-2-0</td><td className="c mono">22 kg</td><td className="c mono">60s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">D</span><div className="exbody"><div>Rosca Direta</div><div className="instr">Em pé, flexione os cotovelos elevando a barra até a altura do peito.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">10–12</td><td className="c mono">2-0-2-0</td><td className="c mono">14 kg</td><td className="c mono">45s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">E</span><div className="exbody"><div>Rosca Martelo</div><div className="instr">Com os halteres em pronação neutra, flexione os cotovelos alternando os braços.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">12</td><td className="c mono">2-0-2-0</td><td className="c mono">12 kg</td><td className="c mono">45s</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Day 3 */}
                  <div className="day">
                    <div className="day-head" style={{ borderLeftColor: 'var(--amber)' }}><span className="tagn" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>3</span><div><p className="t">Inferior — Pernas <span style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '11px', background: '#FEF3E2', padding: '2px 8px', borderRadius: '999px', marginLeft: '4px' }}>adaptado p/ joelho</span></p><p className="m">Quarta-feira</p></div><span className="time"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> ~55 min</span></div>
                    <table className="ex">
                      <thead><tr><th>Exercício</th><th className="c">Séries</th><th className="c">Reps</th><th className="c">Cadência*</th><th className="c">Carga</th><th className="c">Descanso</th></tr></thead>
                      <tbody>
                        <tr><td><div className="exname"><span className="ltr">A</span><div className="exbody"><div>Leg Press 45°</div><div className="instr">Empurre a plataforma estendendo os joelhos, sem travá-los no topo.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">4</td><td className="c mono">12–15</td><td className="c mono">2-0-2-0</td><td className="c mono">120 kg</td><td className="c mono">90s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">B</span><div className="exbody"><div>Cadeira Extensora</div><div className="instr">Sentado, estenda os joelhos elevando o peso e controle a descida.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">15</td><td className="c mono">2-0-2-0</td><td className="c mono">35 kg</td><td className="c mono">60s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">C</span><div className="exbody"><div>Stiff</div><div className="instr">Com a barra à frente das coxas, incline o tronco mantendo as costas retas.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">4</td><td className="c mono">10–12</td><td className="c mono">2-0-2-0</td><td className="c mono">40 kg</td><td className="c mono">90s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">D</span><div className="exbody"><div>Elevação Pélvica</div><div className="instr">Com as costas apoiadas no banco, eleve o quadril contraindo os glúteos.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">4</td><td className="c mono">12</td><td className="c mono">2-0-2-0</td><td className="c mono">60 kg</td><td className="c mono">75s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">E</span><div className="exbody"><div>Panturrilha em Pé</div><div className="instr">Eleve os calcanhares do chão, pausando na contração máxima.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">4</td><td className="c mono">15–20</td><td className="c mono">2-0-2-0</td><td className="c mono">50 kg</td><td className="c mono">45s</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Day 4 */}
                  <div className="day">
                    <div className="day-head"><span className="tagn">4</span><div><p className="t">Superior — Ombros</p><p className="m">Sexta-feira</p></div><span className="time"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> ~40 min</span></div>
                    <table className="ex">
                      <thead><tr><th>Exercício</th><th className="c">Séries</th><th className="c">Reps</th><th className="c">Cadência*</th><th className="c">Carga</th><th className="c">Descanso</th></tr></thead>
                      <tbody>
                        <tr><td><div className="exname"><span className="ltr">A</span><div className="exbody"><div>Desenvolvimento Militar</div><div className="instr">Em pé ou sentado, empurre a barra acima da cabeça até estender os braços.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">4</td><td className="c mono">8–10</td><td className="c mono">2-0-2-0</td><td className="c mono">30 kg</td><td className="c mono">90s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">B</span><div className="exbody"><div>Elevação Lateral</div><div className="instr">Com os halteres ao lado do corpo, eleve os braços até a linha dos ombros.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">4</td><td className="c mono">12–15</td><td className="c mono">2-0-2-0</td><td className="c mono">8 kg</td><td className="c mono">45s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">C</span><div className="exbody"><div>Elevação Frontal</div><div className="instr">Eleve os halteres à frente do corpo até a altura dos ombros.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">12</td><td className="c mono">2-0-2-0</td><td className="c mono">8 kg</td><td className="c mono">45s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">D</span><div className="exbody"><div>Crucifixo Inverso</div><div className="instr">Inclinado à frente, abra os braços elevando os halteres lateralmente.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">15</td><td className="c mono">2-0-2-0</td><td className="c mono">10 kg</td><td className="c mono">45s</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Day 5 */}
                  <div className="day">
                    <div className="day-head"><span className="tagn">5</span><div><p className="t">Core — Core &amp; Cardio</p><p className="m">Sábado</p></div><span className="time"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> ~35 min</span></div>
                    <table className="ex">
                      <thead><tr><th>Exercício</th><th className="c">Séries</th><th className="c">Reps / Tempo</th><th className="c">Cadência*</th><th className="c">Carga</th><th className="c">Descanso</th></tr></thead>
                      <tbody>
                        <tr><td><div className="exname"><span className="ltr">A</span><div className="exbody"><div>Prancha</div><div className="instr">Apoiado nos antebraços e pontas dos pés, mantenha o corpo alinhado e reto.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">45s</td><td className="c mono">—</td><td className="c"><span className="dash">—</span></td><td className="c mono">30s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">B</span><div className="exbody"><div>Abdominal Infra</div><div className="instr">Deitado, eleve as pernas estendidas em direção ao teto contraindo o abdômen.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">15–20</td><td className="c mono">2-0-2-0</td><td className="c"><span className="dash">—</span></td><td className="c mono">30s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">C</span><div className="exbody"><div>Russian Twist</div><div className="instr">Sentado com o tronco levemente inclinado, gire o peso de um lado ao outro.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">3</td><td className="c mono">20</td><td className="c mono">2-0-2-0</td><td className="c mono">6 kg</td><td className="c mono">30s</td></tr>
                        <tr><td><div className="exname"><span className="ltr">D</span><div className="exbody"><div>Bike (baixo impacto)</div><div className="instr">Pedale em ritmo moderado e constante, mantendo a postura ereta.</div><a className="vid" href="#">▶ Ver vídeo</a></div></div></td><td className="c mono">1</td><td className="c mono">15 min</td><td className="c mono">—</td><td className="c mono">Mod.</td><td className="c"><span className="dash">—</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* ============ 4 · PLANO DE REFEIÇÕES ============ */}
                <section className="section">
                  <div className="sec-head"><span className="idx">04</span><div><h2>Plano de Refeições</h2><p className="d">Cardápio diário de 1.800 kcal, sem lactose, em cinco refeições.</p></div></div>

                  <div className="grid g2" style={{ marginBottom: '16px' }}>
                    <div className="card">
                      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 0 20"></path></svg> Meta Diária</h3>
                      <div className="grid g3" style={{ gap: '10px' }}>
                        <div className="stat" style={{ boxShadow: 'none' }}><p className="lab">Calorias</p><p className="num" style={{ fontSize: '21px' }}>1.800<small> kcal</small></p></div>
                        <div className="stat" style={{ boxShadow: 'none' }}><p className="lab">Refeições</p><p className="num" style={{ fontSize: '21px' }}>5<small>/dia</small></p></div>
                        <div className="stat" style={{ boxShadow: 'none' }}><p className="lab">Água</p><p className="num" style={{ fontSize: '21px' }}>2,5<small> L</small></p></div>
                      </div>
                    </div>
                    <div className="card">
                      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg> Distribuição de Macros</h3>
                      <div className="macros">
                        <svg viewBox="0 0 42 42" width="106" height="106" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="21" cy="21" r="15.915" fill="none" stroke="#EEF1F4" strokeWidth="6"/>
                          <circle cx="21" cy="21" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="6" strokeDasharray="40 60" strokeDashoffset="0" strokeLinecap="round"/>
                          <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="6" strokeDasharray="35 65" strokeDashoffset="-40" strokeLinecap="round"/>
                          <circle cx="21" cy="21" r="15.915" fill="none" stroke="#A855F7" strokeWidth="6" strokeDasharray="25 75" strokeDashoffset="-75" strokeLinecap="round"/>
                        </svg>
                        <div className="legend">
                          <div className="legrow"><span className="sw" style={{ background: '#3B82F6' }}></span><span className="nm">Proteína</span><span className="g">40% · 180g</span></div>
                          <div className="legrow"><span className="sw" style={{ background: '#F59E0B' }}></span><span className="nm">Carboidrato</span><span className="g">35% · 158g</span></div>
                          <div className="legrow"><span className="sw" style={{ background: '#A855F7' }}></span><span className="nm">Gordura</span><span className="g">25% · 50g</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="meal">
                    <div className="meal-head"><span className="ico">🥞</span><div><p className="nm">Café da manhã</p><p className="when">07:00 · pré-treino leve</p></div><div className="kcal"><p className="n">340</p><p className="l">kcal</p></div></div>
                    <div className="ing"><span>Omelete (3 claras + 1 ovo) com espinafre</span><span className="q">1 porção</span></div>
                    <div className="ing"><span>Aveia em flocos com canela</span><span className="q">40 g</span></div>
                    <div className="ing"><span>Mamão papaya</span><span className="q">100 g</span></div>
                    <div className="prep"><b>Modo de preparo:</b> Bata os ovos com uma pitada de sal e refogue com o espinafre picado. Sirva com a aveia misturada com canela e o mamão fatiado.</div>
                    <div className="mbar"><i style={{ width: '42%', background: '#3B82F6' }}></i><i style={{ width: '38%', background: '#F59E0B' }}></i><i style={{ width: '20%', background: '#A855F7' }}></i></div>
                    <div className="mleg"><span><em style={{ background: '#3B82F6' }}></em>P 28g</span><span><em style={{ background: '#F59E0B' }}></em>C 38g</span><span><em style={{ background: '#A855F7' }}></em>G 9g</span></div>
                  </div>

                  <div className="meal">
                    <div className="meal-head"><span className="ico">🍎</span><div><p className="nm">Lanche da manhã</p><p className="when">10:00</p></div><div className="kcal"><p className="n">220</p><p className="l">kcal</p></div></div>
                    <div className="ing"><span>Iogurte sem lactose natural</span><span className="q">170 g</span></div>
                    <div className="ing"><span>Maçã</span><span className="q">1 unid.</span></div>
                    <div className="ing"><span>Castanhas-do-pará</span><span className="q">2 unid.</span></div>
                    <div className="prep"><b>Modo de preparo:</b> Sirva o iogurte com a maçã picada por cima e as castanhas trituradas.</div>
                    <div className="mbar"><i style={{ width: '30%', background: '#3B82F6' }}></i><i style={{ width: '45%', background: '#F59E0B' }}></i><i style={{ width: '25%', background: '#A855F7' }}></i></div>
                    <div className="mleg"><span><em style={{ background: '#3B82F6' }}></em>P 16g</span><span><em style={{ background: '#F59E0B' }}></em>C 25g</span><span><em style={{ background: '#A855F7' }}></em>G 7g</span></div>
                  </div>

                  <div className="meal">
                    <div className="meal-head"><span className="ico">🥗</span><div><p className="nm">Almoço</p><p className="when">13:00 · pós-treino</p></div><div className="kcal"><p className="n">560</p><p className="l">kcal</p></div></div>
                    <div className="ing"><span>Peito de frango grelhado</span><span className="q">150 g</span></div>
                    <div className="ing"><span>Arroz integral</span><span className="q">4 col. sopa</span></div>
                    <div className="ing"><span>Feijão</span><span className="q">1 concha</span></div>
                    <div className="ing"><span>Salada verde + azeite</span><span className="q">à vontade</span></div>
                    <div className="prep"><b>Modo de preparo:</b> Grelhe o frango temperado a gosto. Sirva com o arroz, o feijão e uma salada fresca temperada com azeite.</div>
                    <div className="mbar"><i style={{ width: '45%', background: '#3B82F6' }}></i><i style={{ width: '35%', background: '#F59E0B' }}></i><i style={{ width: '20%', background: '#A855F7' }}></i></div>
                    <div className="mleg"><span><em style={{ background: '#3B82F6' }}></em>P 52g</span><span><em style={{ background: '#F59E0B' }}></em>C 55g</span><span><em style={{ background: '#A855F7' }}></em>G 14g</span></div>
                  </div>

                  <div className="meal">
                    <div className="meal-head"><span className="ico">🥤</span><div><p className="nm">Lanche da tarde</p><p className="when">16:30</p></div><div className="kcal"><p className="n">230</p><p className="l">kcal</p></div></div>
                    <div className="ing"><span>Whey protein isolado (sem lactose)</span><span className="q">1 scoop</span></div>
                    <div className="ing"><span>Banana</span><span className="q">1 unid.</span></div>
                    <div className="prep"><b>Modo de preparo:</b> Bata o whey com água ou gelo. Sirva acompanhado da banana.</div>
                    <div className="mbar"><i style={{ width: '55%', background: '#3B82F6' }}></i><i style={{ width: '35%', background: '#F59E0B' }}></i><i style={{ width: '10%', background: '#A855F7' }}></i></div>
                    <div className="mleg"><span><em style={{ background: '#3B82F6' }}></em>P 30g</span><span><em style={{ background: '#F59E0B' }}></em>C 22g</span><span><em style={{ background: '#A855F7' }}></em>G 3g</span></div>
                  </div>

                  <div className="meal">
                    <div className="meal-head"><span className="ico">🍽️</span><div><p className="nm">Jantar</p><p className="when">20:00</p></div><div className="kcal"><p className="n">450</p><p className="l">kcal</p></div></div>
                    <div className="ing"><span>Salmão grelhado</span><span className="q">130 g</span></div>
                    <div className="ing"><span>Batata-doce</span><span className="q">120 g</span></div>
                    <div className="ing"><span>Brócolis e legumes no vapor</span><span className="q">à vontade</span></div>
                    <div className="prep"><b>Modo de preparo:</b> Grelhe o salmão. Cozinhe a batata-doce e os legumes no vapor até ficarem macios.</div>
                    <div className="mbar"><i style={{ width: '40%', background: '#3B82F6' }}></i><i style={{ width: '32%', background: '#F59E0B' }}></i><i style={{ width: '28%', background: '#A855F7' }}></i></div>
                    <div className="mleg"><span><em style={{ background: '#3B82F6' }}></em>P 38g</span><span><em style={{ background: '#F59E0B' }}></em>C 30g</span><span><em style={{ background: '#A855F7' }}></em>G 17g</span></div>
                  </div>

                  <div className="note" style={{ marginTop: '6px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75-1.06 4-2.94 1.5-2.25 2-5.5 2-7 0-2.5-1.5-4-3.5-4-1.5 0-2.5 1-3 1.5-.5-.5-1.5-1.5-3-1.5C5 7 3.5 8.5 3.5 11c0 1.5.5 4.75 2 7 1.25 1.88 2.5 2.94 4 2.94Z"></path><path d="M10 2c1 .5 2 2 2 5"></path></svg>
                    <span>Cardápio livre de lactose e dos itens rejeitados (fígado, jiló). Substituições equivalentes em calorias e macros podem ser combinadas com a nutricionista. Priorize alimentos integrais e hidratação constante.</span>
                  </div>
                </section>

              </div>

              <div className="footer">
                <span className="fb"><svg width="16" height="16" viewBox="119 94 275 323" fill="currentColor"><path d="M256.5 94V151.633L341.5 199.817H341.462V267.839L394 250.881V229.584V199.817V171.951L256.5 94Z"/><path d="M119 199.817V229.584V250.881L171.538 267.839V199.817H171.5L256.5 151.633V94L119 171.951V199.817Z"/><path d="M119.153 277.633C118.789 279.803 119.153 321.189 119.153 321.189L170.253 341.142V385.774L256.5 416.981L341.999 385.774V340.778L394 323.359V277.633L307.216 309.935V352.396L256.5 373.08L207.202 356.391L206.838 309.935L119.153 277.633Z"/></svg> Ybytu · Plano personalizado · #PL-28471</span>
                <span>Mariana Silva · Emitido 28/06/2026 · Revisão em 12 semanas</span>
              </div>

            </td></tr></tbody>
            <tfoot><tr><td className="ftr-space"></td></tr></tfoot>
          </table>
        </main>
      </div>
    </>
  );
}
