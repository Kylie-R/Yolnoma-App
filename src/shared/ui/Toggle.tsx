import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <label
      className={`flex items-center cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {label && (
        <span className="mr-2 text-sm font-medium text-white">{label}</span>
      )}
      <div className="relative top-[0.5px]">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <div
          className={`block h-6 w-12 rounded-full border transition-colors duration-200 ${
            checked
              ? "border-[var(--accent)] bg-[var(--accent)]"
              : "border-white/45 bg-transparent"
          }`}
        />
        <div
          className={`absolute left-1 top-1 h-4 w-4 transform rounded-full shadow-md transition-transform duration-200 ${
            checked ? "translate-x-6 bg-black/90" : "translate-x-0 bg-white/90"
          }`}
        />
      </div>
    </label>
  );
};

export default Toggle;
