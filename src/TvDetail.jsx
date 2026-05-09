import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import ShareButton from "./components/ShareButton";
import "./TvDetail.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";
const BACKDROP_URL = "https://image.tmdb.org/t/p/original";
const POSTER_URL = "https://image.tmdb.org/t/p/w500";
const PROFILE_URL = "https://image.tmdb.org/t/p/w185";

function TvDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = location.state?.from || "/series";
  const searchState = location.state?.searchState;
  const tvUrl = window.location.href;

  const [tvShow, setTvShow] = useState(null);
  const [cast, setCast] = useState([]);
  const [trailerKey, setTrailerKey] = useState(null);
  const [seasons, setSeasons] = useState({});
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTvData() {
      setLoading(true);

      try {
        const [tvRes, creditsRes, videosRes] = await Promise.all([
          fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US`),
          fetch(`${BASE_URL}/tv/${id}/credits?api_key=${API_KEY}&language=en-US`),
          fetch(`${BASE_URL}/tv/${id}/videos?api_key=${API_KEY}&language=en-US`),
        ]);

        const tvData = await tvRes.json();
        const creditsData = await creditsRes.json();
        const videosData = await videosRes.json();

        if (cancelled) return;

        setTvShow(tvData);
        setCast(creditsData.cast?.slice(0, 12) || []);

        const trailer =
          videosData.results?.find(
            (video) =>
              video.site === "YouTube" &&
              video.type === "Trailer" &&
              video.official
          ) ||
          videosData.results?.find(
            (video) => video.site === "YouTube" && video.type === "Trailer"
          ) ||
          videosData.results?.find((video) => video.site === "YouTube");

        setTrailerKey(trailer?.key || null);

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
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTvData();

    return () => {
      cancelled = true;
    };
  }, [id]);

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

  const firstPlayableEpisode = sortedEpisodes[0];

  const handleBackClick = () => {
    navigate(fromPath, { state: { searchState } });
  };

  const goToEpisode = (seasonNum, episodeNum) => {
    if (!seasonNum || !episodeNum) return;
    navigate(`/series/${id}/watch?season=${seasonNum}&episode=${episodeNum}`);
  };

  const goToTrailer = () => {
    if (!trailerKey) return;
    navigate(`/series/${id}/watch?trailer=${trailerKey}`);
  };

  const isEpisodeFuture = (airDate) => {
    if (!airDate) return false;

    const today = new Date();
    const episodeDate = new Date(airDate);

    today.setHours(0, 0, 0, 0);
    episodeDate.setHours(0, 0, 0, 0);

    return episodeDate > today;
  };

  const formatDate = (date) => {
    if (!date) return "Date unknown";

    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading || !tvShow) {
    return (
      <main className="tv-detail-loading">
        <div className="tv-detail-spinner"></div>
        <p>Loading series...</p>
      </main>
    );
  }

  const backdrop = tvShow.backdrop_path
    ? `${BACKDROP_URL}${tvShow.backdrop_path}`
    : "";

  const poster = tvShow.poster_path ? `${POSTER_URL}${tvShow.poster_path}` : "";

  const year = tvShow.first_air_date
    ? new Date(tvShow.first_air_date).getFullYear()
    : "N/A";

  const rating = tvShow.vote_average ? tvShow.vote_average.toFixed(1) : "N/A";

  return (
    <main className="tv-detail-page">
      <section className="tv-hero">
        <div
          className="tv-hero-bg"
          style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}
        />

        <div className="tv-hero-overlay" />

        <button
          className="tv-back-button"
          type="button"
          onClick={handleBackClick}
          aria-label="Go back"
        >
          <i className="bx bx-arrow-back"></i>
          <span>Back</span>
        </button>

        <div className="tv-hero-layout">
          <div className="tv-poster-card">
            {poster ? (
              <img src={poster} alt={tvShow.name} />
            ) : (
              <div className="tv-poster-placeholder">
                <i className="bx bx-tv"></i>
              </div>
            )}

            <button
              className="tv-poster-play"
              type="button"
              onClick={() =>
                goToEpisode(selectedSeason, firstPlayableEpisode?.episode_number)
              }
              disabled={!firstPlayableEpisode}
            >
              <i className="bx bx-play"></i>
            </button>
          </div>

          <div className="tv-info-glass">
            <span className="tv-kicker">Prestige Series</span>

            <h1>{tvShow.name}</h1>

            <div className="tv-meta-row">
              <span>⭐ {rating}</span>
              <span>{year}</span>
              <span>{tvShow.number_of_seasons || 0} seasons</span>
              <span>{tvShow.number_of_episodes || 0} episodes</span>
            </div>

            <p className="tv-overview">
              {tvShow.overview || "No overview available for this series."}
            </p>

            <div className="tv-genres">
              {tvShow.genres?.map((genre) => (
                <span key={genre.id}>{genre.name}</span>
              ))}
            </div>

            <div className="tv-actions">
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
                disabled={!trailerKey}
              >
                <i className="bx bx-movie-play"></i>
                Trailer
              </button>

              <ShareButton movieUrl={tvUrl} />
            </div>
          </div>
        </div>
      </section>

      <section className="tv-detail-sections">
        <div className="tv-panel">
          <h2>Series Details</h2>

          <div className="tv-stats-grid">
            <div>
              <span>Status</span>
              <strong>{tvShow.status || "Unknown"}</strong>
            </div>

            <div>
              <span>First Air Date</span>
              <strong>{formatDate(tvShow.first_air_date)}</strong>
            </div>

            <div>
              <span>Last Air Date</span>
              <strong>{formatDate(tvShow.last_air_date)}</strong>
            </div>

            <div>
              <span>Language</span>
              <strong>{tvShow.original_language?.toUpperCase() || "N/A"}</strong>
            </div>
          </div>
        </div>

        <div className="tv-panel">
          <div className="tv-panel-header">
            <h2>Episodes</h2>

            <div className="tv-controls">
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

          <div className="episode-list">
            {sortedEpisodes.length > 0 ? (
              sortedEpisodes.map((episode) => {
                const future = isEpisodeFuture(episode.air_date);

                return (
                  <button
                    key={episode.id}
                    className={future ? "episode-card disabled" : "episode-card"}
                    type="button"
                    onClick={() =>
                      goToEpisode(selectedSeason, episode.episode_number)
                    }
                    disabled={future}
                  >
                    <div className="episode-number">Ep {episode.episode_number}</div>

                    <div className="episode-info">
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

        <div className="tv-panel">
          <h2>Top Cast</h2>

          {cast.length > 0 ? (
            <div className="tv-cast-grid">
              {cast.map((actor) => (
                <div className="tv-cast-card" key={actor.id}>
                  {actor.profile_path ? (
                    <img
                      src={`${PROFILE_URL}${actor.profile_path}`}
                      alt={actor.name}
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
                </div>
              ))}
            </div>
          ) : (
            <p className="tv-empty-text">No cast information available.</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default TvDetail;