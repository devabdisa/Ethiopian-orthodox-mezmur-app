"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitLyrics } from "@/app/actions/lyrics";

interface ContributeFormProps {
  mezmurId: string;
  mezmurTitle: string;
}

export function ContributeForm({ mezmurId, mezmurTitle }: ContributeFormProps) {
  const [rawText, setRawText] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error" | "auth_required"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const charCount = rawText.length;
  const isValid = rawText.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setStatus("submitting");
    setErrorMsg("");

    const result = await submitLyrics(mezmurId, rawText);

    if (result.error) {
      if (result.error === "NOT_AUTHENTICATED") {
        setStatus("auth_required");
        return;
      }
      setStatus("error");
      switch (result.error) {
        case "LYRICS_TOO_SHORT":
          setErrorMsg("The lyrics are too short. Please paste the full text.");
          break;
        case "LYRICS_TOO_LONG":
          setErrorMsg(
            "The text is too long (max 10,000 characters). Please trim it."
          );
          break;
        case "TOO_MANY_PENDING":
          setErrorMsg(
            "You already have 3 pending submissions. Please wait for admin review."
          );
          break;
        default:
          setErrorMsg("Something went wrong. Please try again.");
      }
    } else {
      setStatus("success");
    }
  }

  if (status === "auth_required") {
    return (
      <div className="auth-card">
        <div className="auth-icon">🔐</div>
        <h2 className="auth-title">Sign in to contribute</h2>
        <p className="auth-text">
          You need an account to submit lyrics. It only takes a few seconds!
        </p>
        <div className="auth-actions">
          <a href={`/auth?redirect=/mezmurs/${mezmurId}/contribute`} className="auth-btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Sign In
          </a>
          <a href={`/auth?redirect=/mezmurs/${mezmurId}/contribute`} className="auth-btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Create Account
          </a>
        </div>
        <button className="auth-back" onClick={() => setStatus("idle")}>
          ← Go back to form
        </button>

        <style>{authStyles}</style>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="success-card">
        <div className="success-icon">🎉</div>
        <h2 className="success-title">Thank you for your contribution!</h2>
        <p className="success-text">
          Your lyrics submission for{" "}
          <strong className="font-ethiopic text-accent">{mezmurTitle}</strong>{" "}
          has been received.
        </p>
        <p className="success-text" style={{ marginBottom: 24 }}>
          An admin will review it shortly. Once approved, it will appear on the
          Mezmur page for everyone to enjoy. 🙏
        </p>
        <button
          className="back-btn"
          onClick={() => router.push(`/mezmurs/${mezmurId}`)}
        >
          ← Back to Mezmur
        </button>

        <style>{successStyles}</style>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="contribute-form">
      <label htmlFor="lyrics-input" className="form-label">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
        Paste the lyrics here
      </label>

      <textarea
        id="lyrics-input"
        className="lyrics-textarea font-ethiopic"
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder={`ከቴሌግራም ወይም ከሌላ ቦታ የግጥሙን ቃላት እዚህ ይለጥፉ...

ለምሳሌ:

ሃሌ ሉያ ሃሌ ሉያ
ስብሐት ለእግዚአብሔር
ሃሌ ሉያ ሃሌ ሉያ
...`}
        rows={14}
        maxLength={10000}
        disabled={status === "submitting"}
      />

      <div className="form-footer">
        <span
          className={`char-count ${charCount > 9000 ? "char-warning" : ""}`}
        >
          {charCount.toLocaleString()} / 10,000
        </span>

        {errorMsg && <p className="error-msg">⚠️ {errorMsg}</p>}

        <button
          type="submit"
          className="submit-btn"
          disabled={!isValid || status === "submitting"}
        >
          {status === "submitting" ? (
            <>
              <span className="spinner" />
              Formatting & Submitting...
            </>
          ) : (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Submit for Review
            </>
          )}
        </button>
      </div>

      <style>{formStyles}</style>
    </form>
  );
}

const formStyles = `
  .contribute-form {
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-sm);
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: hsl(var(--color-text));
    margin-bottom: 12px;
  }

  .lyrics-textarea {
    width: 100%;
    min-height: 280px;
    padding: 20px;
    border: 2px solid hsl(var(--color-border));
    border-radius: var(--radius);
    background: hsl(var(--color-bg));
    color: hsl(var(--color-text));
    font-size: 16px;
    line-height: 2;
    resize: vertical;
    transition: border-color var(--transition);
    box-sizing: border-box;
  }

  .lyrics-textarea:focus {
    outline: none;
    border-color: hsl(var(--color-accent));
    box-shadow: 0 0 0 3px hsl(var(--color-accent) / 0.15);
  }

  .lyrics-textarea::placeholder {
    color: hsl(var(--color-text-3));
    font-size: 14px;
    line-height: 1.8;
  }

  .lyrics-textarea:disabled {
    opacity: 0.6;
  }

  .form-footer {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .char-count {
    font-size: 12px;
    color: hsl(var(--color-text-3));
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .char-warning {
    color: hsl(0 70% 55%);
  }

  .error-msg {
    padding: 12px 16px;
    border-radius: var(--radius);
    background: hsl(0 70% 55% / 0.1);
    color: hsl(0 70% 55%);
    font-size: 14px;
    font-weight: 500;
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px 24px;
    border-radius: var(--radius);
    background: linear-gradient(135deg, hsl(var(--color-accent)), hsl(var(--color-accent) / 0.8));
    color: white;
    font-size: 16px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all var(--transition);
    box-shadow: 0 4px 14px hsl(var(--color-accent) / 0.3);
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px hsl(var(--color-accent) / 0.4);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid white;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const successStyles = `
  .success-card {
    text-align: center;
    padding: 48px 24px;
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .success-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .success-title {
    font-size: 24px;
    font-weight: 700;
    color: hsl(var(--color-text));
    margin-bottom: 12px;
  }

  .success-text {
    font-size: 15px;
    color: hsl(var(--color-text-2));
    line-height: 1.6;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: var(--radius);
    background: hsl(var(--color-accent) / 0.1);
    color: hsl(var(--color-accent));
    font-size: 15px;
    font-weight: 600;
    border: 1px solid hsl(var(--color-accent) / 0.2);
    cursor: pointer;
    transition: all var(--transition);
  }

  .back-btn:hover {
    background: hsl(var(--color-accent) / 0.2);
    transform: translateY(-1px);
  }
`;

const authStyles = `
  .auth-card {
    text-align: center;
    padding: 48px 24px;
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .auth-icon {
    font-size: 56px;
    margin-bottom: 16px;
  }

  .auth-title {
    font-size: 24px;
    font-weight: 700;
    color: hsl(var(--color-text));
    margin-bottom: 8px;
  }

  .auth-text {
    font-size: 15px;
    color: hsl(var(--color-text-2));
    margin-bottom: 28px;
    line-height: 1.5;
  }

  .auth-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .auth-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    border-radius: var(--radius);
    background: linear-gradient(135deg, hsl(var(--color-accent)), hsl(var(--color-accent) / 0.8));
    color: white;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    transition: all var(--transition);
    box-shadow: 0 4px 14px hsl(var(--color-accent) / 0.3);
  }

  .auth-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px hsl(var(--color-accent) / 0.4);
  }

  .auth-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    border-radius: var(--radius);
    background: hsl(var(--color-accent) / 0.1);
    color: hsl(var(--color-accent));
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    transition: all var(--transition);
    border: 1px solid hsl(var(--color-accent) / 0.2);
  }

  .auth-btn-secondary:hover {
    background: hsl(var(--color-accent) / 0.2);
    transform: translateY(-1px);
  }

  .auth-back {
    background: none;
    border: none;
    color: hsl(var(--color-text-3));
    font-size: 14px;
    cursor: pointer;
    transition: color var(--transition);
  }

  .auth-back:hover {
    color: hsl(var(--color-text));
  }
`;
