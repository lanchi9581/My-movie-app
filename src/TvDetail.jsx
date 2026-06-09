import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import ShareButton from "./components/Fav-Share-Watch-Button/ShareButton";
import FavoriteButton from "./components/Fav-Share-Watch-Button/FavoriteButton";
import WatchLaterButton from "./components/Fav-Share-Watch-Button/WatchLaterButton";
import MovieCard from "./components/MovieCard/MovieCard";
import "./TvDetail.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";

const IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";
const IMG_BACKDROP = "https://image.tmdb.org/t/p/w1280";
const IMG_POSTER = "https://image.tmdb.org/t/p/w500";
const PROFILE_IMG = "https://image.tmdb.org/t/p/w185";
const LOGO_IMG = "https://image.tmdb.org/t/p/w185";

const RECENTLY_VIEWED_KEY = "prestige_recently_viewed";
const CONTINUE_WATCHING_KEY = "prestige_continue_watching";
const STORAGE_LIMIT = 15;
const MIN_RELATED_VOTES = 500;

const FALLBACK_BACKDROP =
  "https://placehold.co/1280x720/070a12/ffffff?text=Prestige+Series";

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
  if (!item?.id || !item?.name) return;

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
      ? `S${seasonNum} E${episodeNum}${episodeName ? ` · ${episodeName}` : ""}`
      : "Series details",
    viewed_at: new Date().toISOString(),
  };
}

function formatDate(date) {
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getRuntime(runtimes = []) {
  const runtime = runtimes.find(Boolean);
  return runtime ? `${runtime}m` : "N/A";
}

function normalizeTv(show) {
  return {
    ...show,
    media_type: "tv",
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
    .map(normalizeTv);
}

function TvDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const castScrollRef = useRef(null);
  const recommendedScrollRef = useRef(null);

  const fromPath = location.state?.from || "/series";
  const searchState = location.state?.searchState;
  const tvUrl = window.location.href;

  const [tvShow, setTvShow] = useState(null);
  const [credits, setCredits] = useState(null);
  const [videos, setVideos] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [seasons, setSeasons] = useState({});
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTvData() {
      setLoading(true);

      try {
        const [tvRes, creditsRes, videosRes, recommendationsRes] =
          await Promise.all([
            fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US`),
            fetch(`${BASE_URL}/tv/${id}/credits?api_key=${API_KEY}&language=en-US`),
            fetch(`${BASE_URL}/tv/${id}/videos?api_key=${API_KEY}&language=en-US`),
            fetch(
              `${BASE_URL}/tv/${id}/recommendations?api_key=${API_KEY}&language=en-US&page=1`
            ),
          ]);

        if (!tvRes.ok) {
          throw new Error("Series not found");
        }

        const tvData = await tvRes.json();
        const creditsData = await creditsRes.json();
        const videosData = await videosRes.json();
        const recommendationsData = await recommendationsRes.json();

        if (cancelled) return;

        setTvShow(tvData);
        setCredits(creditsData);
        setVideos(Array.isArray(videosData.results) ? videosData.results : []);
        setRecommendations(cleanRecommended(recommendationsData.results));

        if (tvData?.id && tvData?.name) {
          saveStorageItem(RECENTLY_VIEWED_KEY, createTvStorageItem(tvData));
        }

        const realSeasons =
          tvData.seasons?.filter((season) => season.season_number !== 0) || [];

        const firstSeason = realSeasons[0] || tvData.seasons?.[0];

        if (firstSeason) {
          const firstSeasonNumber = firstSeason.season_number;
          setSelectedSeason(firstSeasonNumber);

          const seasonRes = await fetch(
            `${BASE_URL}/tv/${id}/season/${firstSeasonNumber}?api_key=${API_KEY}&language=en-US`
          );

          const seasonData = await seasonRes.json();

          if (!cancelled) {
            setSeasons({
              [firstSeasonNumber]: seasonData.episodes || [],
            });
          }

          realSeasons
            .filter((season) => season.season_number !== firstSeasonNumber)
            .forEach(async (season) => {
              try {
                const res = await fetch(
                  `${BASE_URL}/tv/${id}/season/${season.season_number}?api_key=${API_KEY}&language=en-US`
                );

                const data = await res.json();

                if (!cancelled) {
                  setSeasons((prev) => ({
                    ...prev,
                    [season.season_number]: data.episodes || [],
                  }));
                }
              } catch (error) {
                console.error(`Failed to load season ${season.season_number}`, error);
              }
            });
        }
      } catch (error) {
        console.error("Failed to fetch TV show data:", error);

        if (!cancelled) {
          setTvShow(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTvData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const trailer = useMemo(() => {
    return (
      videos.find(
        (video) =>
          video.site === "YouTube" &&
          video.type === "Trailer" &&
          video.official
      ) ||
      videos.find(
        (video) => video.site === "YouTube" && video.type === "Trailer"
      ) ||
      videos.find((video) => video.site === "YouTube")
    );
  }, [videos]);

  const sortedSeasons = useMemo(() => {
    if (!tvShow?.seasons) return [];

    return [...tvShow.seasons].sort((a, b) => {
      if (a.season_number === 0) return 1;
      if (b.season_number === 0) return -1;
      return a.season_number - b.season_number;
    });
  }, [tvShow]);

  const selectedEpisodes =
    selectedSeason != null ? seasons[selectedSeason] || [] : [];

  const sortedEpisodes = useMemo(() => {
    return [...selectedEpisodes].sort((a, b) =>
      sortOrder === "asc"
        ? a.episode_number - b.episode_number
        : b.episode_number - a.episode_number
    );
  }, [selectedEpisodes, sortOrder]);

  const firstPlayableEpisode = sortedEpisodes.find(
    (episode) => !isEpisodeFuture(episode.air_date)
  );

  function handleBackClick() {
    navigate(fromPath, { state: { searchState } });
  }

  function goToEpisode(seasonNum, episodeNum) {
    if (!seasonNum || !episodeNum || !tvShow) return;

    const episodeItem = seasons[seasonNum]?.find(
      (item) => item.episode_number === episodeNum
    );

    saveStorageItem(
      CONTINUE_WATCHING_KEY,
      createTvStorageItem(tvShow, seasonNum, episodeNum, episodeItem?.name || "")
    );

    navigate(`/series/${id}/watch?season=${seasonNum}&episode=${episodeNum}`);
  }

  function goToTrailer() {
    if (!trailer?.key) {
      alert("Trailer not available");
      return;
    }

    navigate(`/series/${id}/watch?trailer=${trailer.key}`);
  }

  function scrollRow(ref, direction) {
    if (!ref.current) return;

    ref.current.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  }

  function isEpisodeFuture(airDate) {
    if (!airDate) return false;

    const today = new Date();
    const episodeDate = new Date(airDate);

    today.setHours(0, 0, 0, 0);
    episodeDate.setHours(0, 0, 0, 0);

    return episodeDate > today;
  }

  if (loading) {
    return (
      <main className="tv-detail-loading">
        <div className="tv-detail-spinner"></div>
        <p>Loading series...</p>
      </main>
    );
  }

  if (!tvShow) {
    return (
      <main className="tv-detail-loading">
        <p>Series not found.</p>
      </main>
    );
  }

  const backdrop = tvShow.backdrop_path
    ? `${IMG_ORIGINAL}${tvShow.backdrop_path}`
    : FALLBACK_BACKDROP;

  const backdropCard = tvShow.backdrop_path
    ? `${IMG_BACKDROP}${tvShow.backdrop_path}`
    : FALLBACK_BACKDROP;

  const poster = tvShow.poster_path
    ? `${IMG_POSTER}${tvShow.poster_path}`
    : FALLBACK_POSTER;

  const year = tvShow.first_air_date
    ? new Date(tvShow.first_air_date).getFullYear()
    : "N/A";

  const rating = tvShow.vote_average ? tvShow.vote_average.toFixed(1) : "N/A";
  const runtime = getRuntime(tvShow.episode_run_time);
  const cast = credits?.cast?.slice(0, 12) || [];
  const creators = tvShow.created_by?.map((creator) => creator.name).join(", ") || "N/A";
  const networks = tvShow.networks || [];
  const companies = tvShow.production_companies?.slice(0, 4) || [];
  const mainNetwork = networks[0]?.name || "N/A";
  const language = tvShow.original_language?.toUpperCase() || "N/A";

  return (
    <>
      <Helmet>
        <title>{`${tvShow.name} (${year}) - Watch Online | Prestige Movies`}</title>

        <meta
          name="description"
          content={`Watch ${tvShow.name} online. View rating, seasons, episodes, trailer, cast and recommendations on Prestige Movies.`}
        />

        <link
          rel="canonical"
          href={`https://prestige-movies.vercel.app/series/${id}`}
        />
      </Helmet>

      <main className="tv-detail-page">
        <section className="tv-detail-hero">
          <div
            className="tv-detail-bg"
            style={{ backgroundImage: `url(${backdrop})` }}
          />
          <div className="tv-detail-shade" />

          <div className="tv-detail-container">
            <button
              className="tv-back-button"
              type="button"
              onClick={handleBackClick}
              aria-label="Go back"
            >
              <i className="bx bx-arrow-back"></i>
              <span>Back</span>
            </button>

            <div className="tv-detail-hero-grid">
              <aside className="tv-poster-column">
                <button
                  type="button"
                  className="tv-poster-card"
                  onClick={() =>
                    goToEpisode(selectedSeason, firstPlayableEpisode?.episode_number)
                  }
                  disabled={!firstPlayableEpisode}
                  aria-label={`Start watching ${tvShow.name}`}
                >
                  <img src={poster} alt={tvShow.name} />

                  <span className="tv-poster-play">
                    <i className="bx bx-play"></i>
                  </span>
                </button>

                <div className="tv-poster-mini-stats">
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

              <section className="tv-main-copy">
                <span className="tv-kicker">
                  <i className="bx bxs-tv"></i>
                  Prestige Series
                </span>

                <h1>{tvShow.name}</h1>

                {tvShow.tagline && (
                  <p className="tv-tagline">“{tvShow.tagline}”</p>
                )}

                <div className="tv-meta-row">
                  <span>
                    <i className="bx bxs-calendar"></i>
                    {year}
                  </span>
                  <span>
                    <i className="bx bxs-star"></i>
                    {rating}
                  </span>
                  <span>
                    <i className="bx bxs-collection"></i>
                    {tvShow.number_of_seasons || 0} Seasons
                  </span>
                  <span>
                    <i className="bx bxs-videos"></i>
                    {tvShow.number_of_episodes || 0} Episodes
                  </span>
                  <span>
                    <i className="bx bx-world"></i>
                    {language}
                  </span>
                </div>

                <div className="tv-genre-pills">
                  {tvShow.genres?.length ? (
                    tvShow.genres.map((genre) => (
                      <span key={genre.id}>{genre.name}</span>
                    ))
                  ) : (
                    <span>Genre unavailable</span>
                  )}
                </div>

                <p className="tv-overview">
                  {tvShow.overview || "No overview available for this series."}
                </p>

                <div className="tv-action-row">
                  <button
                    className="tv-primary-btn"
                    type="button"
                    onClick={() =>
                      goToEpisode(selectedSeason, firstPlayableEpisode?.episode_number)
                    }
                    disabled={!firstPlayableEpisode}
                  >
                    <i className="bx bx-play"></i>
                    Start Watching
                  </button>

                  <button
                    className="tv-secondary-btn"
                    type="button"
                    onClick={goToTrailer}
                    disabled={!trailer?.key}
                  >
                    <i className="bx bx-movie-play"></i>
                    Watch Trailer
                  </button>
                </div>

                <div className="tv-small-actions">
                  <FavoriteButton
                    id={tvShow.id}
                    media_type="tv"
                    title={tvShow.name}
                    poster_path={tvShow.poster_path}
                    vote_average={tvShow.vote_average}
                  />

                  <WatchLaterButton
                    id={tvShow.id}
                    media_type="tv"
                    title={tvShow.name}
                    poster_path={tvShow.poster_path}
                    vote_average={tvShow.vote_average}
                  />

                  <ShareButton movieUrl={tvUrl} />
                </div>
              </section>

              <aside className="tv-side-card">
                <div
                  className="tv-side-backdrop"
                  style={{ backgroundImage: `url(${backdropCard})` }}
                />

                <div className="tv-side-card-content">
                  <span>Quick Info</span>

                  <div>
                    <i className="bx bxs-calendar"></i>
                    <strong>{formatDate(tvShow.first_air_date)}</strong>
                    <p>First Air Date</p>
                  </div>

                  <div>
                    <i className="bx bxs-tv"></i>
                    <strong>{tvShow.status || "N/A"}</strong>
                    <p>Status</p>
                  </div>

                  <div>
                    <i className="bx bxs-collection"></i>
                    <strong>{tvShow.number_of_seasons || 0}</strong>
                    <p>Seasons</p>
                  </div>

                  <div>
                    <i className="bx bxs-videos"></i>
                    <strong>{tvShow.number_of_episodes || 0}</strong>
                    <p>Episodes</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="tv-detail-content">
          <div className="tv-panel tv-story-panel">
            <div className="tv-panel-heading">
              <span>Story</span>
              <h2>About This Series</h2>
            </div>

            <div className="tv-story-grid">
              <div>
                <i className="bx bxs-user-voice"></i>
                <span>Creator</span>
                <strong>{creators}</strong>
              </div>

              <div>
                <i className="bx bxs-file"></i>
                <span>Original Name</span>
                <strong>{tvShow.original_name || tvShow.name}</strong>
              </div>

              <div>
                <i className="bx bxs-line-chart"></i>
                <span>Popularity</span>
                <strong>{Math.round(tvShow.popularity || 0)}</strong>
              </div>

              <div>
                <i className="bx bxs-user-check"></i>
                <span>Votes</span>
                <strong>{tvShow.vote_count || 0}</strong>
              </div>
            </div>
          </div>

          {(companies.length > 0 || networks.length > 0) && (
            <div className="tv-panel tv-companies-panel">
              <div className="tv-panel-heading">
                <span>Production</span>
                <h2>Studios</h2>
              </div>

              <div className="tv-company-grid">
                {[...networks, ...companies].slice(0, 4).map((company) => (
                  <div className="tv-company-card" key={`${company.id}-${company.name}`}>
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
                    <span>{company.origin_country || "Network"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="tv-panel tv-cast-panel">
            <div className="tv-panel-heading tv-panel-heading-row">
              <div>
                <span>Actors</span>
                <h2>Top Cast</h2>
              </div>

              <div className="tv-panel-controls">
                <p>{cast.length} featured cast members</p>

                <div className="tv-row-arrows">
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
              <p className="tv-empty-text">No cast information available.</p>
            ) : (
              <div className="tv-cast-slider" ref={castScrollRef}>
                {cast.map((actor) => (
                  <article className="tv-cast-card" key={`${actor.id}-${actor.character}`}>
                    {actor.profile_path ? (
                      <img
                        src={`${PROFILE_IMG}${actor.profile_path}`}
                        alt={actor.name}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="tv-cast-placeholder">
                        <i className="bx bx-user"></i>
                      </div>
                    )}

                    <div>
                      <strong>{actor.name}</strong>
                      <span>{actor.character || "Unknown role"}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="tv-panel tv-episodes-panel">
            <div className="tv-panel-heading tv-panel-heading-row">
              <div>
                <span>Episodes</span>
                <h2>Watch Episodes</h2>
              </div>

              <div className="tv-episode-controls">
                <label>
                  Season
                  <select
                    value={selectedSeason ?? ""}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  >
                    {sortedSeasons.map((season) => (
                      <option key={season.id} value={season.season_number}>
                        {season.season_number === 0
                          ? "Bonus"
                          : `Season ${season.season_number}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Sort
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="tv-episode-list">
              {sortedEpisodes.length > 0 ? (
                sortedEpisodes.map((episode) => {
                  const future = isEpisodeFuture(episode.air_date);

                  return (
                    <button
                      key={episode.id}
                      className={future ? "tv-episode-card disabled" : "tv-episode-card"}
                      type="button"
                      onClick={() =>
                        goToEpisode(selectedSeason, episode.episode_number)
                      }
                      disabled={future}
                    >
                      <div className="tv-episode-number">
                        Ep {episode.episode_number}
                      </div>

                      <div className="tv-episode-info">
                        <strong>{episode.name || "Untitled episode"}</strong>
                        <span>
                          {future
                            ? `Coming soon: ${formatDate(episode.air_date)}`
                            : `Released: ${formatDate(episode.air_date)}`}
                        </span>
                      </div>

                      <i className="bx bx-play-circle"></i>
                    </button>
                  );
                })
              ) : (
                <p className="tv-empty-text">No episodes found for this season.</p>
              )}
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="tv-panel tv-recommendations-panel">
              <div className="tv-panel-heading tv-panel-heading-row">
                <div>
                  <span>Recommended</span>
                  <h2>More Like This</h2>
                </div>

                <div className="tv-panel-controls">
                  <p>Based on ratings & viewer votes</p>

                  <div className="tv-row-arrows">
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

              <div className="tv-movie-row" ref={recommendedScrollRef}>
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

export default TvDetail;