/**
 * Shared password policy for MEDISCHED CERT.
 * Used by every server route that creates or changes credentials, and the
 * client forms mirror these rules for immediate feedback.
 *
 * Rule: at least 8 characters, containing at least one letter and one digit.
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Returns an error message string when the password is invalid,
 * or null when it satisfies the policy.
 */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length === 0) {
    return "Password is required";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /\d/.test(password);
  if (!hasLetter || !hasDigit) {
    return "Password must contain at least one letter and one number";
  }
  return null;
}
