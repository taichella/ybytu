export default function ChipMultiSelect({ options, value, onChange, getValue = (o) => o.id, getLabel = (o) => o.name_ptbr }) {
  const toggle = (v) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '76px', overflowY: 'auto', padding: '2px' }}>
      {options.map((opt) => {
        const v = getValue(opt);
        const selected = value.includes(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => toggle(v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '8px',
              fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
              background: selected ? 'var(--brand)' : 'var(--surface-2)',
              color: selected ? '#fff' : 'var(--text)',
              border: selected ? 'none' : '1px solid var(--border)',
            }}
          >
            {getLabel(opt)}
          </button>
        );
      })}
      {options.length === 0 && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>—</span>}
    </div>
  );
}
