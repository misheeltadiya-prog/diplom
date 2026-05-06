"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../profile.module.css";

const AVATAR_KEY = "cwork-user-avatar";

export function AvatarUpload({
  initials,
  initialUrl,
}: {
  initials: string;
  initialUrl?: string | null;
}) {
  const serverUrl = initialUrl?.trim() || null;
  const [avatar, setAvatar] = useState<string | null>(serverUrl);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (serverUrl) {
      setAvatar(serverUrl);
      return;
    }
    try {
      const stored = localStorage.getItem(AVATAR_KEY);
      if (stored) setAvatar(stored);
    } catch {
      /* ignore */
    }
  }, [serverUrl]);

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAvatar(result);
      try {
        localStorage.setItem(AVATAR_KEY, result);
      } catch {
        /* ignore */
      }
    };
    reader.readAsDataURL(file);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; url?: string };
      if (res.ok && data.url) {
        setAvatar(data.url);
        try {
          localStorage.setItem(AVATAR_KEY, data.url);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* offline / not logged in — local preview only */
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function removeAvatar() {
    setAvatar(null);
    try { localStorage.removeItem(AVATAR_KEY); } catch { /* ignore */ }
  }

  return (
    <div className={styles.avatarUploadWrap}>
      <div
        className={`${styles.avatarUploadZone} ${dragging ? styles.avatarUploadZoneDrag : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") inputRef.current?.click(); }}
        aria-label="Зураг оруулах"
      >
        {avatar ? (
          <img alt="Avatar" className={styles.avatarUploadPreview} src={avatar} />
        ) : (
          <div className={styles.avatarUploadPlaceholder}>
            <span className={styles.avatarUploadInitials}>{initials}</span>
            <span className={styles.avatarUploadHint}>
              <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" x2="12" y1="3" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Зураг оруулах
            </span>
          </div>
        )}
        <div className={styles.avatarUploadOverlay}>
          <svg fill="none" height="20" viewBox="0 0 24 24" width="20">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <polyline points="17 8 12 3 7 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" x2="12" y1="3" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <input
        accept="image/*"
        className={styles.avatarUploadInput}
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />

      <div className={styles.avatarUploadActions}>
        <button
          className={styles.avatarUploadBtn}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Зураг солих
        </button>
        {avatar ? (
          <button
            className={styles.avatarRemoveBtn}
            onClick={removeAvatar}
            type="button"
          >
            Устгах
          </button>
        ) : null}
      </div>
    </div>
  );
}
