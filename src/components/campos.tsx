"use client";

import type { ReactNode } from "react";

type CampoProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function Campo({ label, hint, children }: CampoProps) {
  return (
    <div>
      <label className="block text-sm text-neutral-300">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400";

export function CampoTexto({
  name,
  defaultValue,
  onChange,
  placeholder,
  type = "text",
}: {
  name: string;
  defaultValue?: string | number | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      name={name}
      defaultValue={defaultValue ?? ""}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}

export function CampoTextarea({
  name,
  defaultValue,
  onChange,
  placeholder,
  rows = 3,
}: {
  name: string;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      name={name}
      defaultValue={defaultValue ?? ""}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      rows={rows}
      className={inputClass}
    />
  );
}

export function CampoSelect({
  name,
  defaultValue,
  onChange,
  options,
  placeholder = "— Seleciona —",
}: {
  name: string;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  options: [string, string][];
  placeholder?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className={inputClass}
    >
      <option value="">{placeholder}</option>
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
