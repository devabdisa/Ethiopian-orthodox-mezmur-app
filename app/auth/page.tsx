"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import Link from "next/link";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Sign In
        const { error: signInError } = await signIn.email({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message || "Invalid email or password");
          setIsLoading(false);
          return;
        }
      } else {
        // Sign Up
        if (!name.trim()) {
          setError("Name is required");
          setIsLoading(false);
          return;
        }
        const { error: signUpError } = await signUp.email({
          email,
          password,
          name,
        });
        if (signUpError) {
          setError(signUpError.message || "An error occurred during sign up");
          setIsLoading(false);
          return;
        }
      }

      // Success! redirect back to where they came from
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn.social({
      provider: "google",
      callbackURL: redirectTo,
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in-up">
        {/* Header */}
        <div className="auth-header">
          <Link href="/" className="auth-logo font-ethiopic">
            <span className="text-accent">መዝሙር</span>
          </Link>
          <h1 className="auth-title">
            {isLogin ? "Welcome Back" : "Create an Account"}
          </h1>
          <p className="auth-subtitle">
            {isLogin
              ? "Sign in to access your favorites and listening history."
              : "Join to save your favorite mezmurs and access premium features."}
          </p>
        </div>

        {/* Error Message */}
        {error && <div className="auth-error">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Abebe Kebede"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <div className="password-header">
              <label htmlFor="password">Password</label>
              {isLogin && (
                <a href="#" className="forgot-password">
                  Forgot password?
                </a>
              )}
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="auth-submit accent-gradient"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner-sm" />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        {/* Social */}
        <button
          onClick={handleGoogleSignIn}
          className="auth-social-btn"
          disabled={isLoading}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            className="google-icon"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        {/* Footer */}
        <p className="auth-footer">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="auth-switch-btn text-accent"
            onClick={() => setIsLogin(!isLogin)}
            disabled={isLoading}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>

        <style>{styles}</style>
      </div>
    </div>
  );
}

const styles = `
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--bg-main);
  }

  .auth-container {
    width: 100%;
    max-width: 440px;
    background: hsl(var(--color-surface) / 0.8);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid hsl(var(--color-border) / 0.5);
    border-radius: 20px;
    padding: 32px;
    box-shadow: var(--shadow-xl);
  }

  .auth-header {
    text-align: center;
    margin-bottom: 20px;
  }

  .auth-logo {
    display: inline-block;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 10px;
    text-decoration: none;
  }

  .auth-title {
    font-size: 20px;
    font-weight: 700;
    color: hsl(var(--color-text));
    margin-bottom: 4px;
    letter-spacing: -0.02em;
  }

  .auth-subtitle {
    font-size: 13px;
    color: hsl(var(--color-text-2));
    line-height: 1.5;
  }

  .auth-error {
    background: hsl(0 84% 60% / 0.1);
    color: hsl(0 84% 60%);
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 14px;
    font-weight: 500;
    color: hsl(var(--color-text));
  }

  .password-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .forgot-password {
    font-size: 13px;
    color: hsl(var(--color-text-2));
    text-decoration: none;
    transition: color var(--transition);
  }

  .forgot-password:hover {
    color: hsl(var(--color-accent));
  }

  .form-group input {
    width: 100%;
    padding: 11px 14px;
    background: hsl(var(--color-surface-2));
    border: 1px solid hsl(var(--color-border));
    border-radius: 12px;
    color: hsl(var(--color-text));
    font-size: 15px;
    transition: all var(--transition);
    outline: none;
  }

  .form-group input:focus {
    border-color: hsl(var(--color-accent));
    box-shadow: 0 0 0 3px hsl(var(--color-accent) / 0.1);
  }

  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-submit {
    margin-top: 4px;
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: none;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
    box-shadow: var(--shadow-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 52px;
  }

  .auth-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px hsl(var(--color-accent) / 0.3);
  }

  .auth-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .auth-divider {
    position: relative;
    text-align: center;
    margin: 20px 0;
  }

  .auth-divider::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: hsl(var(--color-border));
    z-index: 1;
  }

  .auth-divider span {
    position: relative;
    z-index: 2;
    background: hsl(var(--color-surface));
    padding: 0 16px;
    color: hsl(var(--color-text-2));
    font-size: 13px;
    font-weight: 500;
  }

  .auth-social-btn {
    width: 100%;
    padding: 12px;
    background: hsl(var(--color-surface-2));
    border: 1px solid hsl(var(--color-border));
    border-radius: 12px;
    color: hsl(var(--color-text));
    font-size: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    transition: all var(--transition);
  }

  .auth-social-btn:hover:not(:disabled) {
    background: hsl(var(--color-surface-3));
    transform: translateY(-1px);
  }

  .auth-social-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
    color: hsl(var(--color-text-2));
  }

  .auth-switch-btn {
    background: none;
    border: none;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-size: 14px;
    transition: opacity var(--transition);
  }

  .auth-switch-btn:hover {
    text-decoration: underline;
    opacity: 0.8;
  }

  .loading-spinner-sm {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @media (max-width: 480px) {
    .auth-page {
      padding: 16px;
    }
    .auth-container {
      padding: 32px 24px;
    }
  }
`;
