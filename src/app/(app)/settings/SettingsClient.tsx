"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { NotificationPreference, Profile } from "@/lib/types/database";

import styles from "./SettingsClient.module.css";

type PreferenceField =
  | "email_enabled"
  | "task_assignments"
  | "task_completions"
  | "share_invites"
  | "grocery_updates"
  | "weekly_digest";

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function SettingsClient() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [preferredEmail, setPreferredEmail] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setPrimaryEmail(user.email ?? "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>();

      if (profileError || !profile) {
        setErrorMessage(profileError?.message ?? "Unable to load profile.");
        setLoading(false);
        return;
      }

      setTenantId(profile.tenant_id);
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
      setPreferredEmail(profile.preferred_email ?? "");
      setSecondaryEmail(profile.secondary_email ?? "");

      const { data: prefRow } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<NotificationPreference>();

      if (prefRow) {
        setPreferences(prefRow);
      } else {
        const { data: created } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: user.id,
            email_enabled: true,
            push_enabled: false,
            task_assignments: true,
            task_completions: true,
            share_invites: true,
            grocery_updates: true,
            weekly_digest: true,
          })
          .select("*")
          .single<NotificationPreference>();
        setPreferences(created ?? null);
      }

      setLoading(false);
    }

    void loadSettings();
  }, [router, supabase]);

  async function saveProfilePatch(patch: Partial<Profile>) {
    setErrorMessage("");
    setSavingMessage("Saving...");
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) {
      setErrorMessage(error.message);
      setSavingMessage("");
      return false;
    }
    setSavingMessage("Saved");
    window.setTimeout(() => setSavingMessage(""), 1200);
    return true;
  }

  async function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !userId || !tenantId) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose an image file.");
      return;
    }

    const storagePath = `${tenantId}/avatars/${userId}-${Date.now()}-${file.name}`;
    setSavingMessage("Uploading avatar...");
    setErrorMessage("");

    const { error: uploadError } = await supabase.storage
      .from("holmatrix-files")
      .upload(storagePath, file, { upsert: false });
    if (uploadError) {
      setErrorMessage(uploadError.message);
      setSavingMessage("");
      return;
    }

    const { data: publicData } = supabase.storage.from("holmatrix-files").getPublicUrl(storagePath);
    const nextUrl = publicData.publicUrl;
    setAvatarUrl(nextUrl);
    await saveProfilePatch({ avatar_url: nextUrl });
  }

  async function savePreference(field: PreferenceField, value: boolean) {
    if (!preferences) return;
    const next = { ...preferences, [field]: value };
    setPreferences(next);

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: userId,
          email_enabled: next.email_enabled,
          push_enabled: next.push_enabled,
          task_assignments: next.task_assignments,
          task_completions: next.task_completions,
          share_invites: next.share_invites,
          grocery_updates: next.grocery_updates,
          weekly_digest: next.weekly_digest,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single<NotificationPreference>();

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setPreferences(data);
  }

  async function handlePasswordSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSavingMessage("Password updated");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordForm(false);
    window.setTimeout(() => setSavingMessage(""), 1200);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return <div className={styles.page}>Loading settings...</div>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      {savingMessage ? <p className={styles.savedMessage}>{savingMessage}</p> : null}
      {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}

      <section className={`hm-card ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Profile</h2>

        <div className={styles.avatarRow}>
          <div className={styles.avatarPreview}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Profile avatar" className={styles.avatarImage} />
            ) : (
              <span>{initials(displayName, primaryEmail)}</span>
            )}
          </div>
          <div className={styles.avatarUpload}>
            <label className="hm-label" htmlFor="avatar-upload">
              Avatar
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hm-input"
              onChange={(event) => void onAvatarChange(event)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className="hm-label" htmlFor="display-name">
            Display name
          </label>
          <input
            id="display-name"
            className="hm-input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            onBlur={() => void saveProfilePatch({ display_name: displayName || null })}
          />
        </div>
      </section>

      <section className={`hm-card ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Email</h2>
        <div className={styles.field}>
          <p className="hm-label">Primary email</p>
          <p className={styles.readOnlyValue}>{primaryEmail || "No email"}</p>
        </div>

        <div className={styles.field}>
          <label className="hm-label" htmlFor="preferred-email">
            Preferred email
          </label>
          <input
            id="preferred-email"
            className="hm-input"
            value={preferredEmail}
            onChange={(event) => setPreferredEmail(event.target.value)}
            onBlur={() => void saveProfilePatch({ preferred_email: preferredEmail || null })}
          />
        </div>

        <div className={styles.field}>
          <label className="hm-label" htmlFor="secondary-email">
            Secondary email
          </label>
          <input
            id="secondary-email"
            className="hm-input"
            value={secondaryEmail}
            onChange={(event) => setSecondaryEmail(event.target.value)}
            onBlur={() => void saveProfilePatch({ secondary_email: secondaryEmail || null })}
          />
        </div>
      </section>

      <section className={`hm-card ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Notifications</h2>

        <label className={styles.toggleRow}>
          <span>Email notifications enabled</span>
          <input
            type="checkbox"
            checked={preferences?.email_enabled ?? false}
            onChange={(event) => void savePreference("email_enabled", event.target.checked)}
          />
        </label>

        <label className={styles.toggleRow}>
          <span>Task assignments</span>
          <input
            type="checkbox"
            checked={preferences?.task_assignments ?? false}
            onChange={(event) => void savePreference("task_assignments", event.target.checked)}
          />
        </label>

        <label className={styles.toggleRow}>
          <span>Task completions</span>
          <input
            type="checkbox"
            checked={preferences?.task_completions ?? false}
            onChange={(event) => void savePreference("task_completions", event.target.checked)}
          />
        </label>

        <label className={styles.toggleRow}>
          <span>Share invites</span>
          <input
            type="checkbox"
            checked={preferences?.share_invites ?? false}
            onChange={(event) => void savePreference("share_invites", event.target.checked)}
          />
        </label>

        <label className={styles.toggleRow}>
          <span>Grocery updates</span>
          <input
            type="checkbox"
            checked={preferences?.grocery_updates ?? false}
            onChange={(event) => void savePreference("grocery_updates", event.target.checked)}
          />
        </label>

        <label className={styles.toggleRow}>
          <span>Weekly digest</span>
          <input
            type="checkbox"
            checked={preferences?.weekly_digest ?? false}
            onChange={(event) => void savePreference("weekly_digest", event.target.checked)}
          />
        </label>
      </section>

      <section className={`hm-card ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Account</h2>

        <button
          type="button"
          className={`hm-btn-text ${styles.inlineButton}`}
          onClick={() => setShowPasswordForm((open) => !open)}
        >
          Change password
        </button>

        {showPasswordForm ? (
          <form className={styles.passwordForm} onSubmit={handlePasswordSave}>
            <div className={styles.field}>
              <label className="hm-label" htmlFor="new-password">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                className="hm-input"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className="hm-label" htmlFor="confirm-password">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                className="hm-input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            <button type="submit" className={`hm-btn-primary ${styles.passwordSaveButton}`}>
              {passwordSaving ? "Saving..." : "Save password"}
            </button>
          </form>
        ) : null}

        <button type="button" className={`hm-btn-text ${styles.signOutButton}`} onClick={handleSignOut}>
          Sign out
        </button>
      </section>
    </div>
  );
}
