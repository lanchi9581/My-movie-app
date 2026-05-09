import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import MovieCard from "../components/MovieCard";

import "./Movies.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";
const BACKDROP_URL = "https://image.tmdb.org/t/p/original";
const POSTER_URL = "https://image.tmdb.org/t/p/w500";

const SECTIONS = [
  { id: "trending", title: "Trending Movies", endpoint: "/trending/movie/day" },
  { id: "now-playing", title: "Now Playing", endpoint: "/movie/now_playing" },
  { id: "upcoming", title: "New & Upcoming", endpoint: "/movie/upcoming" },
  { id: "popular", title: "Popular Movies", endpoint: "/movie/popular" },
  { id: "top-rated", title: "Top Rated", endpoint: "/movie/top_rated" },
  {
    id: "action",
    title: "Action Picks",
    endpoint: "/discover/movie",
    params: "&with_genres=28&sort_by=popularity.desc",
  },
  {
    id: "horror",
    title: "Horror Nights",
    endpoint: "/discover/movie",
    params: "&with_genres=27&sort_by=popularity.desc",
  },
  {
    id: "comedy",
    title: "Comedy Hits",
    endpoint: "/discover/movie",
    params: "&with_genres=35&sort_by=popularity.desc",
  },
];

function Movies() {
  const [trailerMovies, setTrailerMovies] = useState([]);
  const [activeTrailerIndex, setActiveTrailerIndex] = useState(0);
  const [sectionsData, setSectionsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrailerMovies() {
      try {
        const res = await fetch(
          `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`
        );

        const data = await res.json();
        const movies = data.results || [];

        const moviesWithVideos = await Promise.all(
          movies.slice(0, 8).map(async (movie) => {
            try {
              const videoRes = await fetch(
                `${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}&language=en-US`
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
                ...movie,
                trailerKey: trailer?.key || null,
              };
            } catch (error) {
              console.error("Trailer fetch failed:", error);

              return {
                ...movie,
                trailerKey: null,
              };
            }
          })
        );

        setTrailerMovies(
          moviesWithVideos.filter((movie) => movie.backdrop_path)
        );
      } catch (error) {
        console.error("Failed to fetch trailer movies:", error);
      }
    }

    fetchTrailerMovies();
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
              movies: data.results || [],
            };
          })
        );

        const nextData = {};

        results.forEach((section) => {
          nextData[section.id] = section.movies;
        });

        setSectionsData(nextData);
      } catch (error) {
        console.error("Failed to fetch movie sections:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSections();
  }, []);

  useEffect(() => {
    if (trailerMovies.length <= 1) return;

    const interval = setInterval(() => {
      setActiveTrailerIndex((prev) =>
        prev === trailerMovies.length - 1 ? 0 : prev + 1
      );
    }, 6500);

    return () => clearInterval(interval);
  }, [trailerMovies.length]);

  const activeTrailer = trailerMovies[activeTrailerIndex];

  const upNextMovies = useMemo(() => {
    if (!trailerMovies.length) return [];

    return trailerMovies
      .filter((_, index) => index !== activeTrailerIndex)
      .slice(0, 4);
  }, [trailerMovies, activeTrailerIndex]);

  const goPrevTrailer = (event) => {
    event.preventDefault();

    setActiveTrailerIndex((prev) =>
      prev === 0 ? trailerMovies.length - 1 : prev - 1
    );
  };

  const goNextTrailer = (event) => {
    event.preventDefault();

    setActiveTrailerIndex((prev) =>
      prev === trailerMovies.length - 1 ? 0 : prev + 1
    );
  };

  const setActiveMovie = (movieId) => {
    const index = trailerMovies.findIndex((movie) => movie.id === movieId);

    if (index !== -1) {
      setActiveTrailerIndex(index);
    }
  };

  const scrollRow = (sectionId, direction) => {
    const row = document.getElementById(`movie-row-${sectionId}`);

    if (!row) return;

    row.scrollBy({
      left: direction === "left" ? -520 : 520,
      behavior: "smooth",
    });
  };

  return (
    <main className="movies-page">
      <section className="trailers-section">
        <div className="section-heading">
          <span className="section-kicker">Cinema Preview</span>
          <h1>Explore Movies</h1>
        </div>

        {activeTrailer && (
          <div className="trailers-layout">
            <Link className="trailer-hero" to={`/movie/${activeTrailer.id}`}>
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
                aria-label="Previous movie"
              >
                <i className="bx bx-chevron-left"></i>
              </button>

              <button
                className="trailer-arrow trailer-arrow-right"
                type="button"
                onClick={goNextTrailer}
                aria-label="Next movie"
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
                        : "Open the movie page and discover what is coming next."}
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
                        <i className="bx bx-movie-play"></i>
                        Movie
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <aside className="up-next-panel">
              <h2>Up Next</h2>

              <div className="up-next-list">
                {upNextMovies.map((movie) => (
                  <button
                    key={movie.id}
                    className="up-next-card"
                    type="button"
                    onClick={() => setActiveMovie(movie.id)}
                  >
                    {movie.poster_path && (
                      <img
                        src={`${POSTER_URL}${movie.poster_path}`}
                        alt={movie.title}
                      />
                    )}

                    <div>
                      <span className="mini-play">
                        <i className="bx bx-play"></i>
                      </span>

                      <strong>{movie.title}</strong>
                      <small>Open movie details</small>

                      <span className="up-next-rating">
                        <i className="bx bxs-star"></i>
                        {movie.vote_average?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}
      </section>

      {loading && <p className="movies-loading">Loading movies...</p>}

      {!loading &&
        SECTIONS.map((section) => (
          <section className="movie-row-section" key={section.id}>
            <div className="movie-row-header">
              <div>
                <span className="section-kicker">Prestige Movies</span>
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

              <div className="movie-row" id={`movie-row-${section.id}`}>
                {(sectionsData[section.id] || []).slice(0, 18).map((movie) => (
                  <MovieCard key={`${section.id}-${movie.id}`} movie={movie} />
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

export default Movies;