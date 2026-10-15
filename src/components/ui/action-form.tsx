"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { Button, Spinner, type ButtonSize, type ButtonVariant } from "./button";

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

const FormStateContext = createContext<{ state: ActionState; pending: boolean; submitter: string | null }>({
  state: { status: "idle" },
  pending: false,
  submitter: null,
});

/** "name=value" of a submit button, to tell which one of several was pressed. */
const submitterKey = (name?: string | null, value?: string | null) => (name ? `${name}=${value ?? ""}` : "");

/** The result of the closest ActionForm's last submit. */
export function useFormResult(): ActionState {
  return useContext(FormStateContext).state;
}

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
  /** Off when a StickySave inside the form shows the message instead. */
  showMessage?: boolean;
};

/**
 * A form bound to a Server Action that shows its success or error message.
 * Submitting through a transition keeps what the user typed when the server rejects it
 * (React would otherwise reset the fields after every action).
 */
export function ActionForm({ action, children, className, resetOnSuccess, showMessage = true }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const [submitter, setSubmitter] = useState<string | null>(null);

  useEffect(() => {
    if (resetOnSuccess && state.status === "success") formRef.current?.reset();
  }, [state, resetOnSuccess]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const button = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, button);
    setSubmitter(submitterKey(button?.getAttribute("name"), button?.getAttribute("value")));
    startTransition(() => formAction(formData));
  }

  return (
    <FormStateContext.Provider value={{ state, pending, submitter }}>
      <form ref={formRef} action={formAction} onSubmit={onSubmit} className={cn("space-y-4", className)}>
        {children}
        {showMessage ? <FormMessage state={state} /> : null}
      </form>
    </FormStateContext.Provider>
  );
}

/** A save bar that stays at the bottom of the screen for long forms, with the result next to the button. */
export function StickySave({ children }: { children: ReactNode }) {
  const { state } = useContext(FormStateContext);
  return (
    <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-end gap-3 rounded-theme border border-border bg-card/90 p-3 shadow-lift backdrop-blur-lg lg:bottom-4">
      <div className="min-w-0 flex-1 [&>p]:py-2">
        <FormMessage state={state} />
      </div>
      {children}
    </div>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;
  const isError = state.status === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <p
      // A new message (another save) replays the entrance.
      key={JSON.stringify(state)}
      role={isError ? "alert" : "status"}
      className={cn(
        "flex animate-fade-up items-center gap-2 rounded-theme px-3.5 py-2.5 text-sm font-medium sm:col-span-full",
        isError
          ? "bg-red-500/10 text-red-700 dark:text-red-400"
          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {state.message}
    </p>
  );
}

type SubmitButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
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
  const { pending: actionPending, submitter } = useContext(FormStateContext);
  const { pending: formPending, data } = useFormStatus();
  const pending = actionPending || formPending;
  const key = submitterKey(props.name, props.value);
  // With several buttons in one form, only the pressed one spins.
  const spinning =
    pending && (!key || (actionPending ? submitter === key : data?.get(props.name!) === (props.value ?? "")));
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
      {spinning ? <Spinner className="absolute" /> : null}
      <span className={cn("inline-flex items-center gap-2", spinning && "invisible")}>{children}</span>
    </Button>
  );
}
