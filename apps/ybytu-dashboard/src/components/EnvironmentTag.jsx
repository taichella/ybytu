// Tags dos ambientes em que o exercício é executável -- TODOS eles (2026-09-25:
// uma tag única sugeria exclusividade; um exercício de peso corporal serve em
// casa sem equipamento, em casa com equipamento e na academia). A lista vem
// PRONTA do servidor (ybytu-admin-exercises -> environments /
// environments_label_ptbr), calculada pela mesma função que o gerador de treino
// usa pra filtrar o pool (supabase/functions/_shared/exerciseEnvironment.ts).
// Nada é presumido aqui: lista vazia (ou resposta de servidor antiga sem o
// campo) mostra "ambiente não definido" em destaque -- nunca um ambiente inventado.
// Os chips quebram linha (flex-wrap) em vez de cortar texto ou gerar rolagem.

const STYLES = {
  home_no_equipment: { bg: 'rgba(22,163,74,.12)', color: '#15803d', border: 'rgba(22,163,74,.3)' },
  home_with_equipment: { bg: 'rgba(59,130,246,.12)', color: '#2563eb', border: 'rgba(59,130,246,.3)' },
  gym: { bg: 'var(--surface-2)', color: 'var(--text)', border: 'var(--border)' },
  undefined: { bg: 'rgba(217,119,6,.16)', color: '#b45309', border: 'rgba(217,119,6,.55)' },
};

function Chip({ envKey, text, title, small }) {
  const st = STYLES[envKey];
  return (
    <span
      data-env-tag={envKey}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: small ? '2px 7px' : '3px 9px', borderRadius: '7px',
        fontSize: small ? '10.5px' : '11.5px', fontWeight: envKey === 'undefined' ? 900 : 700, whiteSpace: 'nowrap',
        background: st.bg, color: st.color, border: `1px solid ${st.border}`,
      }}
    >
      {envKey === 'undefined' && <span aria-hidden="true">⚠</span>}
      {text}
    </span>
  );
}

export default function EnvironmentTag({ environments, labels, small = false }) {
  const known = (Array.isArray(environments) ? environments : [])
    .map((key, i) => ({ key, text: labels?.[i] || key }))
    .filter(({ key }) => STYLES[key] && key !== 'undefined');
  const title = `Cabe em: ${known.map((k) => k.text).join(' · ')}`;
  return (
    <span data-env-tags style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '4px', maxWidth: '100%' }}>
      {known.length === 0 ? (
        <Chip envKey="undefined" small={small} text="Ambiente não definido"
          title="Este exercício não tem equipamento cadastrado, então o ambiente não pode ser determinado" />
      ) : known.map(({ key, text }) => <Chip key={key} envKey={key} small={small} text={text} title={title} />)}
    </span>
  );
}
