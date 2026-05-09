import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import MovieCard from "../components/MovieCard";

import "./TvShows.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";
const BACKDROP_URL = "https://image.tmdb.org/t/p/original";
const POSTER_URL = "https://image.tmdb.org/t/p/w500";

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

function TVShows() {
  const [trailerShows, setTrailerShows] = useState([]);
  const [activeTrailerIndex, setActiveTrailerIndex] = useState(0);
  const [sectionsData, setSectionsData] = useState({});
  const [loading, setLoading] = useState(true);

  const normalizeShow = (show) => ({
    ...show,
    media_type: "tv",
    title: show.name,
    release_date: show.first_air_date,
  });

  useEffect(() => {
    async function fetchTrailerShows() {
      try {
        const res = await fetch(
          `${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&language=en-US&page=1`
        );

        const data = await res.json();
        const shows = data.results || [];

        const showsWithVideos = await Promise.all(
          shows.slice(0, 8).map(async (show) => {
            try {
              const videoRes = await fetch(
                `${BASE_URL}/tv/${show.id}/videos?api_key=${API_KEY}&language=en-US`
              );

              const videoData = await videoRes.json();

              const trailer =
                videoData.results?.find(
                  (video) =>
                    video.site === "YouTube" &&
                    video.type === "Trailer" &&
                    video.official
                ) ||
                videoData.results?.find(
                  (video) =>
                    video.site === "YouTube" && video.type === "Trailer"
                ) ||
                videoData.results?.find((video) => video.site === "YouTube");

              return {
                ...normalizeShow(show),
                trailerKey: trailer?.key || null,
              };
            } catch (error) {
              console.error("Trailer fetch failed:", error);

              return {
                ...normalizeShow(show),
                trailerKey: null,
              };
            }
          })
        );

        setTrailerShows(showsWithVideos.filter((show) => show.backdrop_path));
      } catch (error) {
        console.error("Failed to fetch trailer shows:", error);
      }
    }

    fetchTrailerShows();
  }, []);

  useEffect(() => {
    async function fetchSections() {
      setLoading(true);

      try {
        const results = await Promise.all(
          SECTIONS.map(async (section) => {
            const url = `${BASE_URL}${section.endpoint}?api_key=${API_KEY}&language=en-US&page=1${
              section.params || ""
            }`;

            const res = await fetch(url);
            const data = await res.json();

            return {
              id: section.id,
              shows: (data.results || []).map(normalizeShow),
            };
          })
        );

        const nextData = {};

        results.forEach((section) => {
          nextData[section.id] = section.shows;
        });

        setSectionsData(nextData);
      } catch (error) {
        console.error("Failed to fetch TV sections:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSections();
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

  const scrollRow = (sectionId, direction) => {
    const row = document.getElementById(`series-row-${sectionId}`);

    if (!row) return;

    row.scrollBy({
      left: direction === "left" ? -520 : 520,
      behavior: "smooth",
    });
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
              />

              <div className="trailer-gradient" />

              <button
                className="trailer-arrow trailer-arrow-left"
                type="button"
                onClick={goPrevTrailer}
                aria-label="Previous series"
              >
                <i className="bx bx-chevron-left"></i>
              </button>

              <button
                className="trailer-arrow trailer-arrow-right"
                type="button"
                onClick={goNextTrailer}
                aria-label="Next series"
              >
                <i className="bx bx-chevron-right"></i>
              </button>

              <div className="trailer-info">
                {activeTrailer.poster_path && (
                  <img
                    className="trailer-poster"
                    src={`${POSTER_URL}${activeTrailer.poster_path}`}
                    alt={activeTrailer.title}
                  />
                )}

                <div className="trailer-copy">
                  <span className="trailer-play">
                    <i className="bx bx-play"></i>
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
                        <i className="bx bxs-star"></i>
                        {activeTrailer.vote_average?.toFixed(1) || "N/A"}
                      </span>

                      <span>
                        <i className="bx bx-calendar"></i>
                        {activeTrailer.release_date?.slice(0, 4) || "Soon"}
                      </span>

                      <span>
                        <i className="bx bx-tv"></i>
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
                      />
                    )}

                    <div>
                      <span className="mini-play">
                        <i className="bx bx-play"></i>
                      </span>

                      <strong>{show.title}</strong>
                      <small>Open series details</small>

                      <span className="up-next-rating">
                        <i className="bx bxs-star"></i>
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

      {loading && <p className="movies-loading">Loading series...</p>}

      {!loading &&
        SECTIONS.map((section) => (
          <section className="movie-row-section" key={section.id}>
            <div className="movie-row-header">
              <div>
                <span className="section-kicker">Prestige Series</span>
                <h2>{section.title}</h2>
              </div>

              <Link to="/search" className="view-more-link">
                View more
                <i className="bx bx-chevron-right"></i>
              </Link>
            </div>

            <div className="movie-row-wrap">
              <button
                className="row-arrow row-arrow-left"
                type="button"
                onClick={() => scrollRow(section.id, "left")}
                aria-label={`Scroll ${section.title} left`}
              >
                <i className="bx bx-chevron-left"></i>
              </button>

              <div className="movie-row" id={`series-row-${section.id}`}>
                {(sectionsData[section.id] || []).slice(0, 18).map((show) => (
                  <MovieCard key={`${section.id}-${show.id}`} movie={show} />
                ))}
              </div>

              <button
                className="row-arrow row-arrow-right"
                type="button"
                onClick={() => scrollRow(section.id, "right")}
                aria-label={`Scroll ${section.title} right`}
              >
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </section>
        ))}
    </main>
  );
}

export default TVShows;