"use client";

import { useState, useTransition } from "react";
import type { Errors, FormState } from "@/lib/schemas";

// Общая логика форм: значения в состоянии, проверка после первой попытки отправки,
// затем ошибки обновляются по мере ввода. Серверные ошибки сбрасываются при правке.
export function useForm<V extends Record<string, unknown>>({
  initial,
  validate,
  submit,
  resetOnSuccess = false,
}: {
  initial: V;
  validate: (values: V) => Errors;
  submit: (values: V) => Promise<FormState>;
  resetOnSuccess?: boolean;
}) {
  const [values, setValues] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [server, setServer] = useState<FormState>();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const errors: Errors = { ...server?.errors, ...(submitted ? validate(values) : {}) };

  function set<K extends keyof V>(key: K, value: V[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setServer(undefined);
    setDone(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(values)).length > 0) {
      const form = e.currentTarget;
      setTimeout(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    startTransition(async () => {
      const result = await submit(values);
      if (result?.error || result?.errors) {
        setServer(result);
        return;
      }
      setDone(true);
      if (resetOnSuccess) {
        setValues(initial);
        setSubmitted(false);
      }
    });
  }

  return { values, set, errors, formError: server?.error, done, pending, onSubmit };
}
