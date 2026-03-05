"use client";

import { Fragment, useState, useTransition } from "react";
import { updateCategory, deleteCategory } from "@/app/actions/admin";

interface SubCategory {
  id: string;
  name: string;
  _count: { mezmurs: number };
}

interface Category {
  id: string;
  name: string;
  nameTransliterated: string | null;
  totalMezmurs: number;
  subCategories: SubCategory[];
}

export function CategoryTable({ categories }: { categories: Category[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTranslit, setEditTranslit] = useState("");
  const [isPending, startTransition] = useTransition();

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditTranslit(cat.nameTransliterated || "");
  }

  function handleSave(catId: string) {
    startTransition(async () => {
      await updateCategory(catId, {
        name: editName.trim(),
        nameTransliterated: editTranslit.trim() || undefined,
      });
      setEditingId(null);
    });
  }

  function handleDelete(catId: string, catName: string) {
    if (
      !confirm(
        `Delete "${catName}" and ALL its subcategories and mezmurs? This cannot be undone.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteCategory(catId);
    });
  }

  return (
    <div>
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "5%" }}></th>
                <th style={{ width: "35%" }}>Category Name</th>
                <th style={{ width: "20%" }}>Transliteration</th>
                <th style={{ width: "15%" }}>SubCategories</th>
                <th style={{ width: "10%" }}>Mezmurs</th>
                <th style={{ width: "15%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <Fragment key={cat.id}>
                  {/* Category Row */}
                  <tr key={cat.id}>
                    {/* Expand toggle */}
                    <td>
                      <button
                        className="expand-btn"
                        onClick={() =>
                          setExpandedId(expandedId === cat.id ? null : cat.id)
                        }
                      >
                        {expandedId === cat.id ? "▾" : "▸"}
                      </button>
                    </td>

                    {/* Name */}
                    <td>
                      {editingId === cat.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="inline-input"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave(cat.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                      ) : (
                        <span className="cat-name-cell">{cat.name}</span>
                      )}
                    </td>

                    {/* Transliteration */}
                    <td>
                      {editingId === cat.id ? (
                        <input
                          value={editTranslit}
                          onChange={(e) => setEditTranslit(e.target.value)}
                          className="inline-input"
                          placeholder="English name..."
                        />
                      ) : (
                        <span className="cat-translit">
                          {cat.nameTransliterated || "—"}
                        </span>
                      )}
                    </td>

                    {/* SubCategory Count */}
                    <td>{cat.subCategories.length}</td>

                    {/* Mezmur Count */}
                    <td>
                      <span className="cat-count">{cat.totalMezmurs}</span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="action-buttons">
                        {editingId === cat.id ? (
                          <>
                            <button
                              className="inline-save"
                              onClick={() => handleSave(cat.id)}
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
                              onClick={() => startEdit(cat)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDelete(cat.id, cat.name)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded SubCategories */}
                  {expandedId === cat.id &&
                    cat.subCategories.map((sub) => (
                      <tr key={sub.id} className="sub-row">
                        <td></td>
                        <td colSpan={2}>
                          <span className="sub-name">└ {sub.name}</span>
                        </td>
                        <td colSpan={3}>
                          <span className="sub-count">
                            {sub._count.mezmurs} mezmurs
                          </span>
                        </td>
                      </tr>
                    ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .expand-btn {
          background: none;
          border: none;
          color: var(--admin-text-3);
          cursor: pointer;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.15s;
        }
        .expand-btn:hover {
          background: var(--admin-surface-2);
          color: var(--admin-text);
        }
        
        .cat-name-cell {
          font-weight: 600;
          color: var(--admin-text);
          font-size: 14px;
        }
        .cat-translit {
          color: var(--admin-text-3);
          font-style: italic;
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

        .action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        .sub-row td {
          background: var(--admin-surface-2) !important;
          border-bottom-color: var(--admin-bg) !important;
        }
        .sub-name {
          font-size: 13px;
          color: var(--admin-text-2);
          padding-left: 12px;
        }
        .sub-count {
          font-size: 12px;
          color: var(--admin-text-3);
        }
      `}</style>
    </div>
  );
}
