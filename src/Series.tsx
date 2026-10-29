import type { ComponentType } from "react";
import { ArrowUpRightIcon, ImdbIcon, PlayIcon } from "./icons";
import lain640 from "./assets/series/lain-640.webp";
import lain960 from "./assets/series/lain-960.webp";
import lain1280 from "./assets/series/lain-1280.webp";

type Series = {
  slug: string;
  title: string;
  kind: string;
  summary: string;
  watch: { label: string; href: string };
  imdb: { id: string; rating: number };
  myScore: number;
  Art: ComponentType;
};

const LAIN_IMAGE = {
  src: lain960,
  srcSet: `${lain640} 640w, ${lain960} 960w, ${lain1280} 1280w`,
  sizes: "(max-width: 48rem) calc(100vw - 2rem), 34rem",
  width: 1280,
  height: 720,
  loading: "lazy",
  decoding: "async",
} as const;

function LainArt() {
  return (
    <div className="series-art series-art-lain">
      <img
        {...LAIN_IMAGE}
        alt="Serial Experiments Lain key art: Lain under power lines at night"
      />
      <img {...LAIN_IMAGE} alt="" aria-hidden="true" className="lain-tear" />
      <img {...LAIN_IMAGE} alt="" aria-hidden="true" className="lain-tear" />
      <p className="series-art-caption" aria-hidden="true">
        Present day
        <br />
        Present time
      </p>
    </div>
  );
}

const series = [
  {
    slug: "lain",
    title: "Serial Experiments Lain",
    kind: "Anime · 1998 · 13 episodes",
    summary:
      "A girl at Lain Iwakura's school dies, then starts emailing her classmates from the Wired. Lain, quiet and barely online, logs on to find her, and the network and the real world start to bleed into each other.",
    watch: {
      label: "Internet Archive",
      href: "https://archive.org/details/serial-experiments-lain-english",
    },
    imdb: { id: "tt0500092", rating: 8 },
    myScore: 8.5,
    Art: LainArt,
  },
] satisfies readonly Series[];

function Score({ value }: { value: number }) {
  return (
    <>
      {value.toFixed(1)}
      <span className="series-score-max" aria-hidden="true">
        /10
      </span>
      <span className="sr-only"> out of 10</span>
    </>
  );
}

function SeriesCard({ show }: { show: Series }) {
  return (
    <article className="series-card">
      <show.Art />

      <div className="series-body">
        <div className="series-title">
          <h3>
            <a
              className="series-primary-link"
              href={show.watch.href}
              target="_blank"
              rel="noreferrer"
            >
              {show.title}
            </a>
          </h3>
          <span className="series-kind">{show.kind}</span>
        </div>

        <p>{show.summary}</p>

        <dl className="series-scores">
          <div className="series-score">
            <dt>
              <ImdbIcon aria-hidden="true" className="series-imdb-icon" />
              IMDb
            </dt>
            <dd>
              <a
                href={`https://www.imdb.com/title/${show.imdb.id}/`}
                target="_blank"
                rel="noreferrer"
                aria-label={`IMDb rating ${show.imdb.rating.toFixed(1)} out of 10`}
              >
                <Score value={show.imdb.rating} />
              </a>
            </dd>
          </div>
          <div className="series-score">
            <dt>
              <img src="/favicon.svg" alt="" width={14} height={14} />
              My score
            </dt>
            <dd>
              <Score value={show.myScore} />
            </dd>
          </div>
        </dl>

        <a
          href={show.watch.href}
          target="_blank"
          rel="noreferrer"
          className="project-link series-watch"
          tabIndex={-1}
          aria-label={`Watch ${show.title} on ${show.watch.label}`}
        >
          <PlayIcon aria-hidden="true" />
          Watch on {show.watch.label}
          <ArrowUpRightIcon aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export default function FavoriteSeries() {
  return (
    <div className="series-list">
      {series.map((show) => (
        <SeriesCard key={show.slug} show={show} />
      ))}
    </div>
  );
}
