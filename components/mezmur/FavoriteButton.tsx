"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/actions/favorites";
import { useSession } from "@/lib/auth-client";

interface FavoriteButtonProps {
  mezmurId: string;
  initialFavorited: boolean;
  size?: number;
}

export function FavoriteButton({
  mezmurId,
  initialFavorited,
  size = 18,
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const [pulseKey, setPulseKey] = useState(0); // forces re-animation

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If not logged in, redirect to auth page
    if (!session?.user) {
      router.push("/auth");
      return;
    }

    // Optimistic update — flip instantly
    const nextValue = !isFavorited;
    setIsFavorited(nextValue);
    if (nextValue) setPulseKey((k) => k + 1); // trigger pulse animation

    startTransition(async () => {
      const result = await toggleFavorite(mezmurId);

      if ("error" in result) {
        // Revert optimistic update on error
        setIsFavorited(!nextValue);
        if (result.error === "NOT_AUTHENTICATED") {
          router.push("/auth");
        }
        return;
      }

      // Sync with server truth (in case of race)
      setIsFavorited(result.isFavorited);
    });
  };

  return (
    <button
      onClick={handleClick}
      className={`fav-btn ${isFavorited ? "fav-btn--active" : ""} ${isPending ? "fav-btn--pending" : ""}`}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      disabled={isPending}
    >
      <svg
        key={pulseKey}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isFavorited ? "heart-pulse" : ""}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <style>{styles}</style>
    </button>
  );
}

const styles = `
  .fav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: hsl(var(--color-text-3));
    cursor: pointer;
    transition: all var(--transition);
    flex-shrink: 0;
  }

  .fav-btn:hover {
    background: hsl(0 84% 60% / 0.1);
    color: hsl(0 84% 60%);
    transform: scale(1.15);
  }

  .fav-btn--active {
    color: hsl(0 84% 60%);
  }

  .fav-btn--active:hover {
    color: hsl(0 84% 50%);
  }

  .fav-btn--pending {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @keyframes heart-pop {
    0%   { transform: scale(1); }
    30%  { transform: scale(1.35); }
    60%  { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  .heart-pulse {
    animation: heart-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @media (max-width: 768px) {
    .fav-btn {
      width: 42px;
      height: 42px;
    }
  }
`;
