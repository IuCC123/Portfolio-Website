import stars from "virtual:github-stars";
import { ArrowUpRightIcon, GitHubIcon, StarIcon } from "./icons";
import { formatStars, repoFromUrl } from "@/lib/github-stars";

type ProjectLink = {
  label: "Website" | "Source";
  href: string;
};

type Project = {
  slug: string;
  name: string;
  kind: string;
  summary: string;
  icon: string;
  imageAlt: string;
  links: readonly [ProjectLink, ...ProjectLink[]];
};

const IMAGE_WIDTHS = [480, 640, 720, 960, 1280] as const;
const IMAGE_SIZES =
  "(max-width: 48rem) calc(100vw - 2rem), (max-width: 63rem) calc(50vw - 2rem), 472px";

const assets = import.meta.glob<string>("./assets/projects/**/*", {
  eager: true,
  query: "?url",
  import: "default",
});

function asset(file: string): string {
  const url = assets[`./assets/projects/${file}`];
  if (!url) throw new Error(`Missing project asset: ${file}`);
  return url;
}

const projects = [
  {
    slug: "swiftservers",
    name: "SwiftServers",
    kind: "Minecraft hosting",
    summary:
      "Free Minecraft server hosting with a browser dashboard, one-click plugins, DDoS protection and a hub that helps players find your server.",
    icon: "icons/swiftservers.webp",
    imageAlt:
      "SwiftServers homepage: free Minecraft hosting, without the catch",
    links: [{ label: "Website", href: "https://swiftservers.org" }],
  },
  {
    slug: "nuvora",
    name: "Nuvora",
    kind: "Media server · Rust",
    summary:
      "A free, open-source media server for movies, shows and anime, with on-the-fly conversion, Watch Together and TV apps.",
    icon: "icons/nuvora.svg",
    imageAlt: "Nuvora homepage: Plex's polish, Jellyfin's freedom",
    links: [
      { label: "Website", href: "https://getnuvora.online" },
      { label: "Source", href: "https://github.com/IuCC123/nuvora" },
    ],
  },
  {
    slug: "bendmac",
    name: "BendMac",
    kind: "macOS app · Swift",
    summary:
      "A native macOS app that gently blurs your desktop as you close your MacBook's lid. Free and open source.",
    icon: "icons/bendmac.webp",
    imageAlt: "BendMac homepage: a softer side of your Mac",
    links: [
      { label: "Website", href: "https://bendmac.app" },
      { label: "Source", href: "https://github.com/IuCC123/BendMac" },
    ],
  },
  {
    slug: "cliproxyapi",
    name: "CLIProxyAPI-Rust",
    kind: "AI API proxy · Rust",
    summary:
      "Your Claude, ChatGPT and Gemini subscriptions as one fast API. A single Rust binary with compatible endpoints and a built-in dashboard.",
    icon: "icons/cliproxyapi.svg",
    imageAlt: "CLIProxyAPI-Rust dashboard showing traffic and account limits",
    links: [
      { label: "Source", href: "https://github.com/IuCC123/CLIProxyAPI-Rust" },
    ],
  },
] satisfies readonly Project[];

function ProjectCard({ project }: { project: Project }) {
  const [primary] = project.links;
  const source = project.links.find((link) => link.label === "Source");
  const repo = source ? repoFromUrl(source.href) : null;
  const starCount = repo ? stars[repo] : undefined;

  return (
    <article className="project-card">
      <div className="project-media">
        <img
          src={asset(`${project.slug}-960.webp`)}
          srcSet={IMAGE_WIDTHS.map(
            (width) => `${asset(`${project.slug}-${width}.webp`)} ${width}w`,
          ).join(", ")}
          sizes={IMAGE_SIZES}
          alt={project.imageAlt}
          width={1280}
          height={800}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="project-body">
        <div className="project-title">
          <img src={asset(project.icon)} alt="" width={20} height={20} />
          <h3>
            <a
              className="project-primary-link"
              href={primary.href}
              target="_blank"
              rel="noreferrer"
            >
              {project.name}
            </a>
          </h3>
          <span className="project-kind">{project.kind}</span>
        </div>

        <p>{project.summary}</p>

        <div className="project-links">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="project-link"
              tabIndex={link === primary ? -1 : undefined}
              aria-label={`${project.name} ${link.label.toLowerCase()}`}
            >
              {link.label === "Source" ? (
                <GitHubIcon aria-hidden="true" />
              ) : null}
              {link.label}
              {link.label === "Website" ? (
                <ArrowUpRightIcon aria-hidden="true" />
              ) : null}
            </a>
          ))}
          {source && starCount !== undefined ? (
            <a
              href={`${source.href}/stargazers`}
              target="_blank"
              rel="noreferrer"
              className="project-stars"
              aria-label={`${formatStars(starCount)} ${starCount === 1 ? "star" : "stars"} on GitHub`}
            >
              <StarIcon aria-hidden="true" />
              {formatStars(starCount)}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function Projects() {
  return (
    <div className="project-grid">
      {projects.map((project) => (
        <ProjectCard key={project.name} project={project} />
      ))}
    </div>
  );
}
