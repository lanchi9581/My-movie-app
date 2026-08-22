import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import "./MoviePlayerPage.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";

const RECENTLY_VIEWED_KEY = "prestige_recently_viewed";
const CONTINUE_WATCHING_KEY = "prestige_continue_watching";

const DOODSTREAM_MOVIE_IDS = {};

const HOSTS = [
  {
    id: "vidsrc",
    label: "VidSrc",
    note: "Best",
    type: "TMDB",
    needsImdb: false,
    needsDoodId: false,
    getUrl: ({ id }) => `https://vidsrc2.ru/embed/movie/${id}`,
  },
  {
    id: "vidlink",
    label: "VidLink",
    note: "Backup",
    type: "TMDB",
    needsImdb: false,
    needsDoodId: false,
    getUrl: ({ id }) => `https://vidlink.pro/movie/${id}`,
  },
  {
    id: "autoembed",
    label: "AutoEmbed",
    note: "Ad-Free",
    type: "TMDB",
    needsImdb: false,
    needsDoodId: false,
    getUrl: ({ id }) => `https://player.autoembed.app/embed/movie/${id}`,
  },

  {
    id: "hnembed",
    label: "HNEmbed",
    note: "Alternative",
    type: "TMDB",
    needsImdb: false,
    needsDoodId: false,
    getUrl: ({ id }) => `https://hnembed.cc/embed/movie/${id}`,
  },
  {
    id: "superembed",
    label: "SuperEmbed",
    note: "IMDb host",
    type: "IMDb",
    needsImdb: true,
    needsDoodId: false,
    getUrl: ({ imdbId }) => `https://multiembed.mov/?video_id=${imdbId}`,
  },
  {
    id: "godrive",
    label: "GoDrive",
    note: "IMDb backup",
    type: "IMDb",
    needsImdb: true,
    needsDoodId: false,
    getUrl: ({ imdbId }) => `https://godriveplayer.com/player.php?imdb=${imdbId}`,
  },
  {
    id: "doodstream",
    label: "DoodStream",
    note: "Manual code",
    type: "Manual",
    needsImdb: false,
    needsDoodId: true,
    getUrl: ({ doodId }) => `https://doodstream.com/e/${doodId}`,
  },
];

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

function saveStorageItem(key, item, limit = 12) {
  if (!item?.id) return;

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
    name: movie.title,
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

function MoviePlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [movie, setMovie] = useState(null);
  const [host, setHost] = useState("vidsrc");
  const [playerActive, setPlayerActive] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const trailerKey = searchParams.get("trailer");
  const doodId = DOODSTREAM_MOVIE_IDS[id];

  useEffect(() => {
    let cancelled = false;

    async function fetchMovie() {
      setLoading(true);

      try {
        const res = await fetch(
          `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`
        );

        const data = await res.json();

        if (!cancelled) {
          setMovie(data);
        }
      } catch (error) {
        console.error("Failed to fetch movie:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMovie();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!movie?.id) return;

    const storageItem = createMovieStorageItem(movie);

    saveStorageItem(RECENTLY_VIEWED_KEY, storageItem);

    if (!trailerKey) {
      saveStorageItem(CONTINUE_WATCHING_KEY, storageItem);
    }
  }, [movie, trailerKey]);

  useEffect(() => {
    setPlayerActive(false);
    setIframeKey((prev) => prev + 1);
  }, [host, id]);

  const selectedHost = useMemo(() => {
    return HOSTS.find((item) => item.id === host) || HOSTS[0];
  }, [host]);

  const embedSrc = useMemo(() => {
    if (trailerKey) {
      return `https://www.youtube.com/embed/${trailerKey}?autoplay=0&rel=0&modestbranding=1`;
    }

    if (!movie) return null;

    if (selectedHost.needsImdb && !movie.imdb_id) {
      return null;
    }

    if (selectedHost.needsDoodId && !doodId) {
      return null;
    }

    return selectedHost.getUrl({
      id,
      imdbId: movie.imdb_id,
      doodId,
    });
  }, [id, movie, selectedHost, trailerKey, doodId]);

  const backdrop = movie?.backdrop_path
    ? `${IMG_ORIGINAL}${movie.backdrop_path}`
    : "";

  const year = movie?.release_date ? movie.release_date.slice(0, 4) : "N/A";
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  function backToDetail() {
    navigate(`/movie/${id}`);
  }

  function reloadPlayer() {
    setIframeKey((prev) => prev + 1);
  }

  function playMovie() {
    if (movie?.id) {
      saveStorageItem(CONTINUE_WATCHING_KEY, createMovieStorageItem(movie));
    }

    setPlayerActive(true);
    setIframeKey((prev) => prev + 1);
  }

  function changeHost(nextHost) {
    if (nextHost === host) {
      setSourceOpen(false);
      return;
    }

    setHost(nextHost);
    setSourceOpen(false);
  }

  function isHostUnavailable(item) {
    if (item.needsImdb && !movie?.imdb_id) return true;
    if (item.needsDoodId && !doodId) return true;
    return false;
  }

  function unavailableMessage() {
    if (selectedHost.needsImdb && !movie?.imdb_id) {
      return "This Host needs IMDb ID, but this movie does not have one.";
    }

    if (selectedHost.needsDoodId && !doodId) {
      return "DoodStream needs a manual file code inside DOODSTREAM_MOVIE_IDS.";
    }

    return "This Host is currently unavailable.";
  }

  if (loading || !movie) {
    return (
      <main className="player-loading-page">
        <div className="player-spinner"></div>
        <p>Loading player...</p>
      </main>
    );
  }

  return (
    <main className={cinemaMode ? "player-page cinema-mode" : "player-page"}>
      <div
        className="player-bg"
        style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}
      />
      <div className="player-shade" />

      <section className="player-shell">
        <header className="watch-room-header">
          <button className="watch-pill-btn watch-back-btn" onClick={backToDetail}>
            <i className="bx bx-arrow-back"></i>
            <span>Back</span>
          </button>

          <div className="watch-title-block">
            <span>{trailerKey ? "Official Trailer" : "Now Watching"}</span>
            <h1>{movie.title}</h1>

            <div className="watch-meta">
              <small>{year}</small>
              <small>★ {rating}</small>
              {!trailerKey && <small>{selectedHost.label}</small>}
            </div>
          </div>

          <div className="watch-header-actions">
            {!trailerKey && (
              <button className="watch-pill-btn" onClick={reloadPlayer}>
                <i className="bx bx-refresh"></i>
                <span>Reload</span>
              </button>
            )}

            <button
              className="watch-pill-btn"
              onClick={() => setCinemaMode((prev) => !prev)}
            >
              <i className="bx bx-tv"></i>
              <span>{cinemaMode ? "Normal" : "Fullscreen"}</span>
            </button>
          </div>
        </header>
            
        <section className="watch-layout">
          <div className="watch-main">
            {cinemaMode && (
              <button
                className="cinema-exit-btn"
                onClick={() => setCinemaMode(false)}
              >
                <i className="bx bx-x"></i>
                <span>Exit fullscreen</span>
              </button>
            )}
            <div className="watch-player-card">
              {!embedSrc ? (
                <div className="player-message">
                  <i className="bx bx-error-circle"></i>
                  <h2>Player unavailable</h2>
                  <p>{unavailableMessage()}</p>
                </div>
              ) : trailerKey ? (
                <iframe
                  key={iframeKey}
                  className="movie-iframe"
                  src={embedSrc}
                  title={`${movie.title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                  frameBorder="0"
                />
              ) : playerActive ? (
                <iframe
                  key={iframeKey}
                  className="movie-iframe"
                  src={embedSrc}
                  title={`${selectedHost.label} Player`}
                  allow="fullscreen *; autoplay *; encrypted-media *; picture-in-picture *"
                  allowFullScreen
                  frameBorder="0"
                  referrerPolicy="origin"
                />
              ) : (
                <div className="watch-start-card">
                  <div className="watch-start-icon">
                    <i className="bx bx-play"></i>
                  </div>

                  <span>Ready to watch</span>
                  <h2>{movie.title}</h2>

                  <p>
                    Press play to load the selected Host. If it does not work,
                    change the host or reload the player.
                  </p>

                  <button onClick={playMovie}>
                    <i className="bx bx-play"></i>
                    Play movie
                  </button>

                  <small>
                    Selected Host: <strong>{selectedHost.label}</strong>
                  </small>
                </div>
              )}
            </div>

            {!trailerKey && (
              <div className="watch-underbar">
                <div className="watch-underbar-info">
                  <span className="watch-live-dot"></span>
                  <strong>{selectedHost.label}</strong>
                  <small>{selectedHost.note}</small>
                </div>

                <div className="watch-underbar-actions">
                  <button onClick={reloadPlayer}>
                    <i className="bx bx-refresh"></i>
                    Reload
                  </button>

                  <button onClick={() => setSourceOpen(true)}>
                    <i className="bx bx-slider-alt"></i>
                    Host
                  </button>
                </div>
              </div>
            )}
          </div>

          {!trailerKey && (
            <aside className={sourceOpen ? "watch-source-panel open" : "watch-source-panel"}>
              <div className="source-panel-head">
                <div>
                  <span>Streaming Host</span>
                  <h2>Choose host</h2>
                </div>

                <button onClick={() => setSourceOpen(false)}>
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <div className="selected-source-box">
                <span>Selected</span>
                <strong>{selectedHost.label}</strong>
                <p>{selectedHost.note}</p>
              </div>

              <div className="source-card-list">
                {HOSTS.map((item) => {
                  const unavailable = isHostUnavailable(item);

                  return (
                    <button
                      key={item.id}
                      className={item.id === host ? "source-card active" : "source-card"}
                      disabled={unavailable}
                      onClick={() => changeHost(item.id)}
                    >
                      <span>
                        <strong>{item.label}</strong>
                        <small>{unavailable ? "Unavailable" : item.note}</small>
                      </span>

                      <em>{item.type}</em>
                    </button>
                  );
                })}
              </div>

              <button className="load-source-btn" onClick={playMovie}>
                <i className="bx bx-play"></i>
                Load selected Host
              </button>
            </aside>
          )}
        </section>

        {!trailerKey && (
          <section className="watch-help-grid">
            <div>
              <i className="bx bx-refresh"></i>
              <strong>Black screen?</strong>
              <span>Reload or switch host.</span>
            </div>

            <div>
              <i className="bx bx-slider-alt"></i>
              <strong>Host problem?</strong>
              <span>Try VidLink, AutoEmbed or VidSrc.</span>
            </div>

            <div>
              <i className="bx bx-mobile-alt"></i>
              <strong>Mobile</strong>
              <span>Rotate phone for best player view.</span>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default MoviePlayerPage;