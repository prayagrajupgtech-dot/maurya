import { useTheme } from "../App";

interface PasswordStrengthProps {
  password: string;
}

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/;

interface Condition {
  label: string;
  met: boolean;
}

function evaluateConditions(password: string): Condition[] {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Special character", met: SPECIAL_CHAR_REGEX.test(password) },
  ];
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const conditions = evaluateConditions(password);
  const errors = conditions.filter(c => !c.met).map(c => c.label);
  return { valid: errors.length === 0, errors };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { theme } = useTheme();
  const conditions = evaluateConditions(password);
  const metCount = conditions.filter(c => c.met).length;

  let barColor: string;
  let labelColor: string;
  let labelText: string;

  if (metCount <= 2) {
    barColor = "bg-red-500";
    labelColor = theme === "dark" ? "text-red-400" : "text-red-500";
    labelText = "WEAK";
  } else if (metCount <= 4) {
    barColor = "bg-amber-500";
    labelColor = theme === "dark" ? "text-amber-400" : "text-amber-500";
    labelText = "MEDIUM";
  } else {
    barColor = "bg-emerald-500";
    labelColor = theme === "dark" ? "text-emerald-400" : "text-emerald-500";
    labelText = "STRONG";
  }

  if (!password) return null;

  return (
    <div className={`rounded-xl p-3 space-y-3 ${theme === "dark" ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}>
      {/* Strength label + bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-black uppercase tracking-widest ${theme === "dark" ? "text-white/30" : "text-gray-400"}`}>
            Strength
          </span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${labelColor}`}>
            {labelText}
          </span>
        </div>
        <div className={`h-1.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-white/10" : "bg-gray-200"}`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${(metCount / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Conditions */}
      <div className="space-y-1">
        {conditions.map((condition) => (
          <div key={condition.label} className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${condition.met ? "text-emerald-400" : "text-red-400"}`}>
              {condition.met ? "✅" : "❌"}
            </span>
            <span className={`text-xs font-semibold ${condition.met
              ? theme === "dark" ? "text-white/50" : "text-gray-500"
              : theme === "dark" ? "text-white/30" : "text-gray-400"
            }`}>
              {condition.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
