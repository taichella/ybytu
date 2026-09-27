import {
  parsePhoneNumberFromString,
  AsYouType,
  getCountries,
  getCountryCallingCode,
} from 'libphonenumber-js';

export { AsYouType, parsePhoneNumberFromString };

export const PRIORITY_COUNTRIES = ['BR', 'PT', 'FR'];
export const FALLBACK_COUNTRY_NAMES = { BR: 'Brasil', PT: 'Portugal', FR: 'França' };

let countryNameFormatter = null;
try {
  countryNameFormatter = new Intl.DisplayNames(['pt'], { type: 'region' });
} catch (e) {
  /* segue sem, usa fallback */
}

export const getCountryLabel = (iso) => {
  if (countryNameFormatter) {
    try {
      const name = countryNameFormatter.of(iso);
      if (name && name !== iso) return name;
    } catch (e) {
      /* ISO não reconhecido pelo formatter, cai no fallback */
    }
  }
  return FALLBACK_COUNTRY_NAMES[iso] || iso;
};

export const getFlagEmoji = (iso) => {
  try {
    return String.fromCodePoint(...[...String(iso).toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
  } catch (e) {
    return '';
  }
};

export const ALL_COUNTRIES = (() => {
  const isos = getCountries();
  const list = isos.map((iso) => ({
    iso,
    name: getCountryLabel(iso),
    dial: `+${getCountryCallingCode(iso)}`,
    flag: getFlagEmoji(iso),
  }));
  const byIso = Object.fromEntries(list.map((c) => [c.iso, c]));
  const priority = PRIORITY_COUNTRIES.map((iso) => byIso[iso]).filter(Boolean);
  const rest = list
    .filter((c) => !PRIORITY_COUNTRIES.includes(c.iso))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return [...priority, ...rest];
})();

export const COUNTRY_PLACEHOLDERS = {
  BR: 'Ex: (11) 91234-5678',
  PT: 'Ex: 912 345 678',
  FR: 'Ex: 06 12 34 56 78',
  US: 'Ex: (201) 555-0123',
  GB: 'Ex: 07911 123456',
  ES: 'Ex: 612 34 56 78',
  DE: 'Ex: 01512 3456789',
  IT: 'Ex: 312 345 6789',
};

export const getCountryPlaceholder = (iso) => COUNTRY_PLACEHOLDERS[iso] || 'Ex: Número de WhatsApp';

export const getPhoneValidation = (rawValue, countryIso) => {
  const raw = String(rawValue || '').trim();
  if (!raw) return { error: null, e164: null, preview: null, detectedCountry: null };
  const parsed = raw.startsWith('+')
    ? parsePhoneNumberFromString(raw)
    : parsePhoneNumberFromString(raw, countryIso);
  if (!parsed || !parsed.isValid()) {
    return {
      error: `Número inválido para ${getCountryLabel(countryIso)}. Confira o DDD/código de área.`,
      e164: null,
      preview: null,
      detectedCountry: null,
    };
  }
  return {
    error: null,
    e164: parsed.number, // E.164 com "+" -- Meta WhatsApp API exige esse formato
    preview: parsed.formatInternational(),
    detectedCountry: parsed.country || null,
  };
};

const PHONE_AREA_DIGITS = { BR: 2, US: 3, CA: 3, FR: 1 };

export const maskPhone = (phone) => {
  const raw = String(phone || '').trim();
  if (!raw) return raw;
  const parsed = parsePhoneNumberFromString(raw);
  if (!parsed) {
    if (raw.length < 7) return raw;
    return `${raw.slice(0, 4)}${'•'.repeat(Math.max(raw.length - 6, 0))}${raw.slice(-2)}`;
  }
  const cc = `+${parsed.countryCallingCode}`;
  const body = parsed.country === 'BR'
    ? parsed.formatNational()
    : parsed.formatInternational().replace(/^\+\d+\s*/, '');
  const totalDigits = (body.match(/\d/g) || []).length;
  const areaDigits = Math.min(PHONE_AREA_DIGITS[parsed.country] ?? 2, Math.max(totalDigits - 3, 0));
  let seen = 0;
  const masked = body.replace(/\d/g, (d) => {
    const i = seen++;
    return (i < areaDigits || i >= totalDigits - 2) ? d : '•';
  });
  return `${cc} ${masked}`;
};
