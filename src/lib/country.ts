export function detectCountryCodeFromTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Small, pragmatic map: good-enough for dialing codes defaults without network calls.
    const map: Record<string, string> = {
      "America/Mexico_City": "MX",
      "America/Tijuana": "MX",
      "America/Cancun": "MX",
      "America/New_York": "US",
      "America/Los_Angeles": "US",
      "America/Chicago": "US",
      "America/Denver": "US",
      "America/Phoenix": "US",
      "America/Bogota": "CO",
      "America/Lima": "PE",
      "America/Santiago": "CL",
      "America/Buenos_Aires": "AR",
      "America/Sao_Paulo": "BR",
      "Europe/Madrid": "ES",
      "Europe/London": "GB",
      "Europe/Paris": "FR",
      "Europe/Berlin": "DE",
      "Europe/Rome": "IT",
    };

    const direct = map[tz];
    return direct || null;
  } catch {
    return null;
  }
}

export function countryNameFromCode(code: string, locale: string): string {
  try {
    // Intl.DisplayNames is widely supported in modern browsers.
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return dn.of(code) || code;
  } catch {
    return code;
  }
}

