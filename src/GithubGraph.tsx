import { useEffect, useMemo, useState } from "react";

type Contribution = {
  count: number;
  date: string;
  level: number;
};

type ContributionsResponse = {
  contributions?: Contribution[];
  total?: Record<string, number>;
};

const username = "IuCC123";
const weeksInGraph = 53;
const daysInWeek = 7;

function emptyContributions() {
  return Array.from({ length: weeksInGraph * daysInWeek }, (_, index) => ({
    count: 0,
    date: "",
    level: 0,
    key: `empty-${index}`,
  }));
}

function makeGraph(contributions: Contribution[]) {
  const byDate = new Map(contributions.map((day) => [day.date, day]));
  const today = new Date();
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - today.getDay());

  return Array.from({ length: weeksInGraph }, (_, weekIndex) =>
    Array.from({ length: daysInWeek }, (_, dayIndex) => {
      const date = new Date(lastSunday);
      date.setDate(lastSunday.getDate() - (weeksInGraph - 1 - weekIndex) * daysInWeek + dayIndex);
      const dateKey = date.toISOString().slice(0, 10);
      const contribution = byDate.get(dateKey);

      return {
        count: contribution?.count ?? 0,
        date: dateKey,
        level: contribution?.level ?? 0,
        key: dateKey,
      };
    }),
  );
}

export default function GithubGraph() {
  const [contributions, setContributions] = useState<Contribution[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadContributions() {
      try {
        const response = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
          { signal: controller.signal },
        );

        if (!response.ok) throw new Error("Unable to load GitHub activity");

        const data = (await response.json()) as ContributionsResponse;
        setContributions(data.contributions ?? []);
        setTotal(
          data.total?.lastYear ??
            Object.values(data.total ?? {}).reduce((sum, value) => sum + value, 0),
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setContributions([]);
      }
    }

    loadContributions();
    return () => controller.abort();
  }, []);

  const graph = useMemo(
    () => (contributions ? makeGraph(contributions) : emptyContributions()),
    [contributions],
  );
  const isLoading = contributions === null;

  return (
    <section className="github-graph" aria-labelledby="github-activity-heading">
      <div className="github-graph-heading">
        <div>
          <h2 id="github-activity-heading">GitHub activity</h2>
          <p>{total === null ? "Loading the last year of contributions…" : `${total} contributions in the last year`}</p>
        </div>
        <a href={`https://github.com/${username}`} target="_blank" rel="noreferrer">
          View profile
        </a>
      </div>

      <div className={isLoading ? "github-heatmap is-loading" : "github-heatmap"} aria-busy={isLoading}>
        <div className="github-weekdays" aria-hidden="true">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="github-weeks" role="img" aria-label="GitHub contribution activity for the last year">
          {graph.map((week, weekIndex) => (
            <div className="github-week" key={weekIndex}>
              {week.map((day) => (
                <span
                  className="github-day"
                  data-level={day.level}
                  key={day.key}
                  title={day.date ? `${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}` : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="github-legend" aria-label="Contribution intensity legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => <i data-level={level} key={level} />)}
        <span>More</span>
      </div>
    </section>
  );
}
