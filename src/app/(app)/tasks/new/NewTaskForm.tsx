"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { Profile, Project, TaskPriority, TaskStatus } from "@/lib/types/database";

import styles from "../../new-form.module.css";

export function NewTaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const projectFromQuery = searchParams.get("project");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<TaskStatus>("not_started");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>();
      if (!profile) return;

      const [{ data: projectData }, { data: profileData }] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .eq("tenant_id", profile.tenant_id)
          .order("name", { ascending: true })
          .returns<Project[]>(),
        supabase
          .from("profiles")
          .select("*")
          .eq("tenant_id", profile.tenant_id)
          .order("created_at", { ascending: true })
          .returns<Profile[]>(),
      ]);

      setProjects(projectData ?? []);
      setProfiles(profileData ?? []);
      if (projectFromQuery && projectData?.some((project) => project.id === projectFromQuery)) {
        setProjectId(projectFromQuery);
      }
    }

    void loadData();
  }, [projectFromQuery, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<Profile>();

    if (!profile) {
      setError("Unable to find your profile.");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert({
        tenant_id: profile.tenant_id,
        project_id: projectId || null,
        title,
        description: description || null,
        status,
        priority,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
        created_by: user.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError || !data) {
      setError(insertError?.message ?? "Unable to create task.");
      setLoading(false);
      return;
    }

    router.push(`/tasks/${data.id}`);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>New Task</h1>

      <form className={`hm-card ${styles.form}`} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className="hm-label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="hm-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className="hm-label" htmlFor="project">
              Project
            </label>
            <select
              id="project"
              className={styles.select}
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className="hm-label" htmlFor="assignee">
              Assignee
            </label>
            <select
              id="assignee"
              className={styles.select}
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
            >
              <option value="">Unassigned</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.display_name ?? profile.email}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className="hm-label" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className={styles.select}
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
            >
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className="hm-label" htmlFor="priority">
              Priority
            </label>
            <select
              id="priority"
              className={styles.select}
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className="hm-label" htmlFor="due-date">
              Due Date
            </label>
            <input
              id="due-date"
              type="date"
              className="hm-input"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className="hm-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className={styles.textarea}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={`hm-btn-text ${styles.cancel}`}
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button className={`hm-btn-primary ${styles.submit}`} type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}