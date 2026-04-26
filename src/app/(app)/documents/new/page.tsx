"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { DocumentCategory, Profile, Project } from "@/lib/types/database";

import styles from "../../new-form.module.css";

const categories: DocumentCategory[] = [
  "legal",
  "insurance",
  "maintenance",
  "tax",
  "financial",
  "medical",
  "notes",
  "other",
];

export default function NewDocumentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const projectFromQuery = searchParams.get("project");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadProjects() {
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

      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("name", { ascending: true })
        .returns<Project[]>();

      setProjects(projectData ?? []);
      if (projectFromQuery && projectData?.some((project) => project.id === projectFromQuery)) {
        setProjectId(projectFromQuery);
      }
    }

    void loadProjects();
  }, [projectFromQuery, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!file) {
      setError("Please choose a file.");
      setLoading(false);
      return;
    }

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

    const filePath = `${profile.tenant_id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("holmatrix-files")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setLoading(false);
      return;
    }

    const { data: fileRecord, error: fileRecordError } = await supabase
      .from("files")
      .insert({
        tenant_id: profile.tenant_id,
        storage_path: filePath,
        original_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        uploaded_by: user.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (fileRecordError || !fileRecord) {
      setError(fileRecordError?.message ?? "Unable to save file metadata.");
      setLoading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from("holmatrix-files").getPublicUrl(filePath);

    const { error: documentError } = await supabase.from("documents").insert({
      tenant_id: profile.tenant_id,
      project_id: projectId || null,
      name,
      category,
      file_id: fileRecord.id,
      url: publicData.publicUrl,
      added_by: user.id,
    });

    if (documentError) {
      setError(documentError.message);
      setLoading(false);
      return;
    }

    router.push("/documents");
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>New Document</h1>

      <form className={`hm-card ${styles.form}`} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className="hm-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="hm-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            <label className="hm-label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className={styles.select}
              value={category}
              onChange={(event) => setCategory(event.target.value as DocumentCategory)}
            >
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className="hm-label" htmlFor="file">
            File
          </label>
          <input
            id="file"
            type="file"
            className="hm-input"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
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
            {loading ? "Saving..." : "Create document"}
          </button>
        </div>
      </form>
    </div>
  );
}
