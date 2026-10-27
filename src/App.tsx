import React from "react";
import { ArrowDown, Mail, Send } from "lucide";
import { MorphIcon, type IconNode } from "morphicons/react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRightIcon,
  DiscordIcon,
  GitHubIcon,
  OsuIcon,
  type Icon,
} from "./icons";
import { usePressDepth } from "@/components/interior/press-depth";
import { Tooltip, TooltipGroup } from "@/components/interior/tooltip-group";
import AsciiHero from "./AsciiHero";
import Projects from "./Projects";

const TechSections = React.lazy(() => import("./TechSections"));
const GithubGraph = React.lazy(() =>
  import("@/components/unlumen-ui/github-graph").then((module) => ({
    default: module.GithubGraph,
  })),
);

type SocialLink = {
  href: string;
  label: string;
  color: string;
} & (
  | { kind: "brand"; icon: Icon }
  | { kind: "morph"; icon: IconNode; hoverIcon: IconNode }
);

const socialLinks = [
  {
    href: "https://github.com/IuCC123",
    label: "GitHub",
    kind: "brand",
    icon: GitHubIcon,
    color: "#f5f5f5",
  },
  {
    href: "mailto:iucc@duck.com",
    label: "Email",
    kind: "morph",
    icon: Mail,
    hoverIcon: Send,
    color: "#35d5a4",
  },
  {
    href: "https://discord.com/users/841362272139214848",
    label: "Discord",
    kind: "brand",
    icon: DiscordIcon,
    color: "#5865f2",
  },
  {
    href: "https://osu.ppy.sh/users/14438713/osu",
    label: "osu!",
    kind: "brand",
    icon: OsuIcon,
    color: "#ff66aa",
  },
] satisfies readonly SocialLink[];

type PressableLinkProps = {
  href: string;
  children: React.ReactNode;
  className: string;
  brandIcon?: Icon;
  icon?: IconNode;
  hoverIcon?: IconNode;
  external?: boolean;
};

function PressableLink({
  href,
  children,
  className,
  brandIcon: BrandIcon,
  icon,
  hoverIcon,
  external = false,
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
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={className}
      initial={false}
      animate={{
        y: pressed ? 2 : 0,
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
      {BrandIcon ? <BrandIcon aria-hidden="true" /> : null}
      {children}
      {icon ? (
        <MorphIcon
          icon={active && hoverIcon ? hoverIcon : icon}
          size={16}
          strokeWidth={2}
          spring="snappy"
          reducedMotion="user"
        />
      ) : null}
    </motion.a>
  );
}

function SectionHeading({
  id,
  title,
  link,
}: {
  id: string;
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="section-heading">
      <h2 id={id}>{title}</h2>
      {link ? (
        <a href={link.href} target="_blank" rel="noreferrer">
          {link.label}
          <ArrowUpRightIcon aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

function RevealLine({
  text,
  delay,
  stagger,
  className,
}: {
  text: string;
  delay: number;
  stagger: number;
  className: string;
}) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(" ").map((word, index) => (
          <React.Fragment key={index}>
            {index > 0 ? " " : null}
            <span
              className="reveal-word"
              style={
                {
                  "--reveal-delay": `${delay + index * stagger}ms`,
                } as React.CSSProperties
              }
            >
              {word}
            </span>
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}

const GRAPH_CELL = 13;
const GRAPH_GAP = 3;
const DAYS_PER_MONTH = 30.44;
// Month labels (24px), the scroller's vertical padding (16px), seven rows of
// cells and the legend below them (16px gap plus one cell).
const GRAPH_HEIGHT = 24 + 16 + 7 * GRAPH_CELL + 6 * GRAPH_GAP + 16 + GRAPH_CELL;

function ActivityGraph() {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [months, setMonths] = React.useState(12);
  const [nearViewport, setNearViewport] = React.useState(false);

  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNearViewport(true);
        visibility.disconnect();
      },
      { rootMargin: "400px 0px" },
    );
    visibility.observe(panel);
    const observer = new ResizeObserver(([entry]) => {
      const weeks = Math.floor(
        (entry.contentRect.width + GRAPH_GAP) / (GRAPH_CELL + GRAPH_GAP),
      );
      // Two spare columns cover the partial weeks at each end of the range.
      const fit = Math.floor(((weeks - 2) * 7) / DAYS_PER_MONTH);
      setMonths(Math.max(3, Math.min(12, fit)));
    });
    observer.observe(panel);
    return () => {
      visibility.disconnect();
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={panelRef}
      className="panel github-activity"
      style={{ "--graph-height": `${GRAPH_HEIGHT}px` } as React.CSSProperties}
    >
      {nearViewport ? (
        <React.Suspense fallback={null}>
          <GithubGraph
            account="IuCC123"
            months={months}
            variant="oled"
            animation="cascade"
            animationSpeed={1.4}
            cellSize={GRAPH_CELL}
            cellGap={GRAPH_GAP}
            cellRadius={3}
            ambientEffect="twinkle"
            ambientIntensity={0.6}
            showLegend
            showAccount={false}
          />
        </React.Suspense>
      ) : null}
    </div>
  );
}

export default function App() {
  const [activeSocial, setActiveSocial] = React.useState<string | null>(null);
  const heroCopyRef = React.useRef<HTMLDivElement>(null);

  return (
    <div id="top" className="page">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="IuCC, back to top">
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>IuCC</span>
        </a>

        <nav className="site-nav" aria-label="Page sections">
          <a href="#projects">Projects</a>
          <a href="#activity">Activity</a>
          <a href="#stack">Stack</a>
        </nav>

        <TooltipGroup className="socials">
          {socialLinks.map((link) => (
            <Tooltip key={link.label} label={link.label} side="bottom">
              <a
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
                aria-label={link.label}
                className="icon-link"
                style={{ "--brand": link.color } as React.CSSProperties}
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
                    size={16}
                    strokeWidth={2}
                    spring="snappy"
                    reducedMotion="user"
                  />
                )}
              </a>
            </Tooltip>
          ))}
        </TooltipGroup>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div ref={heroCopyRef} className="hero-copy">
            <h1 id="hero-title">
              <RevealLine
                text="Hey, I'm IuCC."
                delay={0}
                stagger={60}
                className="hero-line"
              />
              <RevealLine
                text="I build web tools, self-hosted apps and game infrastructure."
                delay={220}
                stagger={40}
                className="hero-line hero-line-muted"
              />
            </h1>
            <p className="hero-summary">
              I like building things people actually use, like Minecraft servers
              that cost nothing and a media server that needs no account. Most
              of it is open source.
            </p>
            <div className="hero-actions">
              <PressableLink
                href="#projects"
                className="button button-primary"
                icon={ArrowDown}
              >
                See projects
              </PressableLink>
              <PressableLink
                href="https://github.com/IuCC123"
                className="button button-secondary"
                brandIcon={GitHubIcon}
                external
              >
                GitHub
              </PressableLink>
            </div>
          </div>
          <AsciiHero avoidRef={heroCopyRef} />
        </section>

        <section
          id="projects"
          className="section"
          aria-labelledby="projects-title"
        >
          <SectionHeading
            id="projects-title"
            title="Projects"
            link={{
              href: "https://github.com/IuCC123?tab=repositories",
              label: "All repositories",
            }}
          />
          <Projects />
        </section>

        <section
          id="activity"
          className="section"
          aria-labelledby="activity-title"
        >
          <SectionHeading
            id="activity-title"
            title="GitHub activity"
            link={{ href: "https://github.com/IuCC123", label: "View profile" }}
          />
          <ActivityGraph />
        </section>

        <section id="stack" className="section" aria-labelledby="stack-title">
          <SectionHeading id="stack-title" title="Tools I use" />
          <React.Suspense fallback={null}>
            <TechSections />
          </React.Suspense>
        </section>
      </main>

      <footer className="site-footer">
        <p suppressHydrationWarning>© {new Date().getFullYear()} IuCC</p>
        <PressableLink
          href="mailto:iucc@duck.com"
          className="footer-link"
          icon={Mail}
          hoverIcon={Send}
        >
          iucc@duck.com
        </PressableLink>
      </footer>
    </div>
  );
}
