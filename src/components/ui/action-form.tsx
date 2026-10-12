"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { Button, type ButtonVariant } from "./button";

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

const FormStateContext = createContext<{ state: ActionState; pending: boolean }>({
  state: { status: "idle" },
  pending: false,
});

/** Error message for a field from the closest ActionForm, if any. */
export function useFieldError(name: string | undefined): string | undefined {
  const { state } = useContext(FormStateContext);
  return name && state.status === "error" ? state.fields?.[name] : undefined;
}

type ActionFormProps = {
  action: FormAction;
  children: ReactNode;
  className?: string;
  /** Clear the fields after a successful submit (for "add" forms). */
  resetOnSuccess?: boolean;
};

/**
 * A form bound to a Server Action that shows its success or error message.
 * Submitting through a transition keeps what the user typed when the server rejects it
 * (React would otherwise reset the fields after every action).
 */
export function ActionForm({ action, children, className, resetOnSuccess }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state.status === "success") formRef.current?.reset();
  }, [state, resetOnSuccess]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  }

  return (
    <FormStateContext.Provider value={{ state, pending }}>
      <form ref={formRef} action={formAction} onSubmit={onSubmit} className={cn("space-y-4", className)}>
        {children}
        <FormMessage state={state} />
      </form>
    </FormStateContext.Provider>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "rounded-theme px-3 py-2 text-sm sm:col-span-full",
        state.status === "error"
          ? "bg-red-500/10 text-red-700 dark:text-red-400"
          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      )}
    >
      {state.message}
    </p>
  );
}

type SubmitButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  /** Asks for confirmation before submitting (for destructive actions). */
  confirm?: string;
  name?: string;
  value?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  "aria-label"?: string;
};

/** Submit button that disables itself while its form is being sent. */
export function SubmitButton({ children, confirm, ...props }: SubmitButtonProps) {
  const { pending: actionPending } = useContext(FormStateContext);
  const { pending: formPending } = useFormStatus();
  const pending = actionPending || formPending;
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
