const NETWORK_PATTERNS = [
  "network",
  "failed to fetch",
  "timeout",
  "etimedout",
  "econn",
  "socket",
  "bağlantı",
];

const AUTH_PATTERNS = ["401", "unauthorized", "oturum", "giriş yapmanız gerekiyor"];
const FORBIDDEN_PATTERNS = ["403", "forbidden", "yetkiniz yok"];
const NOT_FOUND_PATTERNS = ["404", "not found", "bulunamadı"];
const SERVER_PATTERNS = ["500", "sunucu", "internal"];

const hasAny = (text: string, patterns: string[]): boolean =>
  patterns.some((item) => text.includes(item));

export const friendlyErrorMessage = (rawMessage: string | null | undefined, fallback: string): string => {
  if (!rawMessage) return fallback;
  const normalized = rawMessage.trim().toLowerCase();
  if (!normalized) return fallback;

  if (hasAny(normalized, NETWORK_PATTERNS)) {
    return "Bağlantı sorunu oluştu. Lütfen tekrar deneyin.";
  }
  if (hasAny(normalized, AUTH_PATTERNS)) {
    return "Devam etmek için giriş yapmanız gerekiyor.";
  }
  if (hasAny(normalized, FORBIDDEN_PATTERNS)) {
    return "Bu işlem için yetkiniz bulunmuyor.";
  }
  if (hasAny(normalized, NOT_FOUND_PATTERNS)) {
    return "İlgili içerik bulunamadı.";
  }
  if (hasAny(normalized, SERVER_PATTERNS)) {
    return "Sunucuya ulaşılamadı. Lütfen biraz sonra tekrar deneyin.";
  }

  if (rawMessage.length > 120 || rawMessage.includes("/api/") || rawMessage.includes("http")) {
    return fallback;
  }

  return rawMessage;
};
