"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../profile.module.css";

function getAvatarKey(userId?: number) {
  return userId ? `cwork-user-avatar-${userId}` : "cwork-user-avatar";
}

export function AvatarUpload({
  initials,
  initialUrl,
  userId,
}: {
  initials: string;
  initialUrl?: string | null;
  userId?: number;
}) {
  const serverUrl = initialUrl?.trim() || null;
  const [avatar, setAvatar] = useState<string | null>(serverUrl);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const avatarKey = getAvatarKey(userId);

  useEffect(() => {
    // Migration: Clear old global avatar key once
    try {
      const migrated = localStorage.getItem("cwork-avatar-migrated");
      if (!migrated) {
        localStorage.removeItem("cwork-user-avatar");
        localStorage.setItem("cwork-avatar-migrated", "true");
      }
    } catch {
      /* ignore */
    }

    if (serverUrl) {
      setAvatar(serverUrl);
      return;
    }
    try {
      const stored = localStorage.getItem(avatarKey);
      if (stored) setAvatar(stored);
    } catch {
      /* ignore */
    }
  }, [serverUrl, avatarKey]);

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAvatar(result);
      try {
        localStorage.setItem(avatarKey, result);
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
          localStorage.setItem(avatarKey, data.url);
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
    try { localStorage.removeItem(avatarKey); } catch { /* ignore */ }
  }

  return (
    <div className={styles.fpAvatarRow}>
      <div className={styles.fpAvatarVisual}>
        <div
          className={`${styles.fpAvatarZone} ${dragging ? styles.fpAvatarZoneDrag : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") inputRef.current?.click();
          }}
          aria-label="Зураг оруулах"
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className={styles.fpAvatarPreview} src={avatar} />
          ) : (
            <div className={styles.fpAvatarPlaceholder}>{initials}</div>
          )}
        </div>
        <button
          type="button"
          className={styles.fpAvatarEditFab}
          onClick={() => inputRef.current?.click()}
          aria-label="Зураг засах"
        >
          <svg fill="none" height="16" viewBox="0 0 24 24" width="16" aria-hidden>
            <path
              d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <input
        accept="image/*"
        className={styles.avatarUploadInput}
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />

      <div className={styles.fpAvatarAside}>
        <h3 className={styles.fpAvatarTitle}>Профайл зураг</h3>
        <div className={styles.fpAvatarActions}>
          <button
            className={styles.avatarUploadBtn}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            Зураг солих
          </button>
          {avatar ? (
            <button className={styles.avatarRemoveBtn} onClick={removeAvatar} type="button">
              Устгах
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
