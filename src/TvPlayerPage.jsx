import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import "./TvPlayerPage.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";

const RECENTLY_VIEWED_KEY = "prestige_recently_viewed";
const CONTINUE_WATCHING_KEY = "prestige_continue_watching";

const HOSTS = [
  {
    id: "vidsrc",
    label: "VidSrc",
    note: "Best",
    type: "TMDB",
    needsImdb: false,
    getUrl: ({ id, season, episode }) =>
      `https://vidsrc-embed.ru/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
  },
  {
    id: "vidlink",
    label: "VidLink",
    note: "Recommended",
    type: "TMDB",
    needsImdb: false,
    getUrl: ({ id, season, episode }) =>
      `https://vidlink.pro/tv/${id}/${season}/${episode}`,
  },
  {
    id: "autoembed",
    label: "AutoEmbed",
    note: "Ad Free",
    type: "TMDB",
    needsImdb: false,
    getUrl: ({ id, season, episode }) =>
      `https://player.autoembed.app/embed/tv/${id}/${season}/${episode}`,
  },
  {
    id: "hnembed",
    label: "HNEmbed",
    note: "Alternative",
    type: "TMDB",
    needsImdb: false,
    getUrl: ({ id, season, episode }) =>
      `https://hnembed.cc/embed/tv/${id}/${season}/${episode}`,
  },
  {
    id: "superembed",
    label: "SuperEmbed",
    note: "IMDb",
    type: "IMDb",
    needsImdb: true,
    getUrl: ({ imdbId, season, episode }) =>
      `https://multiembed.mov/?video_id=${imdbId}&s=${season}&e=${episode}`,
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
    const type = item.media_type || "tv";

    const filteredItems = storedItems.filter((storedItem) => {
      const storedType = storedItem.media_type || "movie";
      return `${storedType}-${storedItem.id}` !== `${type}-${item.id}`;
    });

    localStorage.setItem(key, JSON.stringify([item, ...filteredItems].slice(0, limit)));
  } catch {
    // Ignore localStorage errors.
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
      ? `Continue S${seasonNum} E${episodeNum}${episodeName ? ` · ${episodeName}` : ""}`
      : "Series details",
    viewed_at: new Date().toISOString(),
  };
}

function formatEpisodeCode(season, episode) {
  return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}

function formatDate(date) {
  if (!date) return "Air date N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function isEpisodeFuture(airDate) {
  if (!airDate) return false;

  const today = new Date();
  const episodeDate = new Date(airDate);

  today.setHours(0, 0, 0, 0);
  episodeDate.setHours(0, 0, 0, 0);

  return episodeDate > today;
}

function CustomDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeOption = options.find((item) => String(item.value) === String(value));

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div className={open ? "series-custom-select open" : "series-custom-select"} ref={dropdownRef}>
      <span>{label}</span>

      <button type="button" className="series-custom-trigger" onClick={() => setOpen((prev) => !prev)}>
        <strong>{activeOption?.label || "Select"}</strong>
        <i className={open ? "bx bx-chevron-up" : "bx bx-chevron-down"}></i>
      </button>

      {open && (
        <div className="series-custom-options">
          {options.map((item) => (
            <button
              key={item.value}
              type="button"
              className={String(item.value) === String(value) ? "active" : ""}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                onChange(item.value);
                setOpen(false);
              }}
            >
              <strong>{item.label}</strong>
              {item.meta && <small>{item.meta}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
  const [host, setHost] = useState("vidsrc");
  const [playerActive, setPlayerActive] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [episodeOpen, setEpisodeOpen] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchTvShow() {
      setLoading(true);

      try {
        const res = await fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US`);
        const data = await res.json();

        if (!cancelled) {
          setTvShow(data);
        }
      } catch (error) {
        console.error("Failed to fetch TV show:", error);
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
    if (trailerKey) return undefined;

    let cancelled = false;

    async function fetchSeason() {
      try {
        const res = await fetch(
          `${BASE_URL}/tv/${id}/season/${season}?api_key=${API_KEY}&language=en-US`
        );

        const data = await res.json();

        if (!cancelled) {
          setSeasonData(data);
        }
      } catch (error) {
        console.error("Failed to fetch season:", error);

        if (!cancelled) {
          setSeasonData(null);
        }
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

  const realSeasons = useMemo(() => {
    if (!tvShow?.seasons) return [];

    return tvShow.seasons
      .filter((item) => item.season_number !== 0)
      .sort((a, b) => a.season_number - b.season_number);
  }, [tvShow]);

  const episodes = useMemo(() => {
    return Array.isArray(seasonData?.episodes) ? seasonData.episodes : [];
  }, [seasonData]);

  const currentEpisode = useMemo(() => {
    return episodes.find((item) => item.episode_number === episode);
  }, [episodes, episode]);

  const currentEpisodeName = currentEpisode?.name || "";
  const episodeCode = formatEpisodeCode(season, episode);

  const previousEpisode = useMemo(() => {
    const previousInSeason = episodes.find(
      (item) => item.episode_number === episode - 1 && !isEpisodeFuture(item.air_date)
    );

    if (previousInSeason) {
      return {
        season,
        episode: previousInSeason.episode_number,
      };
    }

    const previousSeason = realSeasons.filter((item) => item.season_number < season).at(-1);

    if (!previousSeason) return null;

    return {
      season: previousSeason.season_number,
      episode: previousSeason.episode_count || 1,
    };
  }, [episodes, episode, season, realSeasons]);

  const nextEpisode = useMemo(() => {
    const nextInSeason = episodes.find(
      (item) => item.episode_number === episode + 1 && !isEpisodeFuture(item.air_date)
    );

    if (nextInSeason) {
      return {
        season,
        episode: nextInSeason.episode_number,
      };
    }

    const nextSeason = realSeasons.find((item) => item.season_number > season);

    if (!nextSeason) return null;

    return {
      season: nextSeason.season_number,
      episode: 1,
    };
  }, [episodes, episode, season, realSeasons]);

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

  const backdrop = tvShow?.backdrop_path ? `${IMG_ORIGINAL}${tvShow.backdrop_path}` : "";
  const rating = tvShow?.vote_average ? tvShow.vote_average.toFixed(1) : "N/A";
  const year = tvShow?.first_air_date ? tvShow.first_air_date.slice(0, 4) : "N/A";

  const seasonOptions = realSeasons.map((item) => ({
    value: item.season_number,
    label: `Season ${item.season_number}`,
    meta: `${item.episode_count || 0} episodes`,
  }));

  const episodeOptions = episodes.map((item) => ({
    value: item.episode_number,
    label: `Episode ${item.episode_number}`,
    meta: item.name || formatDate(item.air_date),
    disabled: isEpisodeFuture(item.air_date),
  }));

  function backToDetail() {
    navigate(`/series/${id}`);
  }

  function reloadPlayer() {
    setIframeKey((prev) => prev + 1);
  }

  function activatePlayer() {
    if (tvShow?.id && !trailerKey) {
      saveStorageItem(
        CONTINUE_WATCHING_KEY,
        createTvStorageItem(tvShow, season, episode, currentEpisodeName)
      );
    }

    setPlayerActive(true);
    setIframeKey((prev) => prev + 1);
  }

  function goToEpisode(nextSeason, nextEpisode) {
    if (!nextSeason || !nextEpisode) return;

    navigate(`/series/${id}/watch?season=${nextSeason}&episode=${nextEpisode}`);

    setPlayerActive(false);
    setSourceOpen(false);
    setEpisodeOpen(false);
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
    return item.needsImdb && !tvShow?.imdb_id;
  }

  function unavailableMessage() {
    if (selectedHost.needsImdb && !tvShow?.imdb_id) {
      return "This Host needs IMDb ID, but this series does not have one.";
    }

    return "This Host is currently unavailable.";
  }

  if (loading || !tvShow) {
    return (
      <main className="series-player-loading">
        <div className="series-player-spinner"></div>
        <p>Loading player...</p>
      </main>
    );
  }

  return (
    <main className={cinemaMode ? "series-player-page cinema-mode" : "series-player-page"}>
      <div
        className="series-player-bg"
        style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}
      />
      <div className="series-player-shade" />

      <section className="series-player-shell">
        <header className="series-watch-header">
          <button className="series-pill-btn series-back-btn" onClick={backToDetail}>
            <i className="bx bx-arrow-back"></i>
            <span>Back</span>
          </button>

          <div className="series-title-block">
            <span>{trailerKey ? "Official Trailer" : "Now Watching"}</span>
            <h1>{tvShow.name}</h1>

            <div className="series-watch-meta">
              <small>{year}</small>
              <small>★ {rating}</small>
              {!trailerKey && <small>{episodeCode}</small>}
              {!trailerKey && <small>{selectedHost.label}</small>}
            </div>
          </div>

          <div className="series-header-actions">
            {!trailerKey && (
              <button className="series-pill-btn" onClick={reloadPlayer}>
                <i className="bx bx-refresh"></i>
                <span>Reload</span>
              </button>
            )}

            {!trailerKey && (
              <button className="series-pill-btn" onClick={() => setSourceOpen(true)}>
                <i className="bx bx-slider-alt"></i>
                <span>Hosts</span>
              </button>
            )}

            <button className="series-pill-btn" onClick={() => setCinemaMode((prev) => !prev)}>
              <i className="bx bx-tv"></i>
              <span>{cinemaMode ? "Normal" : "Fullscreen"}</span>
            </button>
          </div>
        </header>

        <section className="series-watch-layout">
          <div className="series-watch-main">
            {cinemaMode && (
              <button className="series-cinema-exit-btn" onClick={() => setCinemaMode(false)}>
                <i className="bx bx-x"></i>
                <span>Exit fullscreen</span>
              </button>
            )}

            <div className="series-player-card">
              {!embedSrc ? (
                <div className="series-player-message">
                  <i className="bx bx-error-circle"></i>
                  <h2>Player unavailable</h2>
                  <p>{unavailableMessage()}</p>
                </div>
              ) : trailerKey ? (
                <iframe
                  key={iframeKey}
                  className="series-iframe"
                  src={embedSrc}
                  title={`${tvShow.name} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                  frameBorder="0"
                />
              ) : playerActive ? (
                <iframe
                  key={iframeKey}
                  className="series-iframe"
                  src={embedSrc}
                  title={`${selectedHost.label} Player`}
                  allow="fullscreen *; autoplay *; encrypted-media *; picture-in-picture *"
                  allowFullScreen
                  frameBorder="0"
                  referrerPolicy="origin"
                />
              ) : (
                <div className="series-start-card">
                  <div className="series-start-icon">
                    <i className="bx bx-play"></i>
                  </div>

                  <span>Ready to watch</span>
                  <h2>{episodeCode}</h2>

                  <p>
                    {currentEpisode?.name
                      ? currentEpisode.name
                      : `Start watching ${tvShow.name}. If one host does not load, switch host or reload.`}
                  </p>

                  <button onClick={activatePlayer}>
                    <i className="bx bx-play"></i>
                    Play episode
                  </button>

                  <small>
                    Selected Host: <strong>{selectedHost.label}</strong>
                  </small>
                </div>
              )}
            </div>

            {!trailerKey && (
              <div className="series-underbar">
                <div className="series-underbar-info">
                  <span className="series-live-dot"></span>
                  <strong>{selectedHost.label}</strong>
                  <small>{selectedHost.note}</small>
                </div>

                <div className="series-underbar-actions">
                  <button
                    onClick={() => goToEpisode(previousEpisode?.season, previousEpisode?.episode)}
                    disabled={!previousEpisode}
                  >
                    <i className="bx bx-skip-previous"></i>
                    Previous
                  </button>

                  <button onClick={() => setEpisodeOpen(true)}>
                    <i className="bx bxs-videos"></i>
                    Episodes
                  </button>

                  <button
                    onClick={() => goToEpisode(nextEpisode?.season, nextEpisode?.episode)}
                    disabled={!nextEpisode}
                  >
                    <i className="bx bx-skip-next"></i>
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {!trailerKey && (
            <aside className="series-control-panel">
              <div className="series-panel-head">
                <div>
                  <span>Episode room</span>
                  <h2>{episodeCode}</h2>
                </div>
              </div>

              <div className="series-current-box">
                <span>Current episode</span>
                <strong>{currentEpisode?.name || "Episode title unavailable"}</strong>
                <p>{formatDate(currentEpisode?.air_date)}</p>
              </div>

              <div className="series-mini-nav">
                <button
                  onClick={() => goToEpisode(previousEpisode?.season, previousEpisode?.episode)}
                  disabled={!previousEpisode}
                >
                  <i className="bx bx-skip-previous"></i>
                  Previous
                </button>

                <button
                  onClick={() => goToEpisode(nextEpisode?.season, nextEpisode?.episode)}
                  disabled={!nextEpisode}
                >
                  Next
                  <i className="bx bx-skip-next"></i>
                </button>
              </div>

              <div className="series-select-row">
                <CustomDropdown
                  label="Season"
                  value={season}
                  options={seasonOptions}
                  onChange={(nextSeason) => goToEpisode(Number(nextSeason), 1)}
                />

                <CustomDropdown
                  label="Episode"
                  value={episode}
                  options={episodeOptions}
                  onChange={(nextEpisode) => goToEpisode(season, Number(nextEpisode))}
                />
              </div>

              <div className="series-source-block">
                <div className="series-panel-head compact">
                  <div>
                    <span>Streaming Host</span>
                    <h2>Choose host</h2>
                  </div>
                </div>

                <div className="series-source-list">
                  {HOSTS.map((item) => {
                    const unavailable = isHostUnavailable(item);

                    return (
                      <button
                        key={item.id}
                        className={item.id === host ? "series-source-card active" : "series-source-card"}
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

                <button className="series-load-source-btn" onClick={activatePlayer}>
                  <i className="bx bx-play"></i>
                  Load selected Host
                </button>
              </div>
            </aside>
          )}
        </section>

        {!trailerKey && (
          <section className="series-help-grid">
            <div>
              <i className="bx bx-refresh"></i>
              <strong>Black screen?</strong>
              <span>Reload or switch Host.</span>
            </div>

            <div>
              <i className="bx bxs-videos"></i>
              <strong>Episode controls</strong>
              <span>Jump between seasons and episodes.</span>
            </div>

            <div>
              <i className="bx bx-mobile-alt"></i>
              <strong>Mobile</strong>
              <span>Use Hosts or Episodes bottom sheet.</span>
            </div>
          </section>
        )}
      </section>

      {!trailerKey && (
        <>
          <aside className={sourceOpen ? "series-source-sheet open" : "series-source-sheet"}>
            <div className="series-sheet-head">
              <div>
                <span>Streaming Host</span>
                <h2>Choose host</h2>
              </div>

              <button onClick={() => setSourceOpen(false)}>
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div className="series-selected-source">
              <span>Selected</span>
              <strong>{selectedHost.label}</strong>
              <p>{selectedHost.note}</p>
            </div>

            <div className="series-source-list">
              {HOSTS.map((item) => {
                const unavailable = isHostUnavailable(item);

                return (
                  <button
                    key={item.id}
                    className={item.id === host ? "series-source-card active" : "series-source-card"}
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

            <button className="series-load-source-btn" onClick={activatePlayer}>
              <i className="bx bx-play"></i>
              Load selected Host
            </button>
          </aside>

          <aside className={episodeOpen ? "series-episode-sheet open" : "series-episode-sheet"}>
            <div className="series-sheet-head">
              <div>
                <span>Episodes</span>
                <h2>Season {season}</h2>
              </div>

              <button onClick={() => setEpisodeOpen(false)}>
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div className="series-select-row mobile-sheet-row">
              <CustomDropdown
                label="Season"
                value={season}
                options={seasonOptions}
                onChange={(nextSeason) => goToEpisode(Number(nextSeason), 1)}
              />
            </div>

            <div className="series-episode-list">
              {episodes.map((item) => {
                const active = item.episode_number === episode;
                const future = isEpisodeFuture(item.air_date);

                return (
                  <button
                    key={item.id}
                    className={active ? "series-episode-card active" : "series-episode-card"}
                    disabled={future}
                    onClick={() => goToEpisode(season, item.episode_number)}
                  >
                    <span>EP {item.episode_number}</span>
                    <strong>{item.name || "Untitled episode"}</strong>
                    <small>{future ? `Coming ${formatDate(item.air_date)}` : formatDate(item.air_date)}</small>
                  </button>
                );
              })}
            </div>
          </aside>
        </>
      )}
    </main>
  );
}

export default TvPlayerPage;