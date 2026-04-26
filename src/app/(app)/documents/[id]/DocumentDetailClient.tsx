"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { Document, DocumentCategory, Profile, Project } from "@/lib/types/database";

import styles from "./DocumentDetailClient.module.css";

const categoryOptions: DocumentCategory[] = [
  "legal",
  "insurance",
  "maintenance",
  "tax",
  "financial",
  "medical",
  "notes",
  "other",
];

interface FileMeta {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
}

interface DocumentDetailClientProps {
  document: Document;
  fileMeta: FileMeta | null;
  project: Project | null;
  projects: Project[];
  profile: Profile;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function DocumentDetailClient({
  document,
  fileMeta,
  project,
  projects,
  profile,
}: DocumentDetailClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState(document.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>(document.category);
  const [projectId, setProjectId] = useState(document.project_id ?? "");
  const [fileState, setFileState] = useState<FileMeta | null>(fileMeta);
  const [documentUrl, setDocumentUrl] = useState(document.url);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(document.name);
    setIsEditingName(false);
    setCategory(document.category);
    setProjectId(document.project_id ?? "");
    setFileState(fileMeta);
    setDocumentUrl(document.url);
  }, [document, fileMeta]);

  async function updateDocument(patch: Partial<Document>) {
    await supabase.from("documents").update(patch).eq("id", document.id);
  }

  async function replaceFile(file: File) {
    setUploading(true);

    const storagePath = `${profile.tenant_id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("holmatrix-files")
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      setUploading(false);
      return;
    }

    const { data: insertedFile } = await supabase
      .from("files")
      .insert({
        tenant_id: profile.tenant_id,
        storage_path: storagePath,
        original_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        uploaded_by: profile.id,
      })
      .select("*")
      .single<FileMeta>();

    if (!insertedFile) {
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("holmatrix-files")
      .getPublicUrl(storagePath);

    await updateDocument({
      file_id: insertedFile.id,
      url: publicData.publicUrl,
    });

    setFileState(insertedFile);
    setDocumentUrl(publicData.publicUrl);
    setUploading(false);
  }

  async function deleteDocument() {
    setDeleting(true);

    if (fileState?.storage_path) {
      await supabase.storage.from("holmatrix-files").remove([fileState.storage_path]);
    }
    if (fileState?.id) {
      await supabase.from("files").delete().eq("id", fileState.id);
    }

    await supabase.from("documents").delete().eq("id", document.id);
    router.push("/documents");
  }

  return (
    <div className={styles.page}>
      <Link href="/documents" className={styles.backLink}>
        {"\u2190"} Documents
      </Link>

      <div className={styles.titleWrap}>
        {isEditingName ? (
          <input
            className={styles.titleInput}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={async () => {
              setIsEditingName(false);
              const trimmed = name.trim();
              if (trimmed && trimmed !== document.name) {
                await updateDocument({ name: trimmed });
              }
            }}
            onKeyDown={async (event) => {
              if (event.key === "Enter") {
                setIsEditingName(false);
                const trimmed = name.trim();
                if (trimmed && trimmed !== document.name) {
                  await updateDocument({ name: trimmed });
                }
              }
            }}
            autoFocus
          />
        ) : (
          <h1 className={styles.title} onClick={() => setIsEditingName(true)}>
            {name}
          </h1>
        )}
      </div>

      <section className={`hm-card ${styles.metaCard}`}>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>Category</p>
            <select
              className={styles.metaControl}
              value={category}
              onChange={(event) => setCategory(event.target.value as DocumentCategory)}
              onBlur={async () => {
                if (category !== document.category) {
                  await updateDocument({ category });
                }
              }}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>Project</p>
            <select
              className={styles.metaControl}
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              onBlur={async () => {
                const nextProjectId = projectId || null;
                if (nextProjectId !== document.project_id) {
                  await updateDocument({ project_id: nextProjectId });
                }
              }}
            >
              <option value="">No project</option>
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>Project link</p>
            {project ? (
              <Link href={`/projects/${project.id}`} className={styles.projectLink}>
                {project.name}
              </Link>
            ) : (
              <p className={styles.metaValue}>No project</p>
            )}
          </div>

          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>Added</p>
            <p className={styles.metaValue}>{formatDate(document.created_at)}</p>
          </div>
        </div>

        <div className={styles.fileBlock}>
          <p className={styles.metaLabel}>File info</p>
          {fileState ? (
            <div className={styles.fileInfo}>
              <p className={styles.metaValue}>{fileState.original_name}</p>
              <p className={styles.metaMuted}>
                {formatFileSize(fileState.size_bytes)} · {fileState.mime_type}
              </p>
            </div>
          ) : (
            <p className={styles.metaMuted}>No file attached.</p>
          )}

          {documentUrl ? (
            <a href={documentUrl} target="_blank" rel="noreferrer" className={`hm-btn-primary ${styles.actionButton}`}>
              View file
            </a>
          ) : null}

          <div className={styles.fileReplace}>
            <label className="hm-label" htmlFor="replace-file">
              Replace file
            </label>
            <input
              id="replace-file"
              type="file"
              className="hm-input"
              disabled={uploading}
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) {
                  void replaceFile(selected);
                }
              }}
            />
          </div>
        </div>
      </section>

      <button
        type="button"
        className={`hm-btn-text ${styles.deleteButton}`}
        onClick={deleteDocument}
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete document"}
      </button>
    </div>
  );
}
