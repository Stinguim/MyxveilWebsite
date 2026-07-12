"use client";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export function AutoSaveIndicator({ status }: { status: AutoSaveStatus }) {
  if (status === "idle") return null;

  const label =
    status === "saving"
      ? "A guardar…"
      : status === "saved"
        ? "Guardado"
        : "Erro ao guardar";

  const className =
    status === "error" ? "text-red-400" : "text-neutral-500";

  return (
    <span className={`text-xs ${className}`} role="status" aria-live="polite">
      {label}
    </span>
  );
}
