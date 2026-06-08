import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type PostCategory,
} from "@/lib/post-categories";

/**
 * カテゴリ絞り込みタブ。クエリパラメータ ?category=... で切り替える。
 */
export function CategoryFilter({ active }: { active?: PostCategory }) {
  const items: { key?: PostCategory; label: string; href: string }[] = [
    { label: "すべて", href: "/posts" },
    ...CATEGORY_ORDER.map((category) => ({
      key: category,
      label: CATEGORY_LABELS[category],
      href: `/posts?category=${category}`,
    })),
  ];

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = item.key ? item.key === active : !active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              isActive
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
