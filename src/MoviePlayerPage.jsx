import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import "./MoviePlayerPage.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";
const BACKDROP_URL = "https://image.tmdb.org/t/p/original";

const HOSTS = [
  {
    id: "vidlink",
    label: "VidLink",
    note: "Best",
    needsImdb: false,
    getUrl: ({ id }) => `https://vidlink.pro/movie/${id}`,
  },
  {
    id: "vidsrc",
    label: "VidSrc",
    note: "Backup",
    needsImdb: false,
    getUrl: ({ id }) => `https://vsembed.su/embed/movie/${id}`,
  },
  {
    id: "hnembed",
    label: "HNEmbed",
    note: "Backup",
    needsImdb: false,
    getUrl: ({ id }) => `https://hnembed.cc/embed/movie/${id}`,
  },
  {
    id: "superembed",
    label: "SuperEmbed",
    note: "IMDb",
    needsImdb: true,
    getUrl: ({ imdbId }) => `https://multiembed.mov/?video_id=${imdbId}`,
  },
  {
    id: "godrive",
    label: "GoDrive",
    note: "IMDb",
    needsImdb: true,
    getUrl: ({ imdbId }) => `https://godriveplayer.com/player.php?imdb=${imdbId}`,
  },
  {
    id: "autoembed",
    label: "AutoEmbed",
    note: "Ad-Free",
    needsImdb: false,
    getUrl: ({ id }) => `https://player.autoembed.app/embed/movie/${id}`,
  },
];

function MoviePlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [movie, setMovie] = useState(null);
  const [host, setHost] = useState("vidlink");
  const [playerActive, setPlayerActive] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const trailerKey = searchParams.get("trailer");

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
      } catch (err) {
        console.error("Failed to fetch movie:", err);
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

    return selectedHost.getUrl({
      id,
      imdbId: movie.imdb_id,
    });
  }, [id, movie, selectedHost, trailerKey]);

  const backdrop = movie?.backdrop_path
    ? `${BACKDROP_URL}${movie.backdrop_path}`
    : "";

  const releaseYear = movie?.release_date
    ? new Date(movie.release_date).getFullYear()
    : "Movie";

  const rating = movie?.vote_average
    ? movie.vote_average.toFixed(1)
    : "N/A";

  const handleBackClick = () => {
    navigate(`/movie/${id}`);
  };

  const changeHost = (hostId) => {
    if (hostId === host) return;

    setHost(hostId);
  };

  const refreshPlayer = () => {
    setIframeKey((prev) => prev + 1);
  };

  const activatePlayer = () => {
    setPlayerActive(true);
    setIframeKey((prev) => prev + 1);
  };

  if (loading || !movie) {
    return (
      <main className="player-loading-page">
        <div className="player-spinner"></div>
        <p>Loading player...</p>
      </main>
    );
  }

  return (
    <main className="player-page">
      <div
        className="player-bg"
        style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}
      />

      <div className="player-bg-overlay" />

      <section className="player-shell">
        <div className="player-topbar">
          <button className="player-back-btn" onClick={handleBackClick}>
            <i className="bx bx-arrow-back"></i>
            <span>Back</span>
          </button>

          <div className="player-title-block">
            <span>{trailerKey ? "Official Trailer" : "Now Playing"}</span>
            <h1>{movie.title}</h1>

            <div className="player-meta-line">
              <small>{releaseYear}</small>
              <small>★ {rating}</small>
              {!trailerKey && <small>{selectedHost.label}</small>}
            </div>
          </div>

          {!trailerKey && (
            <button className="player-refresh-btn" onClick={refreshPlayer}>
              <i className="bx bx-refresh"></i>
              <span>Reload</span>
            </button>
          )}
        </div>

        {!trailerKey && (
          <div className="host-panel">
            <div className="host-panel-text">
              <strong>Streaming host</strong>
              <span>
                If the player does not work well, change host or press reload.
              </span>
            </div>

            <div className="host-buttons">
              {HOSTS.map((item) => {
                const disabled = item.needsImdb && !movie.imdb_id;

                return (
                  <button
                    key={item.id}
                    className={host === item.id ? "host-btn active" : "host-btn"}
                    onClick={() => changeHost(item.id)}
                    disabled={disabled}
                    title={disabled ? "IMDb ID not available" : item.label}
                  >
                    <strong>{item.label}</strong>
                    <span>{disabled ? "Unavailable" : item.note}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="player-frame-card">
          {!embedSrc ? (
            <div className="player-message">
              <i className="bx bx-error-circle"></i>
              <h2>Player unavailable</h2>
              <p>This host needs an IMDb ID, but this movie does not have one.</p>
            </div>
          ) : trailerKey ? (
            <iframe
              key={iframeKey}
              className="movie-iframe active"
              src={embedSrc}
              title={`${movie.title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              frameBorder="0"
            />
          ) : playerActive ? (
            <iframe
              key={iframeKey}
              className="movie-iframe active"
              src={embedSrc}
              title={`${selectedHost.label} Player`}
              allow="fullscreen *; autoplay *; encrypted-media *; picture-in-picture *"
              allowFullScreen
              frameBorder="0"
              referrerPolicy="origin"
            />
          ) : (
        <div className="safe-player-card">
          <div className="safe-icon">
            <i className="bx bx-play-circle"></i>
          </div>

          <span className="safe-kicker">Ready to watch</span>

          <h2>{movie.title}</h2>

          <p>
            The player loads only after clicking to reduce unwanted popups and redirects.
          </p>

          <button onClick={activatePlayer}>
            <i className="bx bx-play"></i>
            Play now
          </button>

          <span>
            Host: <strong>{selectedHost.label}</strong>
          </span>
        </div>
          )}
        </div>

        {!trailerKey && (
          <div className="player-help">
            <div>
              <strong>Black screen?</strong>
              <span>Try another host or reload.</span>
            </div>

            <div>
              <strong>Fullscreen?</strong>
              <span>Some hosts block it inside iframe.</span>
            </div>

            <div>
              <strong>Mobile</strong>
              <span>Rotate your phone for best view.</span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default MoviePlayerPage;