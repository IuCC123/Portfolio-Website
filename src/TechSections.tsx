import type { CSSProperties } from "react";
import type { IconType } from "react-icons";
import {
  SiAndroidstudio,
  SiArduino,
  SiBootstrap,
  SiCss,
  SiDocker,
  SiDotnet,
  SiElectron,
  SiExpress,
  SiFlutter,
  SiGit,
  SiGnubash,
  SiHtml5,
  SiHuggingface,
  SiJavascript,
  SiKotlin,
  SiLinux,
  SiMariadb,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNginx,
  SiNodedotjs,
  SiPostgresql,
  SiPostman,
  SiReact,
  SiTailwindcss,
  SiUnity,
} from "react-icons/si";

type TechItem = {
  icon: IconType;
  label: string;
  color: string;
};

const sections: Array<{ title: string; items: TechItem[] }> = [
  {
    title: "Languages",
    items: [
      { icon: SiJavascript, label: "JavaScript", color: "#f7df1e" },
      { icon: SiKotlin, label: "Kotlin", color: "#7f52ff" },
      { icon: SiGnubash, label: "Bash", color: "#4eaa25" },
      { icon: SiHtml5, label: "HTML5", color: "#e34f26" },
      { icon: SiCss, label: "CSS3", color: "#1572b6" },
    ],
  },
  {
    title: "Frameworks & Libraries",
    items: [
      { icon: SiNodedotjs, label: "Node.js", color: "#5fa04e" },
      { icon: SiExpress, label: "Express.js", color: "#f5f5f5" },
      { icon: SiReact, label: "React", color: "#61dafb" },
      { icon: SiNextdotjs, label: "Next.js", color: "#f5f5f5" },
      { icon: SiFlutter, label: "Flutter", color: "#02569b" },
      { icon: SiBootstrap, label: "Bootstrap", color: "#7952b3" },
      { icon: SiTailwindcss, label: "TailwindCSS", color: "#06b6d4" },
    ],
  },
  {
    title: "Databases",
    items: [
      { icon: SiMongodb, label: "MongoDB", color: "#47a248" },
      { icon: SiMysql, label: "MySQL", color: "#4479a1" },
      { icon: SiPostgresql, label: "PostgreSQL", color: "#4169e1" },
      { icon: SiMariadb, label: "MariaDB", color: "#c0765a" },
    ],
  },
  {
    title: "Tools & Platforms",
    items: [
      { icon: SiDocker, label: "Docker", color: "#2496ed" },
      { icon: SiGit, label: "Git", color: "#f05032" },
      { icon: SiLinux, label: "Linux", color: "#fcc624" },
      { icon: SiNginx, label: "Nginx", color: "#009639" },
      { icon: SiPostman, label: "Postman", color: "#ff6c37" },
      { icon: SiAndroidstudio, label: "Android Studio", color: "#3ddc84" },
    ],
  },
  {
    title: "Other Technologies",
    items: [
      { icon: SiArduino, label: "Arduino", color: "#00878f" },
      { icon: SiUnity, label: "Unity", color: "#f5f5f5" },
      { icon: SiElectron, label: "Electron", color: "#47848f" },
      { icon: SiDotnet, label: ".NET", color: "#512bd4" },
      { icon: SiHuggingface, label: "Hugging Face", color: "#ffd21e" },
    ],
  },
];

export default function TechSections() {
  return (
    <div className="stack-sections">
      {sections.map((section) => (
        <section key={section.title} className="stack-section">
          <h2>{section.title}</h2>
          <div className="tech-grid">
            {section.items.map((item) => (
              <div
                key={item.label}
                className="tech-item"
                style={{ "--hover-color": item.color } as CSSProperties}
              >
                <span className="tech-icon" aria-hidden="true">
                  <item.icon />
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
