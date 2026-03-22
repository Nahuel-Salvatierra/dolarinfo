export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AR: "ARS",
  AU: "AUD",
  BR: "BRL",
  CA: "CAD",
  CH: "CHF",
  CL: "CLP",
  CN: "CNY",
  CO: "COP",
  CZ: "CZK",
  DK: "DKK",
  EG: "EGP",
  EU: "EUR",
  GB: "GBP",
  HK: "HKD",
  HU: "HUF",
  ID: "IDR",
  IL: "ILS",
  IN: "INR",
  IS: "ISK",
  JP: "JPY",
  KR: "KRW",
  MX: "MXN",
  MY: "MYR",
  NG: "NGN",
  NO: "NOK",
  NZ: "NZD",
  PH: "PHP",
  PK: "PKR",
  PL: "PLN",
  RO: "RON",
  RU: "RUB",
  SA: "SAR",
  SE: "SEK",
  SG: "SGD",
  TH: "THB",
  TR: "TRY",
  TW: "TWD",
  UA: "UAH",
  US: "USD",
  VN: "VND",
  ZA: "ZAR",
};

export function getCurrencyForCountry(countryCode: string): string | undefined {
  const normalized = normalizeCountryCode(countryCode);
  return normalized ? COUNTRY_TO_CURRENCY[normalized] : undefined;
}

export function normalizeCountryCode(countryCode: string): string | undefined {
  const normalized = countryCode.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : undefined;
}

export function extractCountryFromLocale(locale: string): string | undefined {
  const normalizedLocale = locale.trim();
  if (!normalizedLocale) {
    return undefined;
  }

  try {
    const region = new Intl.Locale(normalizedLocale).region;
    if (region) {
      return normalizeCountryCode(region);
    }
  } catch {}

  const matches = normalizedLocale.match(/[-_]([A-Za-z]{2})(?:[-_]|$)/);
  if (!matches) {
    return undefined;
  }

  return normalizeCountryCode(matches[1]);
}

export function detectCountryFromAcceptLanguage(
  acceptLanguage: string,
): string | undefined {
  const locales = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim())
    .filter((value): value is string => Boolean(value));

  for (const locale of locales) {
    const country = extractCountryFromLocale(locale);
    if (country) {
      return country;
    }
  }

  return undefined;
}

export function detectCountryFromNavigatorLanguages(
  languages: readonly string[],
): string | undefined {
  for (const locale of languages) {
    const country = extractCountryFromLocale(locale);
    if (country) {
      return country;
    }
  }

  return undefined;
}
