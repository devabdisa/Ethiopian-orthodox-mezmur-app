"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("p", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <nav className="pagination">
      {currentPage > 1 ? (
        <Link href={createPageURL(currentPage - 1)} className="page-btn prev">
          ← Prev
        </Link>
      ) : (
        <span className="page-btn prev disabled">← Prev</span>
      )}

      <span className="page-info">
        Page <span className="font-semibold text-accent">{currentPage}</span> of{" "}
        {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link href={createPageURL(currentPage + 1)} className="page-btn next">
          Next →
        </Link>
      ) : (
        <span className="page-btn next disabled">Next →</span>
      )}

      <style>{styles}</style>
    </nav>
  );
}

const styles = `
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px dashed hsl(var(--color-border));
  }

  .page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border-radius: var(--radius);
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    font-size: 14px;
    font-weight: 500;
    color: hsl(var(--color-text));
    text-decoration: none;
    transition: all var(--transition);
  }

  .page-btn:not(.disabled):hover {
    border-color: hsl(var(--color-accent) / .4);
    background: hsl(var(--color-accent) / .05);
    color: hsl(var(--color-accent));
    transform: translateY(-1px);
  }

  .page-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: transparent;
  }

  .page-info {
    font-size: 14px;
    color: hsl(var(--color-text-2));
  }
  
  .text-accent {
    color: hsl(var(--color-accent));
  }
`;
