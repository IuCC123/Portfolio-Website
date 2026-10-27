import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";
import type { RepoStars } from "../src/lib/github-stars";

const VIRTUAL_ID = "virtual:github-stars";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const MAX_AGE_MS = 10 * 60 * 1000;

type Snapshot = { fetchedAt: number; stars: RepoStars };

type RepoSummary = { full_name: string; stargazers_count: number };

function isRepoSummary(value: unknown): value is RepoSummary {
  if (typeof value !== "object" || value === null) return false;
  const repo = value as Record<string, unknown>;
  return (
    typeof repo.full_name === "string" &&
    typeof repo.stargazers_count === "number"
  );
}

async function fetchRepoStars(
  owner: string,
  init?: RequestInit,
): Promise<RepoStars> {
  const response = await fetch(
    `https://api.github.com/users/${owner}/repos?per_page=100`,
    init,
  );
  if (!response.ok) throw new Error(`GitHub API responded ${response.status}`);
  const repos: unknown = await response.json();
  if (!Array.isArray(repos)) throw new Error("GitHub API returned no repos");
  return Object.fromEntries(
    repos
      .filter(isRepoSummary)
      .map((repo) => [repo.full_name.toLowerCase(), repo.stargazers_count]),
  );
}

/**
 * Exposes `virtual:github-stars`, the owner's star counts at build time. They
 * are baked in rather than fetched by visitors, whose requests GitHub would
 * rate-limit into console errors. The client and prerender builds run in
 * separate processes, so the counts are cached on disk to give both the same
 * numbers and keep hydration in sync.
 */
export function githubStars(owner: string): Plugin {
  let cacheFile = "";
  let snapshot: Promise<Snapshot> | undefined;

  async function readCache(): Promise<Snapshot | null> {
    try {
      return JSON.parse(await readFile(cacheFile, "utf8")) as Snapshot;
    } catch {
      return null;
    }
  }

  async function loadSnapshot(): Promise<Snapshot> {
    const cached = await readCache();
    if (cached && Date.now() - cached.fetchedAt < MAX_AGE_MS) return cached;
    try {
      const token = process.env.GITHUB_TOKEN;
      const stars = await fetchRepoStars(owner, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(5000),
      });
      const fresh = { fetchedAt: Date.now(), stars };
      await mkdir(path.dirname(cacheFile), { recursive: true });
      await writeFile(cacheFile, JSON.stringify(fresh));
      return fresh;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(
        `[github-stars] ${reason}; ${cached ? "using cached counts" : "building without star counts"}`,
      );
      return cached ?? { fetchedAt: 0, stars: {} };
    }
  }

  return {
    name: "github-stars",
    configResolved(config) {
      cacheFile = path.join(
        config.root,
        "node_modules/.cache/github-stars.json",
      );
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    async load(id) {
      if (id !== RESOLVED_ID) return;
      snapshot ??= loadSnapshot();
      return `export default ${JSON.stringify((await snapshot).stars)};`;
    },
  };
}
