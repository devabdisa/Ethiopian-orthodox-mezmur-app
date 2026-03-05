"use client";

import { useTransition } from "react";
import { updateUserRole } from "@/app/actions/admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  createdAt: Date;
  _count: {
    favorites: number;
    listenHistory: number;
  };
}

export function UserTable({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      await updateUserRole(
        userId,
        newRole as "USER" | "EDITOR" | "SUPER_ADMIN",
      );
    });
  }

  return (
    <div>
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>User</th>
                <th style={{ width: "25%" }}>Email</th>
                <th style={{ width: "15%" }}>Role</th>
                <th style={{ width: "10%" }}>Favorites</th>
                <th style={{ width: "10%" }}>Listens</th>
                <th style={{ width: "10%" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                return (
                  <tr key={user.id}>
                    {/* User Info */}
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="avatar-img"
                            />
                          ) : (
                            <span className="avatar-placeholder">
                              {user.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="user-name">
                            {user.name}
                            {isCurrentUser && (
                              <span className="you-badge">you</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="user-email">{user.email}</td>

                    {/* Role Dropdown */}
                    <td>
                      {isCurrentUser ? (
                        <span
                          className={`status-badge role-badge-${user.role.toLowerCase()}`}
                        >
                          {user.role.replace("_", " ")}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          className="role-select"
                          disabled={isPending}
                        >
                          <option value="USER">USER</option>
                          <option value="EDITOR">EDITOR</option>
                          <option value="SUPER_ADMIN">SUPER ADMIN</option>
                        </select>
                      )}
                    </td>

                    {/* Stats */}
                    <td>{user._count.favorites}</td>
                    <td>{user._count.listenHistory}</td>

                    {/* Joined */}
                    <td className="date-cell">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-placeholder {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--admin-accent-soft);
          color: var(--admin-accent);
          font-weight: 700;
          font-size: 14px;
          border-radius: 50%;
        }
        .user-name {
          font-weight: 600;
          color: var(--admin-text);
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .you-badge {
          font-size: 10px;
          font-weight: 600;
          color: var(--admin-green);
          background: rgba(34, 197, 94, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .user-email {
          color: var(--admin-text-3);
          font-size: 13px;
        }
        .date-cell {
          font-size: 13px;
          color: var(--admin-text-3);
        }
        
        .role-select {
          padding: 6px 10px;
          background: var(--admin-surface-2);
          border: 1px solid var(--admin-border);
          border-radius: 6px;
          color: var(--admin-text);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }
        .role-select:focus {
          border-color: var(--admin-accent);
        }
        .role-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .role-select option {
          background: var(--admin-surface);
        }

        .role-badge-super_admin {
          background: rgba(239, 68, 68, 0.12) !important;
          color: #f87171 !important;
        }
        .role-badge-editor {
          background: rgba(99, 102, 241, 0.12) !important;
          color: #818cf8 !important;
        }
        .role-badge-user {
          background: rgba(156, 163, 175, 0.12) !important;
          color: #9ca3af !important;
        }
      `}</style>
    </div>
  );
}
