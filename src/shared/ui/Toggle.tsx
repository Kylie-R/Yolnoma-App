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
          className={`block h-5 w-9 rounded-full transition-colors duration-300 ${
            checked ? "bg-[#D97757]" : "bg-gray-300"
          }`}
        />
        <div
          className={`absolute left-0.5 top-0.5 h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );
};

export default Toggle;
