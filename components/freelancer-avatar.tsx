"use client";

import { freelancerInitials, resolveFreelancerAvatarUrl } from "@/lib/freelancer-avatar";
import styles from "@/components/index-landing/index-landing.module.css";

type FreelancerAvatarProps = {
  fullName: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  imgClassName?: string;
};

export function FreelancerAvatar({
  fullName,
  avatarUrl,
  size = 72,
  className,
  imgClassName,
}: FreelancerAvatarProps) {
  const src = resolveFreelancerAvatarUrl(avatarUrl);
  const initials = freelancerInitials(fullName);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={fullName}
        className={imgClassName}
        src={src}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      className={`${styles.freelanceAvatarPlaceholder} ${className ?? ""}`.trim()}
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.32)) }}
    >
      {initials}
    </div>
  );
}
