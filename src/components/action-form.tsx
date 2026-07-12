"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";

type ActionResult = { error: string } | void | undefined;

type Props = {
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
};

/**
 * Envolve uma Server Action com useActionState para capturar e mostrar
 * mensagens de erro (ex: "email ou password incorretos") sem JavaScript
 * extra no lado do cliente — o formulário continua a funcionar mesmo
 * sem JS, o erro é que só aparece com JS ativo.
 */
export function ActionForm({ action, children, className }: Props) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async (_prevState, formData) => action(formData),
    undefined
  );

  return (
    <form action={formAction} className={className} data-pending={pending}>
      {children}
      {state && "error" in state && state.error ? (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
