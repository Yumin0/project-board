export const DASHBOARD_CATEGORIES = ["main", "side", "life", "learn"] as const

export type DashboardCategory = (typeof DASHBOARD_CATEGORIES)[number]

export const DASHBOARD_CATEGORY_LABELS: Record<DashboardCategory, string> = {
  main: "主業",
  side: "副業",
  life: "生活",
  learn: "學習",
}

export function isDashboardCategory(value: string): value is DashboardCategory {
  return (DASHBOARD_CATEGORIES as readonly string[]).includes(value)
}

export type DashboardCategoryStyle = {
  a: string
  b: string
  dot: string
  ink: string
  tint: string
}

export const DASHBOARD_CATEGORY_STYLES: Record<DashboardCategory, DashboardCategoryStyle> = {
  main: { a: "#8aa6e8", b: "#b6c6ef", dot: "#7e9ce0", ink: "#465f9e", tint: "rgba(126,156,224,.18)" },
  side: { a: "#82c9a6", b: "#bce0cd", dot: "#6cc09a", ink: "#3c7d5e", tint: "rgba(108,192,154,.18)" },
  life: { a: "#f0a896", b: "#f6cabb", dot: "#ec9b86", ink: "#b05c47", tint: "rgba(236,155,134,.18)" },
  learn: { a: "#eecb7e", b: "#f4dfb0", dot: "#e6bd6b", ink: "#946f2c", tint: "rgba(230,189,107,.20)" },
}

// Reuses a dashboard quadrant's color when a Category shares its name (e.g. "副業").
export function getCategoryStyleByName(
  categoryName: string | null | undefined
): DashboardCategoryStyle | null {
  if (!categoryName) return null
  const match = (Object.entries(DASHBOARD_CATEGORY_LABELS) as [DashboardCategory, string][]).find(
    ([, label]) => label === categoryName
  )
  return match ? DASHBOARD_CATEGORY_STYLES[match[0]] : null
}
