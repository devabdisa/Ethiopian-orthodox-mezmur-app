"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createPlaylist, addMezmurToPlaylist, getUserPlaylists } from "@/app/actions/playlist";

export function AddToPlaylistModal({ mezmurId, onClose }: { mezmurId: string; onClose: () => void }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getUserPlaylists().then((data) => {
      setPlaylists(data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async (id: string) => {
    await addMezmurToPlaylist(id, mezmurId);
    onClose();
  };

  const handleCreateAndAdd = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    const res = await createPlaylist(newName);
    if (res.playlist) await addMezmurToPlaylist(res.playlist.id, mezmurId);
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-wrapper animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title font-ethiopic">Add to Playlist</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body scrollbar-hide">
          {loading ? (
            <p className="modal-text text-muted">Loading...</p>
          ) : (
            <div className="pl-list">
              {playlists.map((pl) => (
                <button key={pl.id} className="pl-item" onClick={() => handleAdd(pl.id)}>
                  <span className="pl-name font-ethiopic">{pl.name}</span>
                  <span className="pl-count text-faint">{pl._count.mezmurs} tracks</span>
                </button>
              ))}
              {playlists.length === 0 && <p className="modal-text text-muted">No playlists found.</p>}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <input 
            type="text" placeholder="New Playlist Name" 
            value={newName} onChange={(e) => setNewName(e.target.value)}
            className="pl-input font-ethiopic"
          />
          <button disabled={!newName.trim() || isCreating} onClick={handleCreateAndAdd} className="pl-btn">
            Create
          </button>
        </div>
      </div>
      <style>{styles}</style>
    </div>,
    document.body
  );
}

const styles = `
  .modal-overlay { position: fixed; inset: 0; background: hsl(var(--color-bg) / .8); backdrop-filter: blur(4px); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal-wrapper { background: hsl(var(--color-surface)); border: 1px solid hsl(var(--color-border)); border-radius: var(--radius-lg); width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); overflow: hidden; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid hsl(var(--color-border)); }
  .modal-title { font-size: 16px; font-weight: 600; color: hsl(var(--color-text)); }
  .modal-close { background: none; border: none; font-size: 18px; color: hsl(var(--color-text-3)); cursor: pointer; }
  .modal-body { max-height: 280px; overflow-y: auto; padding: 8px 0; }
  .modal-text { padding: 16px 20px; text-align: center; font-size: 14px; }
  .pl-list { display: flex; flex-direction: column; }
  .pl-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border: none; background: transparent; cursor: pointer; text-align: left; transition: background var(--transition); }
  .pl-item:hover { background: hsl(var(--color-surface-2)); }
  .pl-name { font-size: 15px; color: hsl(var(--color-text)); }
  .pl-count { font-size: 12px; }
  .modal-footer { display: flex; flex-direction: column; gap: 8px; padding: 16px 20px; background: hsl(var(--color-surface-2)); border-top: 1px solid hsl(var(--color-border)); }
  @media (min-width: 480px) {
    .modal-footer { flex-direction: row; }
  }
  .pl-input { flex: 1; padding: 10px 14px; border: 1px solid hsl(var(--color-border)); border-radius: var(--radius-sm); background: hsl(var(--color-bg)); color: hsl(var(--color-text)); outline: none; transition: border-color var(--transition); width: 100%; box-sizing: border-box; }
  .pl-input:focus { border-color: hsl(var(--color-accent)); }
  .pl-btn { padding: 10px 18px; background: hsl(var(--color-accent)); color: hsl(var(--color-text-on-accent)); font-weight: 600; border: none; border-radius: var(--radius-sm); cursor: pointer; transition: opacity var(--transition); white-space: nowrap; width: 100%; }
  @media (min-width: 480px) {
    .pl-btn { width: auto; }
  }
  .pl-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;
