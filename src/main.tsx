import React from "react";
import ReactDOM from "react-dom/client";
import { ArrowUpRight, ExternalLink, Mail, Send } from "lucide";
import { MorphIcon, type IconNode } from "morphicons/react";
import { motion, useReducedMotion } from "motion/react";
import type { IconType } from "react-icons";
import { SiDiscord, SiGithub, SiOsu } from "react-icons/si";
import { BlurUpImage } from "@/components/interior/blur-up-image";
import { usePressDepth } from "@/components/interior/press-depth";
import { TextReveal } from "@/components/interior/text-reveal";
import { Tooltip, TooltipGroup } from "@/components/interior/tooltip-group";
import { GithubGraph } from "@/components/unlumen-ui/github-graph";
import TechSections from "./TechSections";
import "./styles.css";

type SocialLink = {
  href: string;
  label: string;
  color: string;
} & (
  | { kind: "brand"; icon: IconType }
  | { kind: "morph"; icon: IconNode; hoverIcon: IconNode }
);

const project = {
  href: "https://swiftservers.org",
  label: "SwiftServers",
  description:
    "Free Minecraft hosting with a browser dashboard for launching and managing Paper, Spigot, and Fabric servers.",
  previewImage: "/swift-new.jpeg",
} as const;

const socialLinks = [
  {
    href: "https://github.com/IuCC123",
    label: "GitHub",
    kind: "brand",
    icon: SiGithub,
    color: "#f5f5f5",
  },
  {
    href: "mailto:iucc@duck.com",
    label: "Email",
    kind: "morph",
    icon: Mail,
    hoverIcon: Send,
    color: "#ea4335",
  },
  {
    href: "https://discord.com/users/841362272139214848",
    label: "Discord",
    kind: "brand",
    icon: SiDiscord,
    color: "#5865f2",
  },
  {
    href: "https://osu.ppy.sh/users/14438713/osu",
    label: "osu!",
    kind: "brand",
    icon: SiOsu,
    color: "#ff66aa",
  },
] satisfies readonly SocialLink[];

type PressableLinkProps = {
  href: string;
  children: React.ReactNode;
  icon?: IconNode;
  hoverIcon?: IconNode;
  brandIcon?: IconType;
  className?: string;
  target?: "_blank";
  rel?: string;
};

function PressableLink({
  href,
  children,
  icon,
  hoverIcon,
  brandIcon: BrandIcon,
  className = "",
  target,
  rel,
}: PressableLinkProps) {
  const reduced = useReducedMotion();
  const { pressed, origin, ref, bind } = usePressDepth();
  const [active, setActive] = React.useState(false);
  const lean = pressed && origin && !reduced ? origin : null;
  const { onBlur: releasePress, ...pressBind } = bind;

  return (
    <motion.a
      ref={ref}
      href={href}
      target={target}
      rel={rel}
      className={className}
      initial={false}
      animate={{
        y: pressed ? 3 : 0,
        rotateX: lean ? -lean.y * 4 : 0,
        rotateY: lean ? lean.x * 4 : 0,
      }}
      transition={
        reduced
          ? { duration: 0 }
          : { type: "spring", stiffness: 520, damping: 34, mass: 0.45 }
      }
      style={{ transformPerspective: 420 }}
      {...pressBind}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => {
        setActive(false);
        releasePress();
      }}
    >
      {children}
      {BrandIcon ? <BrandIcon aria-hidden="true" /> : null}
      {!BrandIcon && icon && hoverIcon ? (
        <MorphIcon
          icon={active ? hoverIcon : icon}
          size={16}
          strokeWidth={2}
          spring="snappy"
          reducedMotion="user"
        />
      ) : null}
    </motion.a>
  );
}

function HomePage() {
  const [activeSocial, setActiveSocial] = React.useState<string | null>(null);
  const [projectActive, setProjectActive] = React.useState(false);

  return (
    <main id="top" className="page-shell">
      <header className="site-header" aria-label="Primary navigation">
        <a className="wordmark" href="#top" aria-label="IuCC, back to top">
          IuCC
        </a>

        <nav className="section-nav" aria-label="Page sections">
          <a href="#project">Project</a>
          <a href="#activity">Activity</a>
          <a href="#stack">Stack</a>
        </nav>

        <TooltipGroup className="social-tools">
          {socialLinks.map((link) => (
            <Tooltip key={link.label} label={link.label} side="bottom">
              <a
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
                aria-label={link.label}
                className="icon-link"
                style={{ "--hover-color": link.color } as React.CSSProperties}
                onPointerEnter={() => setActiveSocial(link.label)}
                onPointerLeave={() => setActiveSocial(null)}
                onFocus={() => setActiveSocial(link.label)}
                onBlur={() => setActiveSocial(null)}
              >
                {link.kind === "brand" ? (
                  <link.icon aria-hidden="true" />
                ) : (
                  <MorphIcon
                    icon={
                      activeSocial === link.label ? link.hoverIcon : link.icon
                    }
                    size={17}
                    strokeWidth={1.8}
                    spring="snappy"
                    reducedMotion="user"
                  />
                )}
              </a>
            </Tooltip>
          ))}
        </TooltipGroup>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">
            <TextReveal
              text="Hey, I'm IuCC. I build web tools and game infrastructure."
              by="word"
              stagger={0.045}
              maxDuration={1.4}
              startOnView={false}
            />
          </h1>
          <p className="hero-summary">
            I'm building SwiftServers, free Minecraft hosting with a browser
            dashboard for launching and managing Paper, Spigot, and Fabric
            servers.
          </p>
          <div className="hero-actions">
            <PressableLink
              href={project.href}
              target="_blank"
              rel="noreferrer"
              className="primary-action"
              icon={ArrowUpRight}
              hoverIcon={ExternalLink}
            >
              Explore SwiftServers
            </PressableLink>
            <PressableLink
              href="https://github.com/IuCC123"
              target="_blank"
              rel="noreferrer"
              className="secondary-action"
              brandIcon={SiGithub}
            >
              GitHub
            </PressableLink>
          </div>
        </div>
      </section>

      <section
        id="project"
        className="content-section project-section"
        aria-label="SwiftServers project"
      >
        <a
          className="project-stage"
          href={project.href}
          target="_blank"
          rel="noreferrer"
          aria-label="Open SwiftServers"
          onPointerEnter={() => setProjectActive(true)}
          onPointerLeave={() => setProjectActive(false)}
          onFocus={() => setProjectActive(true)}
          onBlur={() => setProjectActive(false)}
        >
          <BlurUpImage
            src={project.previewImage}
            alt="SwiftServers homepage showing free Minecraft hosting"
            width={1800}
            height={978}
            color="#101918"
            radius={14}
            loading="eager"
            fetchPriority="high"
            className="project-image"
          />
          <div className="project-caption">
            <div>
              <h2>{project.label}</h2>
              <p>{project.description}</p>
            </div>
            <span className="project-open" aria-hidden="true">
              <MorphIcon
                icon={projectActive ? ArrowUpRight : ExternalLink}
                size={17}
                strokeWidth={2}
                spring="snappy"
                reducedMotion="user"
              />
            </span>
          </div>
        </a>
      </section>

      <section
        id="activity"
        className="content-section activity-section"
        aria-labelledby="activity-title"
      >
        <div className="section-heading">
          <h2 id="activity-title">GitHub activity</h2>
          <PressableLink
            href="https://github.com/IuCC123"
            target="_blank"
            rel="noreferrer"
            icon={ArrowUpRight}
            hoverIcon={ExternalLink}
          >
            View profile
          </PressableLink>
        </div>
        <div className="github-activity">
          <GithubGraph
            account="IuCC123"
            months={9}
            variant="github"
            animation="cascade"
            animationSpeed={1.4}
            cellSize={21}
            cellGap={4}
            cellRadius={5}
            ambientEffect="twinkle"
            ambientIntensity={0.7}
            showLegend
            showAccount={false}
          />
        </div>
      </section>

      <section
        id="stack"
        className="content-section stack-area"
        aria-labelledby="stack-title"
      >
        <div className="section-heading stack-heading">
          <h2 id="stack-title">Tools I use</h2>
          <p>
            Open a category to see the languages, frameworks, databases, and
            tools in my projects.
          </p>
        </div>
        <TechSections />
      </section>

      <footer className="site-footer">
        <p>Built by IuCC with React and Motion.</p>
        <PressableLink href="mailto:iucc@duck.com" icon={Mail} hoverIcon={Send}>
          iucc@duck.com
        </PressableLink>
      </footer>
    </main>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>,
);
