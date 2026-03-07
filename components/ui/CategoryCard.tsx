import Link from "next/link";
import { FolderHeart, Music, Sparkles } from "lucide-react";

interface CategoryCardProps {
  id: string;
  name: string;
  nameTransliterated?: string | null;
  subCategoryCount?: number;
}

const ICONS = [FolderHeart, Music, Sparkles];

export function CategoryCard({
  id,
  name,
  nameTransliterated,
  subCategoryCount,
}: CategoryCardProps) {
  // Pick a random icon for fallback (in a real app you'd map from DB iconName)
  const Icon = ICONS[name.length % ICONS.length];

  return (
    <Link
      href={`/category/${id}`}
      className="surface-2 p-6 flex items-start gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-[var(--shadow-accent)] group animate-in"
    >
      <div className="p-3 rounded-2xl bg-[hsl(var(--color-overlay))] text-primary group-hover:bg-[hsl(var(--color-accent))] group-hover:text-[hsl(var(--color-text-on-accent))] transition-colors">
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-lg font-ethiopic text-primary group-hover:text-accent transition-colors">
          {name}
        </h3>
        {nameTransliterated && (
          <p className="text-sm text-faint mb-1">{nameTransliterated}</p>
        )}
        {subCategoryCount !== undefined && (
          <p className="text-sm text-muted">
            {subCategoryCount} Subcategories
          </p>
        )}
      </div>
    </Link>
  );
}
