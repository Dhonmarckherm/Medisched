/**
 * Shared password policy for MEDISCHED CERT.
 * Used by every server route that creates or changes credentials, and the
 * client forms mirror these rules (and the strength meter) for live feedback.
 *
 * Mandatory rule: at least 8 characters and must contain a letter, a number,
 * and a special character (e.g. ! @ # $ % ^ & * _ + ...).
 */
export const MIN_PASSWORD_LENGTH = 8;

// Any non-alphanumeric character counts as a "special"/symbol character.
const SPECIAL_REGEX = /[^A-Za-z0-9]/;
const LETTER_REGEX = /[A-Za-z]/;
const DIGIT_REGEX = /\d/;
const UPPER_REGEX = /[A-Z]/;
const LOWER_REGEX = /[a-z]/;

/** Example symbols surfaced to users in the UI hint. */
export const SPECIAL_CHAR_HINT = "!@#$%^&*()_+-=[]{};:,.<>?";

/** Human-readable summary of the policy (used in placeholder text). */
export const PASSWORD_POLICY_TEXT =
  "Min 8 characters with a letter, a number, and a symbol (!@#$%…)";

/**
 * Returns an error message string when the password is invalid,
 * or null when it satisfies the mandatory policy.
 */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length === 0) {
    return "Password is required";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!LETTER_REGEX.test(password)) {
    return "Password must contain at least one letter";
  }
  if (!DIGIT_REGEX.test(password)) {
    return "Password must contain at least one number";
  }
  if (!SPECIAL_REGEX.test(password)) {
    return "Password must contain at least one special character (e.g. ! @ # $ %)";
  }
  return null;
}

/** Convenience boolean wrapper around validatePassword. */
export function meetsPasswordPolicy(password: unknown): boolean {
  return validatePassword(password) === null;
}

export interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
}

export interface PasswordStrength {
  /** 0-100 for the progress bar width. */
  percent: number;
  /** 0-5 raw score. */
  score: number;
  label: "Weak" | "Medium" | "Strong";
  color: string;
  requirements: PasswordRequirement[];
}

/**
 * Scores a password for the live strength meter. This is intentionally more
 * granular than the mandatory policy: "Strong" rewards length, mixed case,
 * numbers and symbols even though only a subset is strictly required.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    { key: "length", label: `At least ${MIN_PASSWORD_LENGTH} characters`, met: password.length >= MIN_PASSWORD_LENGTH },
    { key: "case", label: "Upper & lowercase letters", met: UPPER_REGEX.test(password) && LOWER_REGEX.test(password) },
    { key: "number", label: "At least one number", met: DIGIT_REGEX.test(password) },
    { key: "symbol", label: "At least one symbol (!@#$%…)", met: SPECIAL_REGEX.test(password) },
    { key: "long", label: "12+ characters (recommended)", met: password.length >= 12 },
  ];

  const score = requirements.reduce((sum, r) => sum + (r.met ? 1 : 0), 0);
  const percent = Math.round((score / requirements.length) * 100);

  let label: PasswordStrength["label"] = "Weak";
  let color = "#dc3545"; // red
  if (score >= 5) {
    label = "Strong";
    color = "#198754"; // green
  } else if (score >= 3) {
    label = "Medium";
    color = "#fd7e14"; // orange
  }

  return { percent, score, label, color, requirements };
}
