import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import type { IconType } from "react-icons";
import {
  SiDiscord,
  SiGithub,
  SiOsu,
} from "react-icons/si";
import { LuArrowDown, LuExternalLink, LuMail } from "react-icons/lu";
import { GithubGraph } from "@/components/unlumen-ui/github-graph";
import "./styles.css";

type LinkItem = {
  href: string;
  label: string;
  icon: IconType;
  color: string;
  description?: string;
  previewImage?: string;
};

const TechSections = React.lazy(() => import("./TechSections"));

function HomePage() {
  const projectLinks: LinkItem[] = [
    {
      href: "https://swiftservers.org",
      label: "SwiftServers",
      icon: LuExternalLink,
      color: "#00a672",
      description:
        "Free Minecraft hosting with a browser dashboard for launching and managing Paper, Spigot, and Fabric servers.",
      previewImage: "/swiftservers-preview.webp",
    },
  ];

  const socialLinks: LinkItem[] = [
    {
      href: "https://github.com/IuCC123",
      label: "GitHub",
      icon: SiGithub,
      color: "#f5f5f5",
    },
    {
      href: "mailto:iucc@iucc.me",
      label: "Email",
      icon: LuMail,
      color: "#ea4335",
    },
    {
      href: "https://discord.com/users/841362272139214848",
      label: "Discord",
      icon: SiDiscord,
      color: "#5865f2",
    },
    {
      href: "https://osu.ppy.sh/users/14438713/osu",
      label: "osu!",
      icon: SiOsu,
      color: "#ff66aa",
    },
  ];

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Hey, I’m IuCC.</h1>

        <div className="scroll-hint" aria-hidden="true">
          <LuArrowDown />
        </div>

        <div className="link-groups">
          <div className="link-group">
            <h2>My Projects</h2>
            {projectLinks.map((link) => {
              const Icon = link.icon;

              return (
                <div
                  key={link.label}
                  className="project-preview"
                  style={{ "--hover-color": link.color } as React.CSSProperties}
                >
                  <a href={link.href} target="_blank" rel="noreferrer" className="nav-link project-link">
                    <Icon />
                    <span>{link.label}</span>
                  </a>

                  <div className="preview-card" aria-hidden="true">
                    <div className="preview-image-wrap">
                      <img
                        src={link.previewImage}
                        alt=""
                        className="preview-image"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        width="1400"
                        height="889"
                      />
                    </div>
                    <div className="preview-copy">
                      <p className="preview-title">What it is</p>
                      <p className="preview-description">{link.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="link-group">
            <h2>My Socials</h2>
            {socialLinks.map((link) => {
              const Icon = link.icon;

              return (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
                  className="nav-link"
                  style={{ "--hover-color": link.color } as React.CSSProperties}
                >
                  <Icon />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        <section className="github-activity" aria-label="GitHub activity">
          <GithubGraph
            account="IuCC123"
            months={6}
            variant="github"
            animation="cascade"
            animationSpeed={1.4}
            cellSize={14}
            cellGap={3}
            cellRadius={4}
            ambientEffect="twinkle"
            ambientIntensity={0.7}
            showLegend
            showAccount={false}
          />
        </section>

        <Suspense fallback={<div className="stack-placeholder" aria-hidden="true" />}>
          <TechSections />
        </Suspense>
      </section>
    </main>
  );
}

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const routeTree = rootRoute.addChildren([indexRoute]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
