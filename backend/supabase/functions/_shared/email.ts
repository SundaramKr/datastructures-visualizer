const ALLOWED_DOMAIN = "@bmsce.ac.in";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAllowedEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return (
    normalized.endsWith(ALLOWED_DOMAIN) &&
    normalized.length > ALLOWED_DOMAIN.length &&
    !normalized.includes(" ")
  );
}

export function emailDomainError(): string {
  return "Only @bmsce.ac.in email addresses are allowed";
}
