import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import "./MovieDetail.css";

import ShareButton from "./components/Fav-Share-Watch-Button/ShareButton";
import FavoriteButton from "./components/Fav-Share-Watch-Button/FavoriteButton";
import WatchLaterButton from "./components/Fav-Share-Watch-Button/WatchLaterButton";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";
const IMG_POSTER = "https://image.tmdb.org/t/p/w500";
const CAST_IMG = "https://image.tmdb.org/t/p/w185";

const RECENTLY_VIEWED_KEY = "prestige_recently_viewed";
const CONTINUE_WATCHING_KEY = "prestige_continue_watching";
const STORAGE_LIMIT = 15;

const FALLBACK_BACKDROP =
  "https://placehold.co/1280x720/070a12/ffffff?text=Prestige+Movies";

const FALLBACK_POSTER =
  "https://placehold.co/500x750/10131f/ffffff?text=No+Poster";

function readStorageList(key) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (parsed && typeof parsed === "object") return Object.values(parsed).filter(Boolean);

    return [];
  } catch {
    return [];
  }
}

function saveStorageItem(key, item, limit = STORAGE_LIMIT) {
  if (!item?.id || !item?.title) return;

  try {
    const storedItems = readStorageList(key);
    const type = item.media_type || "movie";

    const filteredItems = storedItems.filter((storedItem) => {
      const storedType = storedItem.media_type || "movie";
      return `${storedType}-${storedItem.id}` !== `${type}-${item.id}`;
    });

    const nextItems = [item, ...filteredItems].slice(0, limit);

    localStorage.setItem(key, JSON.stringify(nextItems));
  } catch {
    // Ignore localStorage errors.
  }
}

function createMovieStorageItem(movie) {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
    media_type: "movie",
    continue_path: `/movie/${movie.id}/watch`,
    continue_label: "Continue movie",
    viewed_at: new Date().toISOString(),
  };
}

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const movieUrl = window.location.href;
  const fromPath = location.state?.from || "/movies";
  const searchState = location.state?.searchState;

  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovieData() {
      setLoading(true);

      try {
        const [movieRes, creditsRes, videosRes] = await Promise.all([
          fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`),
          fetch(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}&language=en-US`),
          fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}&language=en-US`),
        ]);

        if (!movieRes.ok) {
          throw new Error("Movie not found");
        }

        const movieData = await movieRes.json();
        const creditsData = await creditsRes.json();
        const videosData = await videosRes.json();

        const trailer =
          videosData.results?.find(
            (video) => video.type === "Trailer" && video.site === "YouTube"
          ) ||
          videosData.results?.find((video) => video.site === "YouTube");

        setMovie(movieData);
        setCast(creditsData.cast?.slice(0, 12) || []);
        setTrailerKey(trailer?.key || null);

        if (movieData?.id && movieData?.title) {
          saveStorageItem(RECENTLY_VIEWED_KEY, createMovieStorageItem(movieData));
        }
      } catch (error) {
        console.error("Failed to fetch movie data:", error);
        setMovie(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMovieData();
  }, [id]);

  const handleBackClick = () => {
    navigate(fromPath, { state: { searchState } });
  };

  const playMovie = () => {
    if (movie?.id && movie?.title) {
      saveStorageItem(CONTINUE_WATCHING_KEY, createMovieStorageItem(movie));
    }

    navigate(`/movie/${id}/watch`);
  };

  const playTrailer = () => {
    if (!trailerKey) {
      alert("Trailer not available");
      return;
    }

    navigate(`/movie/${id}/watch?trailer=${trailerKey}`);
  };

  if (loading) {
    return (
      <main className="detail-loading">
        <div className="detail-loader"></div>
        <p>Loading movie...</p>
      </main>
    );
  }

  if (!movie) {
    return (
      <main className="detail-loading">
        <p>Movie not found.</p>
      </main>
    );
  }

  const backdrop = movie.backdrop_path
    ? `${IMG_ORIGINAL}${movie.backdrop_path}`
    : FALLBACK_BACKDROP;

  const poster = movie.poster_path
    ? `${IMG_POSTER}${movie.poster_path}`
    : FALLBACK_POSTER;

  const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : "N/A";

  const genres = movie.genres?.map((genre) => genre.name).join(", ") || "N/A";

  return (
    <>
      <Helmet>
        <title>{`${movie.title} (${year}) - Watch Online | Prestige Movies`}</title>

        <meta
          name="description"
          content={`Watch ${movie.title} online. View rating, release date, runtime, genres, trailer and cast on Prestige Movies.`}
        />

        <link
          rel="canonical"
          href={`https://prestige-movies.vercel.app/movie/${id}`}
        />
      </Helmet>

      <main className="movie-detail-page">
        <section className="movie-hero">
          <div
            className="movie-hero-bg"
            style={{ backgroundImage: `url(${backdrop})` }}
          />

          <div className="movie-hero-overlay" />

          <button
            className="detail-back-button"
            onClick={handleBackClick}
            aria-label="Go back"
          >
            <i className="bx bx-arrow-back"></i>
            <span>Back</span>
          </button>

          <div className="movie-hero-content">
            <div className="movie-poster-card" onClick={playMovie}>
              <img src={poster} alt={movie.title} />

              <div className="poster-play-overlay">
                <i className="bx bx-play"></i>
              </div>
            </div>

            <div className="movie-info-glass">
              <span className="detail-kicker">Prestige Movie</span>

              <h1>{movie.title}</h1>

              {movie.tagline && (
                <p className="movie-tagline">“{movie.tagline}”</p>
              )}

              <div className="movie-meta-row">
                <span>{year}</span>
                <span>⭐ {rating}</span>
                <span>{runtime}</span>
                <span>{movie.original_language?.toUpperCase()}</span>
              </div>

              <p className="movie-overview">
                {movie.overview || "No overview available."}
              </p>

              <div className="movie-genre-line">
                <i className="bx bx-category"></i>
                <span>{genres}</span>
              </div>

              <div className="detail-action-row">
                <button className="detail-primary-btn" onClick={playMovie}>
                  <i className="bx bx-play"></i>
                  Play Movie
                </button>

                <button className="detail-secondary-btn" onClick={playTrailer}>
                  <i className="bx bx-movie-play"></i>
                  Trailer
                </button>
              </div>

              <div className="detail-small-actions">
                <FavoriteButton
                  id={movie.id}
                  media_type="movie"
                  title={movie.title}
                  poster_path={movie.poster_path}
                  vote_average={movie.vote_average}
                />

                <WatchLaterButton
                  id={movie.id}
                  media_type="movie"
                  title={movie.title}
                  poster_path={movie.poster_path}
                  vote_average={movie.vote_average}
                />
                <ShareButton movieUrl={movieUrl} />
              </div>
            </div>
          </div>
        </section>

        <section className="movie-detail-sections">
          <div className="detail-panel">
            <h2>Movie Details</h2>

            <div className="detail-stats-grid">
              <div>
                <span>Release Date</span>
                <strong>{movie.release_date || "N/A"}</strong>
              </div>

              <div>
                <span>Rating</span>
                <strong>{rating} / 10</strong>
              </div>

              <div>
                <span>Runtime</span>
                <strong>{runtime}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{movie.status || "N/A"}</strong>
              </div>
            </div>
          </div>

          <div className="detail-panel">
            <h2>Top Cast</h2>

            {cast.length === 0 ? (
              <p className="empty-detail-text">Cast information not available.</p>
            ) : (
              <div className="cast-grid">
                {cast.map((actor) => (
                  <div className="cast-card" key={`${actor.id}-${actor.character}`}>
                    <img
                      src={
                        actor.profile_path
                          ? `${CAST_IMG}${actor.profile_path}`
                          : "https://placehold.co/185x278/10131f/ffffff?text=No+Photo"
                      }
                      alt={actor.name}
                    />

                    <div>
                      <strong>{actor.name}</strong>
                      <span>{actor.character || "Unknown role"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default MovieDetail;