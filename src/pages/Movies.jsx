import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MovieCard from "../components/MovieCard/MovieCard";
import "./Movies.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";

const BACKDROP_URL = "https://image.tmdb.org/t/p/w1280";
const POSTER_URL = "https://image.tmdb.org/t/p/w342";

const ROW_SECTIONS = [
  {
    id: "trending",
    kicker: "Prestige Movies",
    title: "Trending Movies",
    endpoint: "/trending/movie/week",
    viewAllPath: "/discover/movies",
  },
  {
    id: "now-playing",
    kicker: "In cinemas",
    title: "Now Playing",
    endpoint: "/movie/now_playing",
    viewAllPath: "/discover/movies",
  },
  {
    id: "popular",
    kicker: "Audience picks",
    title: "Popular Movies",
    endpoint: "/movie/popular",
    viewAllPath: "/discover/movies",
  },
  {
    id: "top-rated",
    kicker: "Best rated",
    title: "Top Rated",
    endpoint: "/movie/top_rated",
    viewAllPath: "/discover/movies",
  },
  {
    id: "action",
    kicker: "Adrenaline",
    title: "Action Picks",
    endpoint: "/discover/movie",
    params: "&with_genres=28&sort_by=popularity.desc",
    viewAllPath: "/discover/movies",
  },
  {
    id: "horror",
    kicker: "Dark nights",
    title: "Horror Movies",
    endpoint: "/discover/movie",
    params: "&with_genres=27&sort_by=popularity.desc",
    viewAllPath: "/discover/movies",
  },
  {
    id: "comedy",
    kicker: "Feel good",
    title: "Comedy Hits",
    endpoint: "/discover/movie",
    params: "&with_genres=35&sort_by=popularity.desc",
    viewAllPath: "/discover/movies",
  },
];

function getTitle(movie) {
  return movie?.title || movie?.name || "Untitled";
}

function getYear(movie) {
  const date = movie?.release_date || movie?.first_air_date;
  return date ? date.slice(0, 4) : "New";
}

function getRating(movie) {
  if (!movie?.vote_average && movie?.vote_average !== 0) return "N/A";
  return movie.vote_average.toFixed(1);
}

function normalizeMovie(movie) {
  return {
    ...movie,
    media_type: "movie",
  };
}

function uniqueMovies(movies) {
  const seen = new Set();

  return movies.filter((movie) => {
    if (!movie?.id) return false;

    if (seen.has(movie.id)) return false;

    seen.add(movie.id);
    return true;
  });
}

async function fetchMovies(endpoint, page = 1, params = "") {
  const separator = endpoint.includes("?") ? "&" : "?";

  const response = await fetch(
    `${BASE_URL}${endpoint}${separator}api_key=${API_KEY}&language=en-US&page=${page}${params}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }

  const data = await response.json();

  return Array.isArray(data.results) ? data.results.map(normalizeMovie) : [];
}

function MovieRow({ section, movies }) {
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
  }, [updateButtons, movies.length]);

  const slide = (direction) => {
    const row = rowRef.current;

    if (!row) return;

    row.scrollBy({
      left: direction * Math.round(row.clientWidth * 0.82),
      behavior: "smooth",
    });
  };

  if (!movies.length) return null;

  return (
    <section className="movies-row-section">
      <div className="movies-section-header">
        <div>
          <span>{section.kicker}</span>
          <h2>{section.title}</h2>
        </div>

        <div className="movies-section-actions">
          {section.viewAllPath && (
            <Link to={section.viewAllPath} className="movies-view-all">
              View all
              <i className="bx bx-chevron-right"></i>
            </Link>
          )}

          <div className="movies-row-controls">
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

      <div className="movies-horizontal-row" ref={rowRef}>
        {movies.map((movie, index) => (
          <MovieCard
            key={`${section.id}-${movie.id}`}
            movie={movie}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

function Movies() {
  const [heroMovies, setHeroMovies] = useState([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [rowData, setRowData] = useState({});

  useEffect(() => {
    async function loadMoviesPage() {
      try {
        const [trending, upcoming] = await Promise.all([
          fetchMovies("/trending/movie/week", 1),
          fetchMovies("/movie/upcoming", 1),
        ]);

        const heroList = uniqueMovies([...trending, ...upcoming])
          .filter((movie) => movie.backdrop_path && movie.poster_path)
          .slice(0, 8);

        setHeroMovies(heroList);

        const rows = {};
        const usedMovieIds = new Set();

        for (const section of ROW_SECTIONS) {
          const pages = await Promise.all([
            fetchMovies(section.endpoint, 1, section.params || ""),
            fetchMovies(section.endpoint, 2, section.params || ""),
            fetchMovies(section.endpoint, 3, section.params || ""),
            fetchMovies(section.endpoint, 4, section.params || ""),
          ]);

          const filteredMovies = uniqueMovies(pages.flat())
            .filter((movie) => {
              if (!movie.poster_path) return false;
              if (usedMovieIds.has(movie.id)) return false;

              usedMovieIds.add(movie.id);
              return true;
            })
            .slice(0, 60);

          rows[section.id] = filteredMovies;
        }

        setRowData(rows);
      } catch (error) {
        console.error("Failed to load movies page:", error);
      }
    }

    loadMoviesPage();
  }, []);

  useEffect(() => {
    if (heroMovies.length <= 1) return;

    const interval = setInterval(() => {
      setActiveHeroIndex((prev) =>
        prev === heroMovies.length - 1 ? 0 : prev + 1
      );
    }, 9000);

    return () => clearInterval(interval);
  }, [heroMovies.length]);

  const activeHero = heroMovies[activeHeroIndex];

  const upNextMovies = useMemo(() => {
    if (!heroMovies.length) return [];

    return heroMovies
      .filter((_, index) => index !== activeHeroIndex)
      .slice(0, 4);
  }, [heroMovies, activeHeroIndex]);

  const heroBackground = useMemo(() => {
    if (!activeHero?.backdrop_path) return undefined;

    return {
      backgroundImage: `
        linear-gradient(
          90deg,
          rgba(0, 0, 0, 0.88) 0%,
          rgba(0, 0, 0, 0.76) 34%,
          rgba(0, 0, 0, 0.42) 62%,
          rgba(0, 0, 0, 0.86) 100%
        ),
        linear-gradient(
          180deg,
          rgba(0, 0, 0, 0.08) 0%,
          rgba(0, 0, 0, 0.88) 100%
        ),
        url(${BACKDROP_URL}${activeHero.backdrop_path})
      `,
    };
  }, [activeHero]);

  const goPrevHero = () => {
    setActiveHeroIndex((prev) =>
      prev === 0 ? heroMovies.length - 1 : prev - 1
    );
  };

  const goNextHero = () => {
    setActiveHeroIndex((prev) =>
      prev === heroMovies.length - 1 ? 0 : prev + 1
    );
  };

  const setActiveMovie = (movieId) => {
    const index = heroMovies.findIndex((movie) => movie.id === movieId);

    if (index !== -1) {
      setActiveHeroIndex(index);
    }
  };

  return (
    <main className="movies-page">
      {activeHero && (
        <section className="movies-hero-shell">
          <div className="movies-hero-heading">
            <span>Cinema Preview</span>
            <h1>Explore Movies</h1>
          </div>

          <div className="movies-hero-layout">
            <section className="movies-hero" style={heroBackground}>
              <button
                type="button"
                className="movies-hero-arrow movies-hero-arrow-left"
                onClick={goPrevHero}
                aria-label="Previous featured movie"
              >
                <i className="bx bx-chevron-left"></i>
              </button>

              <button
                type="button"
                className="movies-hero-arrow movies-hero-arrow-right"
                onClick={goNextHero}
                aria-label="Next featured movie"
              >
                <i className="bx bx-chevron-right"></i>
              </button>

              <div className="movies-hero-content">
                <span className="movies-kicker">
                  <i className="bx bxs-hot"></i>
                  Prestige Movies
                </span>

                <h2>{getTitle(activeHero)}</h2>

                <p>
                  {activeHero.overview ||
                    "Discover trending movies, new releases and hidden gems in one cinematic place."}
                </p>

                <div className="movies-hero-meta">
                  <span>
                    <i className="bx bxs-star"></i>
                    {getRating(activeHero)}
                  </span>

                  <span>{getYear(activeHero)}</span>
                  <span>Movie</span>
                  <span>HD</span>
                </div>

                <div className="movies-hero-actions">
                  <Link to={`/movie/${activeHero.id}`} className="movies-primary-btn">
                    <i className="bx bxs-right-arrow"></i>
                    Watch Now
                  </Link>

                  <Link to="/discover/" className="movies-secondary-btn">
                    <i className="bx bx-grid-alt"></i>
                    View more
                  </Link>
                </div>
              </div>
            </section>

            <aside className="movies-up-next-panel">
              <h2>Up Next</h2>

              <div className="movies-up-next-list">
                {upNextMovies.map((movie) => (
                  <button
                    key={movie.id}
                    className="movies-up-next-card"
                    type="button"
                    onClick={() => setActiveMovie(movie.id)}
                  >
                    {movie.poster_path && (
                      <img
                        src={`${POSTER_URL}${movie.poster_path}`}
                        alt={getTitle(movie)}
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                    <div>
                      <span className="movies-mini-play">
                        <i className="bx bx-play"></i>
                      </span>

                      <strong>{getTitle(movie)}</strong>
                      <small>Open movie details</small>

                      <span className="movies-up-next-rating">
                        <i className="bx bxs-star"></i>
                        {getRating(movie)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>
      )}

      <section className="movies-rows-wrap">
        {ROW_SECTIONS.map((section) => (
          <MovieRow
            key={section.id}
            section={section}
            movies={rowData[section.id] || []}
          />
        ))}
      </section>
    </main>
  );
}

export default Movies;