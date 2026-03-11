import prisma from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";

/**
 * Phase 1: The Data Shell (Prisma & Auth)
 * This component fetches live platform metrics and user session info
 * to determine the active state of the Hero Section.
 */
export default async function HeroSection() {
  // 1. Fetch Platform Metrics
  const [mezmurCount, zemariCount] = await Promise.all([
    prisma.mezmur.count(),
    prisma.zemari.count(),
  ]);

  // 2. Auth Session Check
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isLoggedIn = !!session?.user;

  return (
    <section className="hero-container">
      {/* Decorative Glows */}
      <div className="hero-glow hero-glow--1" />
      <div className="hero-glow hero-glow--2" />
      
      {/* Sacred Watermark */}
      <div className="hero-watermark font-ethiopic">✞</div>

      <div className="hero-content">
        {/* Typography: Sacred Identity */}
        <div className="hero-typography animate-in" style={{ '--index': 1 } as any}>
          <h1 className="hero-title font-ethiopic">የዝማሬ ማዕድ</h1>
          <p className="hero-subtitle">
            <span className="subtitle-am font-ethiopic">
              የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን መዝሙራት ስብስብ
            </span>
            <span className="subtitle-en">
              A sacred collection of Ethiopian Orthodox Tewahedo Hymns.
            </span>
          </p>
        </div>

        {/* Platform Metrics (Phase 4 Polish) */}
        <div className="hero-stats glass-card animate-in" style={{ '--index': 2 } as any}>
          <div className="stat-item">
            <span className="stat-value">{mezmurCount.toLocaleString()}+</span>
            <span className="stat-label">Mezmurs</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{zemariCount.toLocaleString()}</span>
            <span className="stat-label">Zemarians</span>
          </div>
        </div>

        {/* Dynamic Call to Actions */}
        <div className="hero-actions animate-in" style={{ '--index': 3 } as any}>
          <Link href="/categories" className="btn btn-primary">
            Browse by Category
          </Link>
          <Link href="/zemarian" className="btn btn-secondary">
            By Zemarians
          </Link>
        </div>

        {/* Sign In CTA for guests */}
        {!isLoggedIn && (
          <div className="hero-auth-cta animate-in" style={{ '--index': 4 } as any}>
            <Link href="/auth" className="hero-signin-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              <span><strong>Sign in</strong> to save favorites, create playlists & contribute lyrics</span>
            </Link>
          </div>
        )}
      </div>

      <style>{styles}</style>
    </section>
  );
}

const styles = `
  .hero-container {
    position: relative;
    padding: 110px 24px;
    margin-bottom: 48px;
    border-bottom: 1px solid hsl(var(--color-border));
    background-color: hsl(var(--color-bg));
    text-align: center;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Decorative Glows */
  .hero-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.15;
    z-index: 0;
    pointer-events: none;
  }

  .hero-glow--1 {
    top: -100px;
    right: -50px;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, hsl(var(--color-accent)), transparent);
  }

  .hero-glow--2 {
    bottom: -50px;
    left: -100px;
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, hsl(var(--color-accent)), transparent);
  }

  /* Sacred Watermark */
  .hero-watermark {
    position: absolute;
    font-size: 580px; /* Increased massively for impact */
    color: hsl(var(--color-accent));
    opacity: 0.08; /* Increased from 0.03 for boldness */
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;
    pointer-events: none;
    user-select: none;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 800px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
  }

  /* Entry Animations (Phase 4) */
  .animate-in {
    opacity: 0;
    transform: translateY(20px);
    animation: heroFadeIn 800ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
    animation-delay: calc(var(--index) * 150ms);
  }

  @keyframes heroFadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .hero-typography {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .hero-title {
    font-size: clamp(38px, 9vw, 72px);
    font-weight: 800;
    color: hsl(var(--color-accent));
    line-height: 1.1;
    letter-spacing: -0.02em;
    text-shadow: 0 4px 12px hsl(var(--color-accent) / 0.15);
  }

  .hero-subtitle {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .subtitle-am {
    font-size: clamp(16px, 3.5vw, 24px);
    color: hsl(var(--color-text-2));
    font-weight: 500;
    opacity: 0.9;
  }

  .subtitle-en {
    font-size: clamp(14px, 2.5vw, 17px);
    color: hsl(var(--color-text-3));
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* Premium Glassmorphism */
  .glass-card {
    display: flex;
    align-items: center;
    gap: 40px;
    padding: 24px 56px;
    background: hsl(var(--color-surface) / 0.5);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid hsl(var(--color-accent) / 0.15);
    border-radius: 28px;
    box-shadow: 
      0 12px 40px -12px hsl(var(--color-accent) / 0.15),
      inset 0 0 0 1px hsl(255 100% 100% / 0.05);
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: 32px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: hsl(var(--color-accent));
    font-variant-numeric: tabular-nums;
  }

  .stat-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: hsl(var(--color-text-3));
  }

  .stat-divider {
    width: 1px;
    height: 54px;
    background: hsl(var(--color-accent) / 0.1);
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
  }

  .btn {
    padding: 16px 40px;
    border-radius: 99px;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    transition: all 500ms cubic-bezier(0.23, 1, 0.32, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-primary {
    background: hsl(var(--color-accent));
    color: #fff;
    box-shadow: 0 10px 25px -5px hsl(var(--color-accent) / 0.4);
  }

  .btn-primary:hover {
    transform: translateY(-4px) scale(1.03);
    box-shadow: 0 20px 35px -10px hsl(var(--color-accent) / 0.5);
    filter: brightness(1.1);
  }

  .btn-secondary {
    background: hsl(var(--color-bg) / 0.2);
    color: hsl(var(--color-text));
    border: 1px solid hsl(var(--color-border));
    backdrop-filter: blur(8px);
  }

  .btn-secondary:hover {
    background: hsl(var(--color-overlay));
    border-color: hsl(var(--color-accent) / 0.4);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .hero-container {
      padding: 80px 20px;
    }
    
    .hero-watermark {
      font-size: 420px; /* Masive increase for mobile too */
    }
    
    .glass-card {
      padding: 16px 32px;
      gap: 24px;
      width: 100%;
      justify-content: center;
    }
    
    .btn {
      width: 100%;
    }
  }

  /* Guest Sign-In CTA */
  .hero-auth-cta {
    margin-top: -12px;
  }

  .hero-signin-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border-radius: 999px;
    background: hsl(var(--color-surface) / 0.4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid hsl(var(--color-border) / 0.5);
    color: hsl(var(--color-text-2));
    font-size: 13px;
    text-decoration: none;
    transition: all 400ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  .hero-signin-link strong {
    color: hsl(var(--color-accent));
    font-weight: 600;
  }

  .hero-signin-link:hover {
    background: hsl(var(--color-accent) / 0.1);
    border-color: hsl(var(--color-accent) / 0.3);
    color: hsl(var(--color-text));
    transform: translateY(-2px);
    box-shadow: 0 4px 16px hsl(var(--color-accent) / 0.1);
  }

  .hero-signin-link svg {
    color: hsl(var(--color-accent));
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .hero-signin-link {
      font-size: 12px;
      padding: 8px 18px;
    }
  }
`;
