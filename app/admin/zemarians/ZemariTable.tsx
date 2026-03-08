"use client";

import { Fragment, useState, useTransition } from "react";
import { updateZemari, deleteZemari } from "@/app/actions/admin";
import { ConfirmDeleteButton } from "@/components/admin/GodModeControls";

interface Zemari {
  id: string;
  name: string;
  nameAmharic: string | null;
  totalMezmurs: number;
}

export function ZemariTable({ zemarians }: { zemarians: Zemari[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmharic, setEditAmharic] = useState("");
  const [isPending, startTransition] = useTransition();

  function startEdit(zemari: Zemari) {
    setEditingId(zemari.id);
    setEditName(zemari.name);
    setEditAmharic(zemari.nameAmharic || "");
  }

  function handleSave(zemariId: string) {
    startTransition(async () => {
      await updateZemari(zemariId, {
        name: editName.trim(),
        nameAmharic: editAmharic.trim() || undefined,
      });
      setEditingId(null);
    });
  }

  return (
    <div>
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Zemari Name</th>
                <th style={{ width: "25%" }}>Amharic Name</th>
                <th style={{ width: "20%" }}>Mezmurs</th>
                <th style={{ width: "20%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zemarians.map((zemari) => (
                <Fragment key={zemari.id}>
                  {/* Zemari Row */}
                  <tr>
                    {/* Name */}
                    <td>
                      {editingId === zemari.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="inline-input"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave(zemari.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                      ) : (
                        <span className="cat-name-cell">{zemari.name}</span>
                      )}
                    </td>

                    {/* Amharic Name */}
                    <td>
                      {editingId === zemari.id ? (
                        <input
                          value={editAmharic}
                          onChange={(e) => setEditAmharic(e.target.value)}
                          className="inline-input"
                          placeholder="Amharic name..."
                        />
                      ) : (
                        <span className="cat-translit">
                          {zemari.nameAmharic || "—"}
                        </span>
                      )}
                    </td>

                    {/* Mezmur Count */}
                    <td>
                      <span className="cat-count">{zemari.totalMezmurs}</span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="action-buttons">
                        {editingId === zemari.id ? (
                          <>
                            <button
                              className="inline-save"
                              onClick={() => handleSave(zemari.id)}
                              disabled={isPending}
                            >
                              {isPending ? "..." : "Save"}
                            </button>
                            <button
                              className="inline-cancel"
                              onClick={() => setEditingId(null)}
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="action-btn edit"
                              onClick={() => startEdit(zemari)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <ConfirmDeleteButton 
                              id={zemari.id} 
                              onDelete={async (id) => { await deleteZemari(id); }} 
                              itemName="Zemari" 
                              className="action-btn delete" 
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .cat-name-cell {
          font-weight: 600;
          color: var(--admin-text);
          font-size: 14px;
        }
        .cat-translit {
          color: var(--admin-text-3);
          font-size: 13px;
        }
        .cat-count {
          font-weight: 600;
          color: var(--admin-accent);
        }

        .inline-input {
          padding: 6px 10px;
          background: var(--admin-bg);
          border: 1px solid var(--admin-accent);
          border-radius: 6px;
          color: var(--admin-text);
          font-size: 13px;
          outline: none;
          width: 100%;
        }
        .inline-save {
          padding: 6px 12px;
          background: var(--admin-accent);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .inline-save:disabled { opacity: 0.6; }
        .inline-cancel {
          padding: 6px 8px;
          background: transparent;
          color: var(--admin-text-3);
          border: none;
          cursor: pointer;
          font-size: 14px;
        }
        .inline-cancel:hover { color: var(--admin-red); }

        .action-buttons {
          display: flex;
          gap: 6px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--admin-border);
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.15s;
        }

        .action-btn:hover {
          background: var(--admin-surface-2);
          border-color: var(--admin-text-3);
        }

        .action-btn.delete {
          color: var(--admin-red);
          border-color: rgba(239, 68, 68, 0.2);
        }

        .action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--admin-red);
        }
      `}</style>
    </div>
  );
}
