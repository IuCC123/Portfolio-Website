import { LuArrowUpRight } from "react-icons/lu";
import { SiGithub } from "react-icons/si";

type ProjectLink = {
  label: "Website" | "Source";
  href: string;
};

type Project = {
  name: string;
  kind: string;
  summary: string;
  icon: string;
  image: { src: string; alt: string };
  links: readonly [ProjectLink, ...ProjectLink[]];
};

const projects = [
  {
    name: "SwiftServers",
    kind: "Minecraft hosting",
    summary:
      "Free Minecraft server hosting with a browser dashboard, one-click plugins, DDoS protection and a hub that helps players find your server.",
    icon: "/projects/icons/swiftservers.png",
    image: {
      src: "/projects/swiftservers.jpg",
      alt: "SwiftServers homepage: free Minecraft hosting, without the catch",
    },
    links: [{ label: "Website", href: "https://swiftservers.org" }],
  },
  {
    name: "Nuvora",
    kind: "Media server · Rust",
    summary:
      "A free, open-source media server for movies, shows and anime, with on-the-fly conversion, Watch Together and TV apps.",
    icon: "/projects/icons/nuvora.svg",
    image: {
      src: "/projects/nuvora.jpg",
      alt: "Nuvora homepage: Plex's polish, Jellyfin's freedom",
    },
    links: [
      { label: "Website", href: "https://getnuvora.online" },
      { label: "Source", href: "https://github.com/IuCC123/nuvora" },
    ],
  },
  {
    name: "BendMac",
    kind: "macOS app · Swift",
    summary:
      "A native macOS app that gently blurs your desktop as you close your MacBook's lid. Free and open source.",
    icon: "/projects/icons/bendmac.png",
    image: {
      src: "/projects/bendmac.jpg",
      alt: "BendMac homepage: a softer side of your Mac",
    },
    links: [
      { label: "Website", href: "https://bendmac.app" },
      { label: "Source", href: "https://github.com/IuCC123/BendMac" },
    ],
  },
  {
    name: "CLIProxyAPI-Rust",
    kind: "AI API proxy · Rust",
    summary:
      "Your Claude, ChatGPT and Gemini subscriptions as one fast API. A single Rust binary with compatible endpoints and a built-in dashboard.",
    icon: "/projects/icons/cliproxyapi.svg",
    image: {
      src: "/projects/cliproxyapi.jpg",
      alt: "CLIProxyAPI-Rust dashboard showing traffic and account limits",
    },
    links: [
      { label: "Source", href: "https://github.com/IuCC123/CLIProxyAPI-Rust" },
    ],
  },
] satisfies readonly Project[];

function ProjectCard({ project }: { project: Project }) {
  const [primary] = project.links;

  return (
    <article className="project-card">
      <div className="project-media">
        <img
          src={project.image.src}
          alt={project.image.alt}
          width={1600}
          height={1000}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="project-body">
        <div className="project-title">
          <img src={project.icon} alt="" width={20} height={20} />
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
              {link.label === "Source" ? <SiGithub aria-hidden="true" /> : null}
              {link.label}
              {link.label === "Website" ? (
                <LuArrowUpRight aria-hidden="true" />
              ) : null}
            </a>
          ))}
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
