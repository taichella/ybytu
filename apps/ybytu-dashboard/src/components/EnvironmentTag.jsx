// Tag do ambiente em que o exercício é executável. O valor vem PRONTO do
// servidor (ybytu-admin-exercises -> environment_tag / environment_label_ptbr),
// calculado pela mesma função que o gerador de treino usa pra filtrar o pool
// (supabase/functions/_shared/exerciseEnvironment.ts). Nada é presumido aqui:
// sem dado (ou resposta de servidor antiga sem o campo), mostra "ambiente não
// definido" em destaque -- nunca um ambiente inventado.

const STYLES = {
  home_no_equipment: { bg: 'rgba(22,163,74,.12)', color: '#15803d', border: 'rgba(22,163,74,.3)' },
  home_with_equipment: { bg: 'rgba(59,130,246,.12)', color: '#2563eb', border: 'rgba(59,130,246,.3)' },
  gym_only: { bg: 'var(--surface-2)', color: 'var(--text)', border: 'var(--border)' },
  undefined: { bg: 'rgba(217,119,6,.16)', color: '#b45309', border: 'rgba(217,119,6,.55)' },
};

export default function EnvironmentTag({ tag, label, small = false }) {
  const known = tag && STYLES[tag] && tag !== 'undefined';
  const key = known ? tag : 'undefined';
  const st = STYLES[key];
  const text = known ? (label || tag) : 'Ambiente não definido';
  return (
    <span
      data-env-tag={key}
      title={known ? `Ambiente: ${text}` : 'Este exercício não tem equipamento cadastrado, então o ambiente não pode ser determinado'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: small ? '2px 7px' : '3px 9px', borderRadius: '7px',
        fontSize: small ? '10.5px' : '11.5px', fontWeight: key === 'undefined' ? 900 : 700, whiteSpace: 'nowrap',
        background: st.bg, color: st.color, border: `1px solid ${st.border}`,
      }}
    >
      {key === 'undefined' && <span aria-hidden="true">⚠</span>}
      {text}
    </span>
  );
}
