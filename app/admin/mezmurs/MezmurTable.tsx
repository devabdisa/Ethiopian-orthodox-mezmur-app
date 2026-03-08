"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateMezmur, deleteMezmur } from "@/app/actions/admin";
import { MoveMezmurModal, ConfirmDeleteButton } from "@/components/admin/GodModeControls";

interface Mezmur {
  id: string;
  title: string;
  youtubeUrl: string | null;
  lyrics: string[];
  subCategoryId: string;
  zemariId: string | null;
  subCategory: {
    id: string;
    name: string;
    category: { id: string; name: string };
  };
}

interface Category {
  id: string;
  name: string;
}

interface Zemari {
  id: string;
  name: string;
}

interface Props {
  mezmurs: Mezmur[];
  categories: Category[];
  zemarians: Zemari[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  query: string;
  filter: string;
  categoryFilter: string;
}

export function MezmurTable({
  mezmurs,
  categories,
  zemarians,
  currentPage,
  totalPages,
  totalCount,
  query,
  filter,
  categoryFilter,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [movingMezmur, setMovingMezmur] = useState<Mezmur | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [searchInput, setSearchInput] = useState(query);
  const [isPending, startTransition] = useTransition();

  // ── Navigate with query params ──────────────────────────────────────────────
  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    // Reset to page 1 when filters change
    if (!updates.page) params.delete("page");
    router.push(`/admin/mezmurs?${params.toString()}`);
  }

  // ── Save YouTube URL ────────────────────────────────────────────────────────
  function handleSaveUrl(mezmurId: string) {
    startTransition(async () => {
      await updateMezmur(mezmurId, { youtubeUrl: editUrl.trim() || null });
      setEditingId(null);
      setEditUrl("");
    });
  }

  // ── Search submit ────────────────────────────────────────────────────────────
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: searchInput.trim() });
  }

  return (
    <div>
      {/* ── Toolbar: Search + Filters ──────────────────────────────────────── */}
      <div className="mezmur-toolbar">
        <form onSubmit={handleSearch} className="toolbar-search">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="toolbar-input"
          />
          <button type="submit" className="admin-btn primary">
            Search
          </button>
        </form>

        <div className="toolbar-filters">
          {/* Filter: all / missing / linked */}
          <select
            value={filter}
            onChange={(e) => updateParams({ filter: e.target.value })}
            className="toolbar-select"
          >
            <option value="all">All Mezmurs</option>
            <option value="missing">⚠ Missing YouTube</option>
            <option value="linked">✓ Has YouTube</option>
          </select>

          {/* Filter: by category */}
          <select
            value={categoryFilter}
            onChange={(e) => updateParams({ category: e.target.value })}
            className="toolbar-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────────────── */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Title</th>
                <th style={{ width: "20%" }}>Category</th>
                <th style={{ width: "30%" }}>YouTube URL</th>
                <th style={{ width: "15%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mezmurs.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 40 }}>
                    No mezmurs found matching your filters.
                  </td>
                </tr>
              )}
              {mezmurs.map((m) => (
                <tr key={m.id}>
                  {/* Title */}
                  <td>
                    <span className="mezmur-title-cell">{m.title}</span>
                    <span className="mezmur-sub-cell">
                      {m.subCategory.name}
                    </span>
                  </td>

                  {/* Category */}
                  <td>{m.subCategory.category.name}</td>

                  {/* YouTube URL */}
                  <td>
                    {editingId === m.id ? (
                      <div className="inline-edit">
                        <input
                          type="text"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="Paste YouTube URL..."
                          className="inline-input"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveUrl(m.id);
                            if (e.key === "Escape") {
                              setEditingId(null);
                              setEditUrl("");
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSaveUrl(m.id)}
                          className="inline-save"
                          disabled={isPending}
                        >
                          {isPending ? "..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditUrl("");
                          }}
                          className="inline-cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="url-cell">
                        {m.youtubeUrl ? (
                          <span className="status-badge ok">● Linked</span>
                        ) : (
                          <span className="status-badge missing">
                            ● Missing
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn edit"
                        onClick={() => {
                          setEditingId(m.id);
                          setEditUrl(m.youtubeUrl || "");
                        }}
                        title="Edit YouTube URL"
                      >
                        🔗
                      </button>
                      
                      <button
                        className="action-btn edit"
                        onClick={() => setMovingMezmur(m)}
                        title="Move to Category/Zemari"
                      >
                        🚚
                      </button>

                      <a
                        href={`/mezmurs/${m.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn view"
                        title="View Public Page"
                      >
                        👁️
                      </a>
                      
                      <ConfirmDeleteButton 
                        id={m.id} 
                        onDelete={async (id) => { await deleteMezmur(id); }} 
                        itemName="Mezmur" 
                        className="action-btn delete" 
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="admin-btn ghost"
            disabled={currentPage <= 1}
            onClick={() => updateParams({ page: String(currentPage - 1) })}
          >
            ← Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="admin-btn ghost"
            disabled={currentPage >= totalPages}
            onClick={() => updateParams({ page: String(currentPage + 1) })}
          >
            Next →
          </button>
        </div>
      )}

      {/* God Mode Editor */}
      {movingMezmur && (
        <MoveMezmurModal 
          mezmur={movingMezmur} 
          zemarians={zemarians} 
          onClose={() => setMovingMezmur(null)} 
        />
      )}

      <style>{tableStyles}</style>
    </div>
  );
}

const tableStyles = `
  /* Toolbar */
  .mezmur-toolbar {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    align-items: center;
  }

  .toolbar-search {
    display: flex;
    gap: 8px;
    flex: 1;
    min-width: 240px;
  }

  .toolbar-input {
    flex: 1;
    padding: 10px 14px;
    background: var(--admin-surface);
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    color: var(--admin-text);
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
  }

  .toolbar-input:focus {
    border-color: var(--admin-accent);
  }

  .toolbar-input::placeholder {
    color: var(--admin-text-3);
  }

  .toolbar-filters {
    display: flex;
    gap: 8px;
  }

  .toolbar-select {
    padding: 10px 14px;
    background: var(--admin-surface);
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    color: var(--admin-text);
    font-size: 13px;
    outline: none;
    cursor: pointer;
  }

  .toolbar-select option {
    background: var(--admin-surface);
    color: var(--admin-text);
  }

  /* Table Cell Styles */
  .mezmur-title-cell {
    display: block;
    color: var(--admin-text);
    font-weight: 600;
    font-size: 14px;
    line-height: 1.4;
  }

  .mezmur-sub-cell {
    display: block;
    color: var(--admin-text-3);
    font-size: 12px;
    margin-top: 2px;
  }

  .url-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Inline Edit */
  .inline-edit {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .inline-input {
    flex: 1;
    padding: 6px 10px;
    background: var(--admin-bg);
    border: 1px solid var(--admin-accent);
    border-radius: 6px;
    color: var(--admin-text);
    font-size: 13px;
    outline: none;
    min-width: 140px;
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

  .inline-save:disabled {
    opacity: 0.6;
  }

  .inline-cancel {
    padding: 6px 8px;
    background: transparent;
    color: var(--admin-text-3);
    border: none;
    cursor: pointer;
    font-size: 14px;
  }

  .inline-cancel:hover {
    color: var(--admin-red);
  }

  /* Action Buttons */
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

  /* Pagination */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
    padding: 16px 0;
  }

  .page-info {
    font-size: 14px;
    color: var(--admin-text-2);
  }

  @media (max-width: 768px) {
    .mezmur-toolbar {
      flex-direction: column;
    }
    .toolbar-filters {
      width: 100%;
    }
    .toolbar-select {
      flex: 1;
    }
  }
`;
