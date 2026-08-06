'use client';

export default function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      className={`admin-toggle ${checked ? 'on' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
    >
      <span className="admin-toggle-knob" />
    </button>
  );
}
