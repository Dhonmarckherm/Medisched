"use client";

import { getPasswordStrength } from "@/lib/password";

/**
 * Live password strength meter: a colored progress bar, a Weak/Medium/Strong
 * label, and a requirements checklist. Drop it directly under any "create or
 * change password" input. Pure presentational — pass the current value in.
 */
export default function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);

  // Hide the whole meter until the user starts typing so the form stays clean.
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-gray-400">Password strength</span>
        <span className="text-[12px] font-semibold" style={{ color: strength.color }}>
          {strength.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
        />
      </div>

      {/* Requirements checklist */}
      <ul className="mt-2 space-y-0.5 p-0 m-0 list-none">
        {strength.requirements.map((req) => (
          <li key={req.key} className="flex items-center gap-1.5 text-[11.5px]">
            <span
              className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold ${
                req.met ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-300"
              }`}
              aria-hidden="true"
            >
              {req.met ? "✓" : "•"}
            </span>
            <span className={req.met ? "text-emerald-600" : "text-gray-400"}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
