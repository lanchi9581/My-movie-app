import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import "./MovieDetail.css";

import ShareButton from "./components/Fav-Share-Watch-Button/ShareButton";
import FavoriteButton from "./components/Fav-Share-Watch-Button/FavoriteButton";
import WatchLaterButton from "./components/Fav-Share-Watch-Button/WatchLaterButton";
import MovieCard from "./components/MovieCard/MovieCard";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";

const IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";
const IMG_BACKDROP = "https://image.tmdb.org/t/p/w1280";
const IMG_POSTER = "https://image.tmdb.org/t/p/w500";
const CAST_IMG = "https://image.tmdb.org/t/p/w185";
const LOGO_IMG = "https://image.tmdb.org/t/p/w185";

const RECENTLY_VIEWED_KEY = "prestige_recently_viewed";
const CONTINUE_WATCHING_KEY = "prestige_continue_watching";
const STORAGE_LIMIT = 15;
const MIN_RELATED_VOTES = 250;

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
    if (parsed && typeof parsed === "object") {
      return Object.values(parsed).filter(Boolean);
    }

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

function formatMoney(value) {
  if (!value || value <= 0) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRuntime(minutes) {
  if (!minutes) return "N/A";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;

  return `${hours}h ${mins}m`;
}

function formatDate(date) {
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getCertification(releaseDates) {
  const usRelease = releaseDates?.results?.find(
    (country) => country.iso_3166_1 === "US"
  );

  const certification = usRelease?.release_dates?.find(
    (release) => release.certification
  )?.certification;

  return certification || "NR";
}

function getDirector(crew = []) {
  return crew.find((member) => member.job === "Director")?.name || "N/A";
}

function getWriters(crew = []) {
  const writers = crew
    .filter((member) => ["Writer", "Screenplay", "Story"].includes(member.job))
    .map((member) => member.name);

  return [...new Set(writers)].slice(0, 3).join(", ") || "N/A";
}

function normalizeMovie(movie) {
  return {
    ...movie,
    media_type: "movie",
  };
}

function cleanRecommended(items) {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item.poster_path)
    .filter((item) => Number(item.vote_count || 0) >= MIN_RELATED_VOTES)
    .sort((a, b) => {
      const scoreA =
        Number(a.vote_average || 0) * Math.log10(Number(a.vote_count || 1));
      const scoreB =
        Number(b.vote_average || 0) * Math.log10(Number(b.vote_count || 1));

      return scoreB - scoreA;
    })
    .slice(0, 14)
    .map(normalizeMovie);
}

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const castScrollRef = useRef(null);
  const recommendedScrollRef = useRef(null);

  const movieUrl = window.location.href;
  const fromPath = location.state?.from || "/movies";
  const searchState = location.state?.searchState;

  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [videos, setVideos] = useState([]);
  const [releaseDates, setReleaseDates] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function fetchMovieData() {
      setLoading(true);

      try {
        const [
          movieRes,
          creditsRes,
          videosRes,
          releaseDatesRes,
          recommendationsRes,
        ] = await Promise.all([
          fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`),
          fetch(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}&language=en-US`),
          fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}&language=en-US`),
          fetch(`${BASE_URL}/movie/${id}/release_dates?api_key=${API_KEY}`),
          fetch(
            `${BASE_URL}/movie/${id}/recommendations?api_key=${API_KEY}&language=en-US&page=1`
          ),
        ]);

        if (!movieRes.ok) {
          throw new Error("Movie not found");
        }

        const movieData = await movieRes.json();
        const creditsData = await creditsRes.json();
        const videosData = await videosRes.json();
        const releaseDatesData = await releaseDatesRes.json();
        const recommendationsData = await recommendationsRes.json();

        if (ignore) return;

        setMovie(movieData);
        setCredits(creditsData);
        setVideos(Array.isArray(videosData.results) ? videosData.results : []);
        setReleaseDates(releaseDatesData);
        setRecommendations(cleanRecommended(recommendationsData.results));

        saveStorageItem(RECENTLY_VIEWED_KEY, createMovieStorageItem(movieData));
      } catch (error) {
        console.error("Failed to fetch movie data:", error);

        if (!ignore) {
          setMovie(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchMovieData();

    return () => {
      ignore = true;
    };
  }, [id]);

  const trailer = useMemo(() => {
    return (
      videos.find(
        (video) => video.type === "Trailer" && video.site === "YouTube"
      ) || videos.find((video) => video.site === "YouTube")
    );
  }, [videos]);

  function handleBackClick() {
    if (typeof fromPath === "number") {
      navigate(fromPath);
      return;
    }

    navigate(fromPath, { state: { searchState } });
  }

  function playMovie() {
    if (movie?.id && movie?.title) {
      saveStorageItem(CONTINUE_WATCHING_KEY, createMovieStorageItem(movie));
    }

    navigate(`/movie/${id}/watch`);
  }

  function playTrailer() {
    if (!trailer?.key) {
      alert("Trailer not available");
      return;
    }

    navigate(`/movie/${id}/watch?trailer=${trailer.key}`);
  }

  function scrollRow(ref, direction) {
    if (!ref.current) return;

    ref.current.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  }

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

  const backdropCard = movie.backdrop_path
    ? `${IMG_BACKDROP}${movie.backdrop_path}`
    : FALLBACK_BACKDROP;

  const poster = movie.poster_path
    ? `${IMG_POSTER}${movie.poster_path}`
    : FALLBACK_POSTER;

  const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
  const runtime = formatRuntime(movie.runtime);
  const genres = movie.genres || [];
  const cast = credits?.cast?.slice(0, 12) || [];
  const crew = credits?.crew || [];
  const director = getDirector(crew);
  const writers = getWriters(crew);
  const certification = getCertification(releaseDates);
  const language = movie.original_language?.toUpperCase() || "N/A";
  const companies = movie.production_companies?.slice(0, 4) || [];

  return (
    <>
      <Helmet>
        <title>{`${movie.title} (${year}) - Watch Online | Prestige Movies`}</title>

        <meta
          name="description"
          content={`Watch ${movie.title} online. View rating, release date, runtime, genres, trailer, cast and recommendations on Prestige Movies.`}
        />

        <link
          rel="canonical"
          href={`https://prestige-movies.vercel.app/movie/${id}`}
        />
      </Helmet>

      <main className="movie-detail-page">
        <section className="movie-detail-hero">
          <div
            className="movie-detail-bg"
            style={{ backgroundImage: `url(${backdrop})` }}
          />
          <div className="movie-detail-shade" />

          <div className="movie-detail-container">
            <button
              className="detail-back-button"
              type="button"
              onClick={handleBackClick}
              aria-label="Go back"
            >
              <i className="bx bx-arrow-back"></i>
              <span>Back</span>
            </button>

            <div className="movie-detail-hero-grid">
              <aside className="movie-poster-column">
                <button
                  type="button"
                  className="movie-poster-card"
                  onClick={playMovie}
                  aria-label={`Play ${movie.title}`}
                >
                  <img src={poster} alt={movie.title} />

                  <span className="poster-play-overlay">
                    <i className="bx bx-play"></i>
                  </span>
                </button>

                <div className="poster-mini-stats">
                  <div>
                    <span>Rating</span>
                    <strong>{rating}</strong>
                  </div>

                  <div>
                    <span>Year</span>
                    <strong>{year}</strong>
                  </div>
                </div>
              </aside>

              <section className="movie-main-copy">
                <span className="detail-kicker">
                  <i className="bx bxs-hot"></i>
                  Prestige Movie
                </span>

                <h1>{movie.title}</h1>

                {movie.tagline && (
                  <p className="movie-tagline">“{movie.tagline}”</p>
                )}

                <div className="movie-meta-row">
                  <span>
                    <i className="bx bxs-calendar"></i>
                    {year}
                  </span>
                  <span>
                    <i className="bx bxs-star"></i>
                    {rating}
                  </span>
                  <span>
                    <i className="bx bxs-time-five"></i>
                    {runtime}
                  </span>
                  <span>
                    <i className="bx bxs-certification"></i>
                    {certification}
                  </span>
                  <span>
                    <i className="bx bx-world"></i>
                    {language}
                  </span>
                </div>

                <div className="movie-genre-pills">
                  {genres.length ? (
                    genres.map((genre) => <span key={genre.id}>{genre.name}</span>)
                  ) : (
                    <span>Genre unavailable</span>
                  )}
                </div>

                <p className="movie-overview">
                  {movie.overview || "No overview available."}
                </p>

                <div className="detail-action-row">
                  <button className="detail-primary-btn" type="button" onClick={playMovie}>
                    <i className="bx bx-play"></i>
                    Play Movie
                  </button>

                  <button
                    className="detail-secondary-btn"
                    type="button"
                    onClick={playTrailer}
                  >
                    <i className="bx bx-movie-play"></i>
                    Watch Trailer
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
              </section>

              <aside className="movie-side-card">
                <div
                  className="side-backdrop"
                  style={{ backgroundImage: `url(${backdropCard})` }}
                />

                <div className="side-card-content">
                  <span>Quick Info</span>

                  <div>
                    <i className="bx bxs-calendar"></i>
                    <strong>{formatDate(movie.release_date)}</strong>
                    <p>Release Date</p>
                  </div>

                  <div>
                    <i className="bx bxs-movie-play"></i>
                    <strong>{movie.status || "N/A"}</strong>
                    <p>Status</p>
                  </div>

                  <div>
                    <i className="bx bxs-bank"></i>
                    <strong>{formatMoney(movie.budget)}</strong>
                    <p>Budget</p>
                  </div>

                  <div>
                    <i className="bx bxs-dollar-circle"></i>
                    <strong>{formatMoney(movie.revenue)}</strong>
                    <p>Revenue</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="movie-detail-content">
          <div className="detail-panel story-panel">
            <div className="panel-heading">
              <span>Story</span>
              <h2>About This Movie</h2>
            </div>

            <div className="story-grid">
              <div>
                <i className="bx bxs-user-voice"></i>
                <span>Director</span>
                <strong>{director}</strong>
              </div>

              <div>
                <i className="bx bxs-pencil"></i>
                <span>Writers</span>
                <strong>{writers}</strong>
              </div>

              <div>
                <i className="bx bxs-file"></i>
                <span>Original Title</span>
                <strong>{movie.original_title || movie.title}</strong>
              </div>

              <div>
                <i className="bx bxs-line-chart"></i>
                <span>Popularity</span>
                <strong>{Math.round(movie.popularity || 0)}</strong>
              </div>
            </div>
          </div>

          {companies.length > 0 && (
            <div className="detail-panel companies-panel">
              <div className="panel-heading">
                <span>Production</span>
                <h2>Studios</h2>
              </div>

              <div className="company-grid">
                {companies.map((company) => (
                  <div className="company-card" key={company.id}>
                    {company.logo_path ? (
                      <img
                        src={`${LOGO_IMG}${company.logo_path}`}
                        alt={company.name}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <i className="bx bxs-buildings"></i>
                    )}

                    <strong>{company.name}</strong>
                    <span>{company.origin_country || "Global"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-panel cast-panel">
            <div className="panel-heading panel-heading-row">
              <div>
                <span>Actors</span>
                <h2>Top Cast</h2>
              </div>

              <div className="panel-controls">
                <p>{cast.length} featured cast members</p>

                <div className="row-arrows">
                  <button
                    type="button"
                    onClick={() => scrollRow(castScrollRef, "left")}
                    aria-label="Scroll cast left"
                  >
                    <i className="bx bx-left-arrow-alt"></i>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollRow(castScrollRef, "right")}
                    aria-label="Scroll cast right"
                  >
                    <i className="bx bx-right-arrow-alt"></i>
                  </button>
                </div>
              </div>
            </div>

            {cast.length === 0 ? (
              <p className="empty-detail-text">Cast information not available.</p>
            ) : (
              <div className="cast-slider" ref={castScrollRef}>
                {cast.map((actor) => (
                  <article className="cast-card" key={`${actor.id}-${actor.character}`}>
                    <img
                      src={
                        actor.profile_path
                          ? `${CAST_IMG}${actor.profile_path}`
                          : "https://placehold.co/185x278/10131f/ffffff?text=No+Photo"
                      }
                      alt={actor.name}
                      loading="lazy"
                      decoding="async"
                    />

                    <div>
                      <strong>{actor.name}</strong>
                      <span>{actor.character || "Unknown role"}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {recommendations.length > 0 && (
            <div className="detail-panel recommendations-panel">
              <div className="panel-heading panel-heading-row">
                <div>
                  <span>Recommended</span>
                  <h2>More Like This</h2>
                </div>

                <div className="panel-controls">
                  <p>Based on ratings & viewer votes</p>

                  <div className="row-arrows">
                    <button
                      type="button"
                      onClick={() => scrollRow(recommendedScrollRef, "left")}
                      aria-label="Scroll recommendations left"
                    >
                      <i className="bx bx-left-arrow-alt"></i>
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollRow(recommendedScrollRef, "right")}
                      aria-label="Scroll recommendations right"
                    >
                      <i className="bx bx-right-arrow-alt"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="detail-movie-row" ref={recommendedScrollRef}>
                {recommendations.map((item, index) => (
                  <MovieCard key={item.id} movie={item} index={index + 8} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default MovieDetail;