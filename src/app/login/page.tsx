"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    if (useMagicLink) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Check your email for your sign-in link.");
      }
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
    setSubmitting(false);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        <h1 className={styles.title}>holmatrix</h1>

        <form className={`hm-card ${styles.form}`} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="hm-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          {!useMagicLink && (
            <>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="hm-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </>
          )}

          <button className={`hm-btn-primary ${styles.submit}`} type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : useMagicLink ? "Send magic link" : "Sign in"}
          </button>

          <button
            className={`hm-btn-text ${styles.toggle}`}
            type="button"
            onClick={() => {
              setUseMagicLink((current) => !current);
              setMessage("");
            }}
          >
            {useMagicLink
              ? "Sign in with a password instead"
              : "Sign in with a magic link instead"}
          </button>

          {message && <p className={styles.message}>{message}</p>}
        </form>
      </div>
    </div>
  );
}
