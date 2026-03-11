"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveSubmission,
  rejectSubmission,
} from "@/app/actions/lyrics";

interface Submission {
  id: string;
  rawText: string;
  formattedLines: string[];
  createdAt: string;
  mezmur: { id: string; title: string; lyrics: string[] };
  user: { id: string; name: string; email: string };
}

export function LyricsReviewList({
  submissions,
}: {
  submissions: Submission[];
}) {
  return (
    <div className="review-list">
      {submissions.map((s) => (
        <ReviewCard key={s.id} submission={s} />
      ))}
      <style>{styles}</style>
    </div>
  );
}

function ReviewCard({ submission }: { submission: Submission }) {
  const [status, setStatus] = useState<
    "idle" | "approving" | "rejecting" | "done"
  >("idle");
  const [showRaw, setShowRaw] = useState(false);
  const router = useRouter();

  if (status === "done") return null;

  async function handleApprove() {
    setStatus("approving");
    await approveSubmission(submission.id);
    setStatus("done");
    router.refresh();
  }

  async function handleReject() {
    setStatus("rejecting");
    await rejectSubmission(submission.id);
    setStatus("done");
    router.refresh();
  }

  const hasExisting =
    submission.mezmur.lyrics && submission.mezmur.lyrics.length > 0 && submission.mezmur.lyrics.some(l => l.trim() !== "");

  return (
    <div className="review-card">
      {/* Header */}
      <div className="review-header">
        <div>
          <h3 className="review-mezmur font-ethiopic text-accent">
            {submission.mezmur.title}
          </h3>
          <p className="review-meta">
            Submitted by <strong>{submission.user.name}</strong> (
            {submission.user.email}) •{" "}
            {new Date(submission.createdAt).toLocaleDateString()}
          </p>
        </div>
        {hasExisting && (
          <span className="badge-existing">Has existing lyrics</span>
        )}
      </div>

      {/* Formatted preview */}
      <div className="review-preview">
        <div className="preview-label">
          📝 Formatted Preview ({submission.formattedLines.length} lines)
        </div>
        <div className="preview-content font-ethiopic">
          {submission.formattedLines.slice(0, 12).map((line, i) => (
            <p key={i} className={line.trim() === "" ? "verse-gap" : ""}>
              {line || "\u00A0"}
            </p>
          ))}
          {submission.formattedLines.length > 12 && (
            <p className="preview-more">
              ... and {submission.formattedLines.length - 12} more lines
            </p>
          )}
        </div>
      </div>

      {/* Toggle raw text */}
      <button
        className="toggle-raw"
        onClick={() => setShowRaw(!showRaw)}
      >
        {showRaw ? "Hide" : "Show"} raw pasted text
      </button>

      {showRaw && (
        <pre className="raw-text">{submission.rawText}</pre>
      )}

      {/* Actions */}
      <div className="review-actions">
        <button
          className="btn-approve"
          onClick={handleApprove}
          disabled={status !== "idle"}
        >
          {status === "approving" ? "Approving..." : "✅ Approve & Publish"}
        </button>
        <button
          className="btn-reject"
          onClick={handleReject}
          disabled={status !== "idle"}
        >
          {status === "rejecting" ? "Rejecting..." : "❌ Reject"}
        </button>
      </div>
    </div>
  );
}

const styles = `
  .review-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .review-card {
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-left: 4px solid hsl(40 90% 50%);
    border-radius: 12px;
    padding: 20px;
  }

  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .review-mezmur {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .review-meta {
    font-size: 12px;
    color: hsl(var(--color-text-3));
  }

  .badge-existing {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 999px;
    background: hsl(40 90% 50% / 0.15);
    color: hsl(40 70% 40%);
    font-weight: 600;
    white-space: nowrap;
  }

  .review-preview {
    margin-bottom: 12px;
  }

  .preview-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: hsl(var(--color-text-3));
    margin-bottom: 8px;
  }

  .preview-content {
    background: hsl(var(--color-bg));
    border: 1px solid hsl(var(--color-border));
    border-radius: 8px;
    padding: 16px;
    font-size: 15px;
    line-height: 1.8;
    max-height: 300px;
    overflow-y: auto;
  }

  .preview-content p {
    margin: 0;
  }

  .verse-gap {
    height: 12px;
  }

  .preview-more {
    color: hsl(var(--color-text-3));
    font-style: italic;
    font-size: 13px;
    margin-top: 8px;
  }

  .toggle-raw {
    background: none;
    border: none;
    color: hsl(var(--color-accent));
    font-size: 13px;
    cursor: pointer;
    padding: 4px 0;
    margin-bottom: 12px;
  }

  .toggle-raw:hover {
    text-decoration: underline;
  }

  .raw-text {
    background: hsl(var(--color-bg));
    border: 1px solid hsl(var(--color-border));
    border-radius: 8px;
    padding: 12px;
    font-size: 12px;
    line-height: 1.6;
    max-height: 200px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    margin-bottom: 12px;
    color: hsl(var(--color-text-2));
  }

  .review-actions {
    display: flex;
    gap: 8px;
  }

  .btn-approve {
    flex: 1;
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    background: hsl(140 60% 45%);
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-approve:hover:not(:disabled) {
    background: hsl(140 60% 40%);
  }

  .btn-reject {
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid hsl(0 70% 55% / 0.3);
    background: hsl(0 70% 55% / 0.1);
    color: hsl(0 70% 55%);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-reject:hover:not(:disabled) {
    background: hsl(0 70% 55% / 0.2);
  }

  .btn-approve:disabled, .btn-reject:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
