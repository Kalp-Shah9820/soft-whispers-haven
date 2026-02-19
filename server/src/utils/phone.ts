/**
 * Normalize a phone number to Twilio E.164 WhatsApp format.
 * Handles user-stored formats like "+91 72080 42263" and produces "whatsapp:+917208042263".
 *
 * - Removes spaces, dashes, brackets
 * - Ensures number starts with country code (+)
 * - Prepends whatsapp: prefix if missing
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  if (!phone || typeof phone !== "string") {
    return phone;
  }

  // Remove any existing whatsapp: prefix
  let cleaned = phone.replace(/^whatsapp:/i, "").trim();

  // Remove spaces, dashes (–, -, —), brackets (), [], {}
  cleaned = cleaned.replace(/[\s\-–—()[\]{}]/g, "");

  // Keep only digits and leading +
  cleaned = cleaned.replace(/[^\d+]/g, "");

  // Ensure starts with country code (+)
  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 10) {
      // 10-digit number without country code: use default (India +91)
      const defaultCountryCode =
        process.env.DEFAULT_PHONE_COUNTRY_CODE || "91";
      cleaned = "+" + defaultCountryCode + cleaned;
    } else {
      // Digits already include country code (e.g. 917208042263)
      cleaned = "+" + cleaned;
    }
  }

  // Prepends whatsapp: prefix if missing
  return cleaned.startsWith("whatsapp:") ? cleaned : `whatsapp:${cleaned}`;
}
