"use client";

import { useState } from "react";
import { AddToPlaylistModal } from "./AddToPlaylistModal";

export function AddToPlaylistButton({ mezmurId }: { mezmurId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={(e) => {
          e.preventDefault(); // Prevent navigating if inside a Link 
          e.stopPropagation(); // CRITICAL: Stop mobile row click from firing
          setIsOpen(true);
        }}
        className="add-pl-btn"
        aria-label="Add to Playlist"
        title="Add to Playlist"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {isOpen && (
        <AddToPlaylistModal
          mezmurId={mezmurId}
          onClose={() => setIsOpen(false)}
        />
      )}

      <style>{`
        .add-pl-btn {
          background: none;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--color-text-3));
          transition: all var(--transition);
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }
        .add-pl-btn:hover {
          color: hsl(var(--color-accent));
          background: hsl(var(--color-accent) / .1);
        }
      `}</style>
    </>
  );
}
