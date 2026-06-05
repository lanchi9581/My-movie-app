import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import MediaRows from "../components/MediaRows/MediaRows";

import "./TvShows.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";

const BACKDROP_URL = "https://image.tmdb.org/t/p/w1280";
const POSTER_URL = "https://image.tmdb.org/t/p/w342";

const SECTIONS = [
  {
    id: "trending",
    title: "Trending Series",
    endpoint: "/trending/tv/day",
  },
  {
    id: "popular",
    title: "Popular Series",
    endpoint: "/tv/popular",
  },
  {
    id: "top-rated",
    title: "Top Rated Series",
    endpoint: "/tv/top_rated",
  },
  {
    id: "on-the-air",
    title: "On The Air",
    endpoint: "/tv/on_the_air",
  },
  {
    id: "airing-today",
    title: "Airing Today",
    endpoint: "/tv/airing_today",
  },
  {
    id: "drama",
    title: "Drama Series",
    endpoint: "/discover/tv",
    params: "&with_genres=18&sort_by=popularity.desc",
  },
  {
    id: "comedy",
    title: "Comedy Series",
    endpoint: "/discover/tv",
    params: "&with_genres=35&sort_by=popularity.desc",
  },
  {
    id: "crime",
    title: "Crime Series",
    endpoint: "/discover/tv",
    params: "&with_genres=80&sort_by=popularity.desc",
  },
  {
    id: "sci-fi",
    title: "Sci-Fi & Fantasy",
    endpoint: "/discover/tv",
    params: "&with_genres=10765&sort_by=popularity.desc",
  },
];

function normalizeShow(show) {
  return {
    ...show,
    media_type: "tv",
    title: show.title || show.name,
    release_date: show.release_date || show.first_air_date,
  };
}

async function fetchShowPage(endpoint, page = 1) {
  const res = await fetch(
    `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US&page=${page}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }

  const data = await res.json();
  return (data.results || []).map(normalizeShow);
}

function TVShows() {
  const [trailerShows, setTrailerShows] = useState([]);
  const [activeTrailerIndex, setActiveTrailerIndex] = useState(0);

  useEffect(() => {
    async function fetchTrailerShows() {
      try {
        const shows = await fetchShowPage("/tv/on_the_air", 1);

        const filteredShows = shows
          .filter((show) => show.backdrop_path)
          .slice(0, 8);

        setTrailerShows(filteredShows);
      } catch (error) {
        console.error("Failed to fetch trailer shows:", error);
      }
    }

    fetchTrailerShows();
  }, []);

  useEffect(() => {
    if (trailerShows.length <= 1) return;

    const interval = setInterval(() => {
      setActiveTrailerIndex((prev) =>
        prev === trailerShows.length - 1 ? 0 : prev + 1
      );
    }, 6500);

    return () => clearInterval(interval);
  }, [trailerShows.length]);

  const activeTrailer = trailerShows[activeTrailerIndex];

  const upNextShows = useMemo(() => {
    if (!trailerShows.length) return [];

    return trailerShows
      .filter((_, index) => index !== activeTrailerIndex)
      .slice(0, 4);
  }, [trailerShows, activeTrailerIndex]);

  const goPrevTrailer = (event) => {
    event.preventDefault();

    setActiveTrailerIndex((prev) =>
      prev === 0 ? trailerShows.length - 1 : prev - 1
    );
  };

  const goNextTrailer = (event) => {
    event.preventDefault();

    setActiveTrailerIndex((prev) =>
      prev === trailerShows.length - 1 ? 0 : prev + 1
    );
  };

  const setActiveShow = (showId) => {
    const index = trailerShows.findIndex((show) => show.id === showId);

    if (index !== -1) {
      setActiveTrailerIndex(index);
    }
  };

  return (
    <main className="movies-page series-page">
      <section className="trailers-section">
        <div className="section-heading">
          <span className="section-kicker">Series Preview</span>
          <h1>Explore Series</h1>
        </div>

        {activeTrailer && (
          <div className="trailers-layout">
            <Link className="trailer-hero" to={`/series/${activeTrailer.id}`}>
              <img
                className="trailer-backdrop"
                src={`${BACKDROP_URL}${activeTrailer.backdrop_path}`}
                alt={activeTrailer.title}
                decoding="async"
                fetchPriority="high"
              />

              <div className="trailer-gradient" />

              <button
                className="trailer-arrow trailer-arrow-left"
                type="button"
                onClick={goPrevTrailer}
                aria-label="Previous series"
              >
                <i className="bx bx-chevron-left" aria-hidden="true"></i>
              </button>

              <button
                className="trailer-arrow trailer-arrow-right"
                type="button"
                onClick={goNextTrailer}
                aria-label="Next series"
              >
                <i className="bx bx-chevron-right" aria-hidden="true"></i>
              </button>

              <div className="trailer-info">
                {activeTrailer.poster_path && (
                  <img
                    className="trailer-poster"
                    src={`${POSTER_URL}${activeTrailer.poster_path}`}
                    alt={activeTrailer.title}
                    loading="lazy"
                    decoding="async"
                  />
                )}

                <div className="trailer-copy">
                  <span className="trailer-play">
                    <i className="bx bx-play" aria-hidden="true"></i>
                  </span>

                  <div>
                    <h2>{activeTrailer.title}</h2>

                    <p>
                      {activeTrailer.overview
                        ? `${activeTrailer.overview.slice(0, 150)}...`
                        : "Open the series page and discover your next show."}
                    </p>

                    <div className="trailer-meta">
                      <span>
                        <i className="bx bxs-star" aria-hidden="true"></i>
                        {activeTrailer.vote_average?.toFixed(1) || "N/A"}
                      </span>

                      <span>
                        <i className="bx bx-calendar" aria-hidden="true"></i>
                        {activeTrailer.release_date?.slice(0, 4) || "Soon"}
                      </span>

                      <span>
                        <i className="bx bx-tv" aria-hidden="true"></i>
                        Series
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <aside className="up-next-panel">
              <h2>Up Next</h2>

              <div className="up-next-list">
                {upNextShows.map((show) => (
                  <button
                    key={show.id}
                    className="up-next-card"
                    type="button"
                    onClick={() => setActiveShow(show.id)}
                  >
                    {show.poster_path && (
                      <img
                        src={`${POSTER_URL}${show.poster_path}`}
                        alt={show.title}
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                    <div>
                      <span className="mini-play">
                        <i className="bx bx-play" aria-hidden="true"></i>
                      </span>

                      <strong>{show.title}</strong>
                      <small>Open series details</small>

                      <span className="up-next-rating">
                        <i className="bx bxs-star" aria-hidden="true"></i>
                        {show.vote_average?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}
      </section>

      <MediaRows
        sections={SECTIONS}
        baseUrl={BASE_URL}
        apiKey={API_KEY}
        posterUrl={POSTER_URL}
        kicker="Prestige Series"
        loadingText="Loading series..."
        rowIdPrefix="series-row"
        normalizeItem={normalizeShow}
        accent="#a98cff"
        arrowHoverBackground="rgba(125, 70, 255, 0.86)"
        arrowHoverBorder="rgba(125, 70, 255, 0.95)"
      />
    </main>
  );
}

export default TVShows;