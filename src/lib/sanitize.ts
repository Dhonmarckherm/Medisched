/**
 * Input sanitization utility
 * Prevents XSS, injection attacks, and other input-based vulnerabilities
 */

// Sanitize a string input - removes dangerous characters and trims whitespace
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Escape HTML entities to prevent XSS
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Sanitize email - only allow valid email characters
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase().replace(/[^a-z0-9._@+-]/gi, "");
}

// Sanitize ID number - only allow alphanumeric, dashes, dots
export function sanitizeIdNumber(idNumber: string): string {
  if (typeof idNumber !== "string") return "";
  return idNumber.trim().replace(/[^a-zA-Z0-9\-.]/g, "");
}

// Sanitize name - allow letters, spaces, hyphens, apostrophes, periods
export function sanitizeName(name: string): string {
  if (typeof name !== "string") return "";
  return name.trim().replace(/[^a-zA-Z\s\-'.ñÑ]/g, "");
}

// Validate and sanitize an object with specific field rules
export function sanitizeFields<T extends Record<string, string>>(
  input: T,
  rules: Record<keyof T, "email" | "id_number" | "name" | "general">
): Record<keyof T, string> {
  const result = {} as Record<keyof T, string>;
  
  for (const [key, rule] of Object.entries(rules)) {
    const value = input[key as keyof T] || "";
    switch (rule) {
      case "email":
        result[key as keyof T] = sanitizeEmail(value);
        break;
      case "id_number":
        result[key as keyof T] = sanitizeIdNumber(value);
        break;
      case "name":
        result[key as keyof T] = sanitizeName(value);
        break;
      case "general":
        result[key as keyof T] = sanitizeInput(value);
        break;
    }
  }
  
  return result;
}

// Check for common SQL injection patterns
export function detectSQLInjection(input: string): boolean {
  if (typeof input !== "string") return false;
  
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b.*\b(FROM|INTO|SET|TABLE|DATABASE|FUNCTION)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\bAND\b\s+\d+\s*=\s*\d+)/i,
    /('|"|`)\s*(OR|AND)\s*\1/i,
  ];
  
  return patterns.some(pattern => pattern.test(input));
}
