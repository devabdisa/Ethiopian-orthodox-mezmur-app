import Link from "next/link";
import { User2 } from "lucide-react";

interface ZemariCardProps {
  id: string;
  name: string;
  nameAmharic?: string | null;
  imageUrl?: string | null;
  mezmursCount?: number;
}

export function ZemariCard({
  id,
  name,
  nameAmharic,
  imageUrl,
  mezmursCount,
}: ZemariCardProps) {
  return (
    <Link
      href={`/zemari/${id}`}
      className="flex flex-col items-center group cursor-pointer animate-in"
    >
      <div className="relative w-32 h-32 md:w-36 md:h-36 mb-4 rounded-full overflow-hidden surface-2 transition-all duration-300 group-hover:shadow-[var(--shadow-accent)] group-hover:scale-105 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={nameAmharic || name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[hsl(var(--color-overlay)_/_0.5)]">
            <User2 className="w-12 h-12 text-muted transition-colors group-hover:text-accent" />
          </div>
        )}
      </div>

      <div className="text-center px-2">
        <h3 className="font-medium text-primary text-base md:text-lg font-ethiopic line-clamp-1 group-hover:text-accent transition-colors">
          {nameAmharic || name}
        </h3>
        {mezmursCount !== undefined && (
          <p className="text-sm text-muted mt-1">
            {mezmursCount} {mezmursCount === 1 ? "Mezmur" : "Mezmurs"}
          </p>
        )}
      </div>
    </Link>
  );
}
