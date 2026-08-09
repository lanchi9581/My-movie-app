import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MovieCard from "../components/MovieCard/MovieCard";
import "./TvShows.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";

const BACKDROP_URL = "https://image.tmdb.org/t/p/w1280";
const POSTER_URL = "https://image.tmdb.org/t/p/w342";

const ROW_SECTIONS = [
  {
    id: "trending",
    kicker: "Prestige Series",
    title: "Trending Series",
    endpoint: "/trending/tv/week",
    viewAllPath: "/discover/series",
  },
  {
    id: "popular",
    kicker: "Binge-worthy",
    title: "Popular Series",
    endpoint: "/tv/popular",
    viewAllPath: "/discover/series",
  },
  {
    id: "top-rated",
    kicker: "Best rated",
    title: "Top Rated Series",
    endpoint: "/tv/top_rated",
    viewAllPath: "/discover/series",
  },
  {
    id: "on-the-air",
    kicker: "New episodes",
    title: "On The Air",
    endpoint: "/tv/on_the_air",
    viewAllPath: "/discover/series",
  },
  {
    id: "airing-today",
    kicker: "Today",
    title: "Airing Today",
    endpoint: "/tv/airing_today",
    viewAllPath: "/discover/series",
  },
  {
    id: "drama",
    kicker: "Deep stories",
    title: "Drama Series",
    endpoint: "/discover/tv",
    params: "&with_genres=18&sort_by=popularity.desc",
    viewAllPath: "/discover/series",
  },
  {
    id: "crime",
    kicker: "Mystery nights",
    title: "Crime Series",
    endpoint: "/discover/tv",
    params: "&with_genres=80&sort_by=popularity.desc",
    viewAllPath: "/discover/series",
  },
  {
    id: "sci-fi",
    kicker: "Other worlds",
    title: "Sci-Fi & Fantasy",
    endpoint: "/discover/tv",
    params: "&with_genres=10765&sort_by=popularity.desc",
    viewAllPath: "/discover/series",
  },
];

function getTitle(show) {
  return show?.title || show?.name || "Untitled";
}

function getYear(show) {
  const date = show?.release_date || show?.first_air_date;
  return date ? date.slice(0, 4) : "New";
}

function getRating(show) {
  if (!show?.vote_average && show?.vote_average !== 0) return "N/A";
  return show.vote_average.toFixed(1);
}

function normalizeShow(show) {
  return {
    ...show,
    media_type: "tv",
    title: show.title || show.name,
    release_date: show.release_date || show.first_air_date,
  };
}

function uniqueShows(shows) {
  const seen = new Set();

  return shows.filter((show) => {
    if (!show?.id) return false;
    if (seen.has(show.id)) return false;

    seen.add(show.id);
    return true;
  });
}

async function fetchShows(endpoint, page = 1, params = "") {
  const separator = endpoint.includes("?") ? "&" : "?";

  const response = await fetch(
    `${BASE_URL}${endpoint}${separator}api_key=${API_KEY}&language=en-US&page=${page}${params}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }

  const data = await response.json();

  return Array.isArray(data.results) ? data.results.map(normalizeShow) : [];
}

function SeriesRow({ section, shows }) {
  const rowRef = useRef(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);

  const updateButtons = useCallback(() => {
    const row = rowRef.current;

    if (!row) return;

    const maxScroll = row.scrollWidth - row.clientWidth;

    setCanGoPrev(row.scrollLeft > 4);
    setCanGoNext(row.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const row = rowRef.current;

    updateButtons();

    if (!row) return;

    row.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);

    return () => {
      row.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [updateButtons, shows.length]);

  const slide = (direction) => {
    const row = rowRef.current;

    if (!row) return;

    row.scrollBy({
      left: direction * Math.round(row.clientWidth * 0.82),
      behavior: "smooth",
    });
  };

  if (!shows.length) return null;

  return (
    <section className="series-row-section">
      <div className="series-section-header">
        <div>
          <span>{section.kicker}</span>
          <h2>{section.title}</h2>
        </div>

        <div className="series-section-actions">
          {section.viewAllPath && (
            <Link to={section.viewAllPath} className="series-view-all">
              View all
              <i className="bx bx-chevron-right"></i>
            </Link>
          )}

          <div className="series-row-controls">
            <button
              type="button"
              onClick={() => slide(-1)}
              disabled={!canGoPrev}
              aria-label={`Previous ${section.title}`}
            >
              <i className="bx bx-chevron-left"></i>
            </button>

            <button
              type="button"
              onClick={() => slide(1)}
              disabled={!canGoNext}
              aria-label={`Next ${section.title}`}
            >
              <i className="bx bx-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="series-horizontal-row" ref={rowRef}>
        {shows.map((show, index) => (
          <MovieCard key={`${section.id}-${show.id}`} movie={show} index={index} />
        ))}
      </div>
    </section>
  );
}

function TVShows() {
  const [heroShows, setHeroShows] = useState([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [rowData, setRowData] = useState({});

  useEffect(() => {
    async function loadSeriesPage() {
      try {
        const [trending, onTheAir] = await Promise.all([
          fetchShows("/trending/tv/week", 1),
          fetchShows("/tv/on_the_air", 1),
        ]);

        const heroList = uniqueShows([...trending, ...onTheAir])
          .filter((show) => show.backdrop_path && show.poster_path)
          .slice(0, 8);

        setHeroShows(heroList);

        const rows = {};
        const usedShowIds = new Set();

        for (const section of ROW_SECTIONS) {
          const pages = await Promise.all([
            fetchShows(section.endpoint, 1, section.params || ""),
            fetchShows(section.endpoint, 2, section.params || ""),
            fetchShows(section.endpoint, 3, section.params || ""),
            fetchShows(section.endpoint, 4, section.params || ""),
          ]);

          const filteredShows = uniqueShows(pages.flat())
            .filter((show) => {
              if (!show.poster_path) return false;
              if (usedShowIds.has(show.id)) return false;

              usedShowIds.add(show.id);
              return true;
            })
            .slice(0, 60);

          rows[section.id] = filteredShows;
        }

        setRowData(rows);
      } catch (error) {
        console.error("Failed to load series page:", error);
      }
    }

    loadSeriesPage();
  }, []);

  useEffect(() => {
    if (heroShows.length <= 1) return;

    const interval = setInterval(() => {
      setActiveHeroIndex((prev) =>
        prev === heroShows.length - 1 ? 0 : prev + 1
      );
    }, 9000);

    return () => clearInterval(interval);
  }, [heroShows.length]);

  const activeHero = heroShows[activeHeroIndex];

  const upNextShows = useMemo(() => {
    if (!heroShows.length) return [];

    return heroShows
      .filter((_, index) => index !== activeHeroIndex)
      .slice(0, 4);
  }, [heroShows, activeHeroIndex]);

  const heroBackground = useMemo(() => {
  if (!activeHero?.backdrop_path) return undefined;

  return {
    backgroundImage: `
      linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.88) 0%,
        rgba(0, 0, 0, 0.68) 28%,
        rgba(0, 0, 0, 0.18) 52%,
        rgba(0, 0, 0, 0.62) 100%
      ),
      linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.04) 0%,
        rgba(0, 0, 0, 0.88) 100%
      ),
      url(${BACKDROP_URL}${activeHero.backdrop_path})
    `,
  };
}, [activeHero]);

  const goPrevHero = () => {
    setActiveHeroIndex((prev) =>
      prev === 0 ? heroShows.length - 1 : prev - 1
    );
  };

  const goNextHero = () => {
    setActiveHeroIndex((prev) =>
      prev === heroShows.length - 1 ? 0 : prev + 1
    );
  };

  const setActiveShow = (showId) => {
    const index = heroShows.findIndex((show) => show.id === showId);

    if (index !== -1) {
      setActiveHeroIndex(index);
    }
  };

  return (
    <main className="series-page">
      {activeHero && (
        <section className="series-hero-shell">
          <div className="series-hero-heading">
            <span>Series Preview</span>
            <h1>Explore Series</h1>
          </div>

          <div className="series-hero-layout">
            <section className="series-hero" style={heroBackground}>
              <button
                type="button"
                className="series-hero-arrow series-hero-arrow-left"
                onClick={goPrevHero}
                aria-label="Previous featured series"
              >
                <i className="bx bx-chevron-left"></i>
              </button>

              <button
                type="button"
                className="series-hero-arrow series-hero-arrow-right"
                onClick={goNextHero}
                aria-label="Next featured series"
              >
                <i className="bx bx-chevron-right"></i>
              </button>

              <div className="series-hero-content">
                <span className="series-kicker">
                  <i className="bx bxs-tv"></i>
                  Prestige Series
                </span>

                <h2>{getTitle(activeHero)}</h2>

                <p>
                  {activeHero.overview ||
                    "Discover trending series, popular shows and your next binge-worthy story."}
                </p>

                <div className="series-hero-meta">
                  <span>
                    <i className="bx bxs-star"></i>
                    {getRating(activeHero)}
                  </span>

                  <span>{getYear(activeHero)}</span>
                  <span>Series</span>
                  <span>HD</span>
                </div>

                <div className="series-hero-actions">
                  <Link to={`/series/${activeHero.id}`} className="series-primary-btn">
                    <i className="bx bxs-right-arrow"></i>
                    Watch Now
                  </Link>

                  <Link to="/discover/" className="series-secondary-btn">
                    <i className="bx bx-grid-alt"></i>
                    View more
                  </Link>
                </div>
              </div>
            </section>

            <aside className="series-up-next-panel">
              <h2>Up Next</h2>

              <div className="series-up-next-list">
                {upNextShows.map((show) => (
                  <button
                    key={show.id}
                    className="series-up-next-card"
                    type="button"
                    onClick={() => setActiveShow(show.id)}
                  >
                    {show.poster_path && (
                      <img
                        src={`${POSTER_URL}${show.poster_path}`}
                        alt={getTitle(show)}
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                    <div>
                      <span className="series-mini-play">
                        <i className="bx bx-play"></i>
                      </span>

                      <strong>{getTitle(show)}</strong>
                      <small>Open series details</small>

                      <span className="series-up-next-rating">
                        <i className="bx bxs-star"></i>
                        {getRating(show)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>
      )}

      <section className="series-rows-wrap">
        {ROW_SECTIONS.map((section) => (
          <SeriesRow
            key={section.id}
            section={section}
            shows={rowData[section.id] || []}
          />
        ))}
      </section>
    </main>
  );
}

export default TVShows;