import type { Category } from "../backend";
import {
  CATEGORY_BADGE_CLASS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  getCategoryKind,
} from "../lib/categoryUtils";

interface CategoryBadgeProps {
  category: Category;
  subCategory?: string;
  size?: "sm" | "md";
}

export function CategoryBadge({
  category,
  subCategory,
  size = "md",
}: CategoryBadgeProps) {
  const kind = getCategoryKind(category);
  const badgeClass = CATEGORY_BADGE_CLASS[kind];
  const label = CATEGORY_LABELS[kind];
  const icon = CATEGORY_ICONS[kind];

  const sizeClasses =
    size === "sm" ? "text-xs px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`inline-flex items-center rounded-full font-semibold ${badgeClass} ${sizeClasses}`}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </span>
      {subCategory && (
        <span className="text-xs text-muted-foreground pl-1">
          {subCategory}
        </span>
      )}
    </div>
  );
}
