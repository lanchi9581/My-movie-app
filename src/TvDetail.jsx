import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './MovieDetail.css';
import './index.css';
import ShareButton from './components/ShareButton';

const API_KEY = '36669667bad13a98c59f98b32ebb67f5';
const BASE_URL = 'https://api.themoviedb.org/3';
const BACKDROP_IMG_URL = 'https://image.tmdb.org/t/p/w780';

function TvDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const movieUrl = window.location.href;

  const fromPath = location.state?.from || '/series';
  const searchState = location.state?.searchState;

  const [tvShow, setTvShow] = useState(null);
  const [cast, setCast] = useState([]);
  const [trailerKey, setTrailerKey] = useState(null);
  const [seasons, setSeasons] = useState({});
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch TV show details and episodes
  useEffect(() => {
    const fetchTvData = async () => {
      try {
        const tvRes = await fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}`);
        const tvData = await tvRes.json();
        setTvShow(tvData);

        // Fetch cast
        const creditsRes = await fetch(`${BASE_URL}/tv/${id}/credits?api_key=${API_KEY}`);
        const creditsData = await creditsRes.json();
        setCast(creditsData.cast?.slice(0, 8) || []);

        // Fetch trailer
        const videosRes = await fetch(`${BASE_URL}/tv/${id}/videos?api_key=${API_KEY}`);
        const videosData = await videosRes.json();
        const trailer = videosData.results.find(
          (video) => video.type === 'Trailer' && video.site === 'YouTube'
        );
        setTrailerKey(trailer ? trailer.key : null);

        // Fetch episodes for each season
        if (tvData.seasons) {
          const seasonsObj = {};
          for (const season of tvData.seasons) {
            const sn = season.season_number;
            const epsRes = await fetch(`${BASE_URL}/tv/${id}/season/${sn}?api_key=${API_KEY}`);
            const epsData = await epsRes.json();
            seasonsObj[sn] = epsData.episodes || [];
          }
          setSeasons(seasonsObj);

          // Set first non-zero season as default selected
          const firstRealSeason = tvData.seasons.find((s) => s.season_number !== 0);
          setSelectedSeason(firstRealSeason ? firstRealSeason.season_number : 0);
        }
      } catch (error) {
        console.error('Failed to fetch TV show data:', error);
        setTrailerKey(null);
      }
    };

    fetchTvData();
  }, [id]);

  // Handle back navigation
  const handleBackClick = () => {
    navigate(fromPath, { state: { searchState } });
  };

  if (!tvShow) return <p>Loading…</p>;

  // Handle season dropdown change
  const handleSeasonChange = (e) => {
    setSelectedSeason(parseInt(e.target.value, 10));
  };

  // Handle sort order change
  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
  };

  // Episodes for selected season or empty array if none
  const episodes = selectedSeason != null ? seasons[selectedSeason] || [] : [];

  // Sort episodes according to selected order
  const sortedEpisodes = [...episodes].sort((a, b) =>
    sortOrder === 'asc' ? a.episode_number - b.episode_number : b.episode_number - a.episode_number
  );

  // Navigate to selected episode player
  const goToEpisode = (seasonNum, episodeNum) => {
    navigate(`/TvPlayerPage/${id}?season=${seasonNum}&episode=${episodeNum}`);
  };

  return (
    <>
      <button className="back-arrow-button" onClick={handleBackClick} aria-label="Go back">
        <svg xmlns="http://www.w3.org/2000/svg" width={55} height={55} fill="#ff3f3f" viewBox="0 0 24 24">
          <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2m5 11h-6.59l2.29 2.29-1.41 1.41-4.71-4.71 4.71-4.71 1.41 1.41-2.29 2.29H17v2Z" />
        </svg>
      </button>

      <div className="movie-detail-window">
        <h1 className="h1-5-redish">{tvShow.name}</h1>

        <div className="movie-top-section">
          <div
            className="movie-poster-container clickable-poster"
            onClick={() => goToEpisode(selectedSeason, sortedEpisodes[0]?.episode_number)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') goToEpisode(selectedSeason, sortedEpisodes[0]?.episode_number);
            }}
          >
            <img
              className={`landscape-poster ${!tvShow.backdrop_path ? 'fallback-poster' : ''}`}
              src={
                tvShow.backdrop_path
                  ? `${BACKDROP_IMG_URL}${tvShow.backdrop_path}`
                  : tvShow.poster_path
                  ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
                  : 'https://www.legrand.es/modules/custom/legrand_ecat/assets/img/no-image.png'
              }
              alt={tvShow.name}
            />
            <div className="play-icon-overlay">
              <i className="bx bx-play-circle" style={{ fontSize: '48px', color: 'white' }}></i>
            </div>
          </div>

          <div className="movie-info-panel">
            <p>
              <i className="bx bx-calendar" style={{ marginRight: '8px' }}></i>
              <strong>First Air Date:</strong> {tvShow.first_air_date}
            </p>
            <p>
              <i className="bx bx-star" style={{ marginRight: '8px', color: '#f5c518' }}></i>
              <strong>Rating:</strong> {tvShow.vote_average} / 10
            </p>
            <p>
              <i className="bx bx-category" style={{ marginRight: '8px' }}></i>
              <strong>Genres:</strong> {tvShow.genres?.map((g) => g.name).join(', ')}
            </p>

            <div className="action-buttons">
              <ShareButton movieUrl={movieUrl} />
            </div>

            <br />
            <hr />
            <h1 className="h3-redish">
              <strong>Watch now:</strong>
            </h1>
            <br />
            <div className="action-buttons2">
              <button
                className="pill-button2"
                onClick={() => {
                  if (trailerKey) {
                    navigate(`/TvPlayerPage/${id}?trailer=${trailerKey}`);
                  } else {
                    alert('Trailer not available');
                  }
                }}
              >
                <i className="bx bx-play-circle" style={{ marginRight: '6px' }}></i>
                Trailer
              </button>

              <button
                className="pill-button2"
                onClick={() => goToEpisode(selectedSeason, sortedEpisodes[0]?.episode_number)}
              >
                <i className="bx bx-play-circle" style={{ marginRight: '6px' }}></i>
                Start Watching
              </button>
            </div>
          </div>
        </div>

        {/* Episodes and Overview container */}
        <div className="episodes-overview-container">
          <div className="episodes-section pill">
            <h3 className="h3-redish">Episodes</h3>

            <div className="episode-controls" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              <label>
                Season:
                <select
                  value={selectedSeason ?? ''}
                  onChange={handleSeasonChange}
                  style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}
                >
                  {[...tvShow.seasons]
                    .sort((a, b) => {
                      // Put bonus (season 0) at the end
                      if (a.season_number === 0) return 1;
                      if (b.season_number === 0) return -1;
                      return a.season_number - b.season_number;
                    })
                    .map((season) => (
                      <option key={season.season_number} value={season.season_number}>
                        {season.season_number === 0 ? 'Bonus' : `Season ${season.season_number}`}
                      </option>
                    ))}
                </select>
              </label>

              <label style={{ marginLeft: '1rem' }}>
                Sort by episode:
                <select
                  value={sortOrder}
                  onChange={handleSortOrderChange}
                  style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </label>
            </div>

            {sortedEpisodes.length >= 9 && (
              <p
                style={{
                  fontSize: '0.85rem',
                  color: '#eaeaea',
                  marginBottom: '0.5rem',
                }}
              >
                <strong>Scroll for more episodes...</strong>
              </p>
            )}

            <ul className="episode-list" style={{ maxHeight: '20vh', overflowY: 'auto' }}>
              {sortedEpisodes.length > 0 ? (
                sortedEpisodes.map((ep) => (
                  <li
                    key={ep.id}
                    onClick={() => goToEpisode(selectedSeason, ep.episode_number)}
                    style={{ cursor: 'pointer', padding: '6px 0', borderBottom: '1px solid #ddd' }}
                    title={ep.name}
                  >
                    <strong>Ep {ep.episode_number}:</strong> {ep.name}
                  </li>
                ))
              ) : (
                <li>No episodes found for this season.</li>
              )}
            </ul>
          </div>

          <div className="overview-section pill">
            <h3 className="h3-redish">Overview</h3>
            <p>{tvShow.overview}</p>
          </div>
        </div>

        {/* Cast Section */}
        <div className="movie-description-section" style={{ marginTop: '2rem' }}>
          <div className="pill">
            <h3 className="h3-redish">Cast</h3>
            <ul className="cast-list">
              {cast.map((actor) => (
                <li key={actor.id}>
                  <span className="arrow">&#9656;</span> {actor.name} as {actor.character}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style>
        {`
          /* Container for episodes + overview on desktop */
.episodes-overview-container {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}

.episodes-section {
  flex: 1 1 60%;
}

.episodes-section .episode-list {
  max-height: 400px; /* limit height to 400px for scroll */
  overflow-y: auto; /* only episodes list scroll */
  padding: 0.5rem;
  border-radius: 4px;
}

.overview-section {
  flex: 1 1 40%;
  /* no fixed height or scroll */
}

/* Responsive */
@media (max-width: 600px) {
  .episodes-overview-container {
    flex-direction: column;
  }
  .episodes-section .episode-list {
    max-height: 300px;
  }
}

        `}
      </style>
    </>
  );
}

export default TvDetail;
