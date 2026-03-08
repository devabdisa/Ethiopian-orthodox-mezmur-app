"use client";

import { usePlayerStore } from "@/store/playerStore";
import { deletePlaylist } from "@/app/actions/playlist";
import { useRouter } from "next/navigation";
import type { PlayerTrack } from "@/types";

export function PlaylistClientControls({ playlistId, tracks }: { playlistId: string; tracks: PlayerTrack[] }) {
  const play = usePlayerStore((s) => s.play);
  const router = useRouter();

  const handlePlayAll = () => {
    if (tracks.length > 0) play(tracks[0], tracks);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this playlist permanently?")) return;
    await deletePlaylist(playlistId);
    router.push("/playlists");
  };

  return (
    <div className="row">
      <button className="play-all-btn" onClick={handlePlayAll}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        Play All
      </button>
      <button className="del-btn text-faint" onClick={handleDelete}>Delete Playlist</button>

      <style>{`
        .row { display: flex; align-items: center; gap: 16px; margin-top: 16px; }
        .play-all-btn { background: hsl(var(--color-accent)); color: hsl(var(--color-text-on-accent)); padding: 12px 24px; border-radius: 99px; border: none; font-weight: 600; cursor: pointer; transition: transform var(--transition); box-shadow: var(--shadow-accent); display: flex; align-items: center; gap: 8px;}
        .play-all-btn:hover { transform: scale(1.05); filter: brightness(1.1); }
        .del-btn { background: none; border: none; font-size: 14px; text-decoration: underline; cursor: pointer; transition: color var(--transition); }
        .del-btn:hover { color: hsl(var(--color-text)); }
      `}</style>
    </div>
  );
}
