/** Star counts keyed by lowercase "owner/name". */
export type RepoStars = Readonly<Record<string, number>>;

export const GITHUB_OWNER = "IuCC123";

/** "owner/name" for a github.com repository URL, lowercased. */
export function repoFromUrl(url: string): string | null {
  const { hostname, pathname } = new URL(url);
  const [owner, name] = pathname.split("/").filter(Boolean);
  return hostname === "github.com" && owner && name
    ? `${owner}/${name}`.toLowerCase()
    : null;
}

export function formatStars(count: number): string {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  return `${thousands < 10 ? thousands.toFixed(1).replace(/\.0$/, "") : Math.round(thousands)}k`;
}
