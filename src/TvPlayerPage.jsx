import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import "./TvPlayerPage.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";
const BACKDROP_URL = "https://image.tmdb.org/t/p/original";

const RECENTLY_VIEWED_KEY = "prestige_recently_viewed";
const CONTINUE_WATCHING_KEY = "prestige_continue_watching";

const HOSTS = [
  {
    id: "vidlink",
    label: "VidLink",
    note: "Best",
    needsImdb: false,
    getUrl: ({ id, season, episode }) =>
      `https://vidlink.pro/tv/${id}/${season}/${episode}`,
  },
  {
    id: "vidsrc",
    label: "VidSrc",
    note: "Backup",
    needsImdb: false,
    getUrl: ({ id, season, episode }) =>
      `https://vidsrc-embed.ru/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
  },
  {
    id: "hnembed",
    label: "HNEmbed",
    note: "Backup",
    needsImdb: false,
    getUrl: ({ id, season, episode }) =>
      `https://hnembed.cc/embed/tv/${id}/${season}/${episode}`,
  },
  {
    id: "superembed",
    label: "SuperEmbed",
    note: "IMDb",
    needsImdb: true,
    getUrl: ({ imdbId, season, episode }) =>
      `https://multiembed.mov/?video_id=${imdbId}&s=${season}&e=${episode}`,
  },
  {
    id: "godrive",
    label: "GoDrive",
    note: "IMDb",
    needsImdb: true,
    getUrl: ({ imdbId, season, episode }) =>
      `https://godriveplayer.com/player.php?imdb=${imdbId}&season=${season}&episode=${episode}`,
  },
  {
    id: "autoembed",
    label: "AutoEmbed",
    note: "Ad-Free",
    needsImdb: false,
    getUrl: ({ id, season, episode }) =>
      `https://player.autoembed.app/embed/tv/${id}/${season}/${episode}`,
  },
];

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

function saveStorageItem(key, item, limit = 12) {
  if (!item?.id) return;

  try {
    const storedItems = readStorageList(key);
    const type = item.media_type || "tv";

    const filteredItems = storedItems.filter((storedItem) => {
      const storedType = storedItem.media_type || "movie";
      return `${storedType}-${storedItem.id}` !== `${type}-${item.id}`;
    });

    const nextItems = [item, ...filteredItems].slice(0, limit);

    localStorage.setItem(key, JSON.stringify(nextItems));
  } catch {
    // localStorage can fail in private/incognito mode.
  }
}

function createTvStorageItem(tvShow, seasonNum = null, episodeNum = null, episodeName = "") {
  const hasEpisode = Boolean(seasonNum && episodeNum);

  return {
    id: tvShow.id,
    title: tvShow.name,
    name: tvShow.name,
    overview: tvShow.overview,
    poster_path: tvShow.poster_path,
    backdrop_path: tvShow.backdrop_path,
    vote_average: tvShow.vote_average,
    first_air_date: tvShow.first_air_date,
    release_date: tvShow.first_air_date,
    media_type: "tv",
    continue_path: hasEpisode
      ? `/series/${tvShow.id}/watch?season=${seasonNum}&episode=${episodeNum}`
      : `/series/${tvShow.id}`,
    continue_label: hasEpisode
      ? `S${seasonNum} E${episodeNum}${episodeName ? ` · ${episodeName}` : ""}`
      : "Series details",
    viewed_at: new Date().toISOString(),
  };
}

function TvPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const season = Number(searchParams.get("season") || 1);
  const episode = Number(searchParams.get("episode") || 1);
  const trailerKey = searchParams.get("trailer");

  const [tvShow, setTvShow] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [host, setHost] = useState("vidlink");
  const [playerActive, setPlayerActive] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTvShow() {
      setLoading(true);

      try {
        const res = await fetch(
          `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US`
        );

        const data = await res.json();

        if (!cancelled) {
          setTvShow(data);
        }
      } catch (err) {
        console.error("Failed to fetch TV show:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTvShow();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function fetchSeason() {
      if (trailerKey) return;

      try {
        const res = await fetch(
          `${BASE_URL}/tv/${id}/season/${season}?api_key=${API_KEY}&language=en-US`
        );

        const data = await res.json();

        if (!cancelled) {
          setSeasonData(data);
        }
      } catch (err) {
        console.error("Failed to fetch season:", err);
      }
    }

    fetchSeason();

    return () => {
      cancelled = true;
    };
  }, [id, season, trailerKey]);

  useEffect(() => {
    setPlayerActive(false);
    setIframeKey((prev) => prev + 1);
  }, [host, season, episode, id]);

  const selectedHost = useMemo(() => {
    return HOSTS.find((item) => item.id === host) || HOSTS[0];
  }, [host]);

  const currentEpisode = useMemo(() => {
    return seasonData?.episodes?.find(
      (item) => item.episode_number === episode
    );
  }, [seasonData, episode]);

  const currentEpisodeName = currentEpisode?.name || "";

  useEffect(() => {
    if (!tvShow?.id) return;

    saveStorageItem(RECENTLY_VIEWED_KEY, createTvStorageItem(tvShow));

    if (!trailerKey) {
      saveStorageItem(
        CONTINUE_WATCHING_KEY,
        createTvStorageItem(tvShow, season, episode, currentEpisodeName)
      );
    }
  }, [tvShow, trailerKey, season, episode, currentEpisodeName]);

  const nextEpisode = useMemo(() => {
    if (!seasonData?.episodes?.length) return null;

    const nextInSeason = seasonData.episodes.find(
      (item) => item.episode_number === episode + 1
    );

    if (nextInSeason) {
      return {
        season,
        episode: nextInSeason.episode_number,
      };
    }

    const nextSeason = tvShow?.seasons?.find(
      (item) => item.season_number === season + 1
    );

    if (nextSeason) {
      return {
        season: season + 1,
        episode: 1,
      };
    }

    return null;
  }, [seasonData, episode, season, tvShow]);

  const embedSrc = useMemo(() => {
    if (trailerKey) {
      return `https://www.youtube.com/embed/${trailerKey}?autoplay=0&rel=0&modestbranding=1`;
    }

    if (!tvShow) return null;

    if (selectedHost.needsImdb && !tvShow.imdb_id) {
      return null;
    }

    return selectedHost.getUrl({
      id,
      imdbId: tvShow.imdb_id,
      season,
      episode,
    });
  }, [id, tvShow, selectedHost, season, episode, trailerKey]);

  const backdrop = tvShow?.backdrop_path
    ? `${BACKDROP_URL}${tvShow.backdrop_path}`
    : "";

  const rating = tvShow?.vote_average ? tvShow.vote_average.toFixed(1) : "N/A";

  const handleBackClick = () => {
    navigate(`/series/${id}`);
  };

  const changeHost = (hostId) => {
    if (hostId === host) return;
    setHost(hostId);
  };

  const refreshPlayer = () => {
    setIframeKey((prev) => prev + 1);
  };

  const activatePlayer = () => {
    if (tvShow?.id && !trailerKey) {
      saveStorageItem(
        CONTINUE_WATCHING_KEY,
        createTvStorageItem(tvShow, season, episode, currentEpisodeName)
      );
    }

    setPlayerActive(true);
    setIframeKey((prev) => prev + 1);
  };

  const goToNextEpisode = () => {
    if (!nextEpisode) return;

    navigate(
      `/series/${id}/watch?season=${nextEpisode.season}&episode=${nextEpisode.episode}`
    );

    setPlayerActive(false);
  };

  if (loading || !tvShow) {
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
            <span>
              {trailerKey
                ? "Official Trailer"
                : `Season ${season} • Episode ${episode}`}
            </span>

            <h1>{tvShow.name}</h1>

            <div className="player-meta-line">
              <small>★ {rating}</small>
              {!trailerKey && <small>{selectedHost.label}</small>}
              {!trailerKey && currentEpisode?.name && (
                <small>{currentEpisode.name}</small>
              )}
            </div>
          </div>

          {!trailerKey && (
            <div className="tv-player-top-actions">
              <button className="player-refresh-btn" onClick={refreshPlayer}>
                <i className="bx bx-refresh"></i>
                <span>Reload</span>
              </button>

              <button
                className="tv-next-episode-btn"
                onClick={goToNextEpisode}
                disabled={!nextEpisode}
              >
                <i className="bx bx-skip-next"></i>
                <span>
                  {nextEpisode
                    ? `Next S${nextEpisode.season} E${nextEpisode.episode}`
                    : "No Next"}
                </span>
              </button>
            </div>
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
                const disabled = item.needsImdb && !tvShow.imdb_id;

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
              <p>This host needs an IMDb ID, but this series does not have one.</p>
            </div>
          ) : trailerKey ? (
            <iframe
              key={iframeKey}
              className="movie-iframe active"
              src={embedSrc}
              title={`${tvShow.name} Trailer`}
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
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              webkitallowfullscreen="true"
              mozallowfullscreen="true"
              frameBorder="0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="safe-player-card">
              <div className="safe-icon">
                <i className="bx bx-play-circle"></i>
              </div>

              <span className="safe-kicker">Ready to watch</span>

              <h2>{tvShow.name}</h2>

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
              <strong>Current episode</strong>
              <span>
                S{season} E{episode}
                {currentEpisode?.name ? ` — ${currentEpisode.name}` : ""}
              </span>
            </div>

            <div>
              <strong>Black screen?</strong>
              <span>Try another host or reload.</span>
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

export default TvPlayerPage;