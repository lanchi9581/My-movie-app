import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import MediaRows from "../components/MediaRows/MediaRows";

import "./Movies.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";

const BACKDROP_URL = "https://image.tmdb.org/t/p/w1280";
const POSTER_URL = "https://image.tmdb.org/t/p/w342";

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

async function fetchMoviePage(endpoint, page = 1) {
  const res = await fetch(
    `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US&page=${page}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }

  const data = await res.json();
  return data.results || [];
}

function Movies() {
  const [trailerMovies, setTrailerMovies] = useState([]);
  const [activeTrailerIndex, setActiveTrailerIndex] = useState(0);

  useEffect(() => {
    async function fetchTrailerMovies() {
      try {
        const movies = await fetchMoviePage("/movie/upcoming", 1);

        const filteredMovies = movies
          .filter((movie) => movie.backdrop_path)
          .slice(0, 8);

        setTrailerMovies(filteredMovies);
      } catch (error) {
        console.error("Failed to fetch trailer movies:", error);
      }
    }

    fetchTrailerMovies();
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
                decoding="async"
                fetchPriority="high"
              />

              <div className="trailer-gradient" />

              <button
                className="trailer-arrow trailer-arrow-left"
                type="button"
                onClick={goPrevTrailer}
                aria-label="Previous movie"
              >
                <i className="bx bx-chevron-left" aria-hidden="true"></i>
              </button>

              <button
                className="trailer-arrow trailer-arrow-right"
                type="button"
                onClick={goNextTrailer}
                aria-label="Next movie"
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
                        : "Open the movie page and discover what is coming next."}
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
                        <i className="bx bx-movie-play" aria-hidden="true"></i>
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
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                    <div>
                      <span className="mini-play">
                        <i className="bx bx-play" aria-hidden="true"></i>
                      </span>

                      <strong>{movie.title}</strong>
                      <small>Open movie details</small>

                      <span className="up-next-rating">
                        <i className="bx bxs-star" aria-hidden="true"></i>
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

      <MediaRows
        sections={SECTIONS}
        baseUrl={BASE_URL}
        apiKey={API_KEY}
        posterUrl={POSTER_URL}
        kicker="Prestige Movies"
        loadingText="Loading movies..."
        rowIdPrefix="movie-row"
        accent="#c40012"
        arrowHoverBackground="rgba(229, 9, 20, 0.86)"
        arrowHoverBorder="rgba(229, 9, 20, 0.95)"
      />
    </main>
  );
}

export default Movies;