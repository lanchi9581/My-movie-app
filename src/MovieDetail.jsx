import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './MovieDetail.css';
import './index.css';
import ShareButton from './components/ShareButton';
import FavoriteButton from './components/FavoriteButton';
import WatchLaterButton from './components/WatchLaterButton';



const API_KEY = '36669667bad13a98c59f98b32ebb67f5';
const BASE_URL = 'https://api.themoviedb.org/3';
const BACKDROP_IMG_URL = 'https://image.tmdb.org/t/p/w780';

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const movieUrl = window.location.href;

  const fromPath = location.state?.from || '/movies';
  const searchState = location.state?.searchState;

  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [trailerKey, setTrailerKey] = useState(null);

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        const movieRes = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);
        const movieData = await movieRes.json();
        setMovie(movieData);

        const creditsRes = await fetch(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`);
        const creditsData = await creditsRes.json();
        setCast(creditsData.cast?.slice(0, 8) || []);

        const videosRes = await fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`);
        const videosData = await videosRes.json();
        const trailer = videosData.results.find(
          video => video.type === 'Trailer' && video.site === 'YouTube'
        );
        setTrailerKey(trailer ? trailer.key : null);
      } catch (error) {
        console.error('Failed to fetch movie data:', error);
        setTrailerKey(null);
      }
    };

    fetchMovieData();
  }, [id]);

  const handleBackClick = () => {
    if (fromPath) {
      navigate(fromPath, { state: { searchState } });
    }
  };

  if (!movie) return <p>Loading…</p>;

  return (
    <>
      <button className="back-arrow-button"  onClick={handleBackClick} aria-label="Go back">
        <svg xmlns="http://www.w3.org/2000/svg" width={55} height={55} fill="#ff3f3f"  viewBox="0 0 24 24">
          <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2m5 11h-6.59l2.29 2.29-1.41 1.41-4.71-4.71 4.71-4.71 1.41 1.41-2.29 2.29H17v2Z" /> 
        </svg>
      </button>

      <div className="movie-detail-window">
        <h1 className="h1-5-redish">{movie.title}</h1>

        <div className="movie-top-section">
          <div
            className="movie-poster-container clickable-poster"
            onClick={() => {
              if (trailerKey) {
                navigate(`/MoviePlayerPage/${id}?trailer=${trailerKey}`);
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && trailerKey) {
                navigate(`/MoviePlayerPage/${id}?trailer=${trailerKey}`);
              }
            }}
          >
            <img
              className={`landscape-poster ${!movie.backdrop_path ? 'fallback-poster' : ''}`}
              src={
                movie.backdrop_path
                  ? `${BACKDROP_IMG_URL}${movie.backdrop_path}`
                  : movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : 'https://www.legrand.es/modules/custom/legrand_ecat/assets/img/no-image.png'
              }
              alt={movie.title}
            />
            <div className="play-icon-overlay">
              <i className="bx bx-play-circle" style={{ fontSize: '48px', color: 'white' }}></i>
            </div>
          </div>

          <div className="movie-info-panel">
            <p>
              <i className="bx bx-calendar" style={{ marginRight: '8px' }}></i>
              <strong>Release Date:</strong> {movie.release_date}
            </p>
            <p>
              <i className="bx bx-star" style={{ marginRight: '8px', color: '#f5c518' }}></i>
              <strong>Rating:</strong> {movie.vote_average} / 10
            </p>
            <p>
              <i className="bx bx-category" style={{ marginRight: '8px' }}></i>
              <strong>Genres:</strong> {movie.genres?.map((g) => g.name).join(', ')}
            </p>

            <div className="action-buttons">
              <FavoriteButton id={movie.id} contentType="movie" />
              <WatchLaterButton id={movie.id} contentType="movie" />
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
                    navigate(`/MoviePlayerPage/${id}?trailer=${trailerKey}`);
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
                onClick={() => {
                  navigate(`/MoviePlayerPage/${id}`);
                }}
              >
                <i className="bx bx-play-circle" style={{ marginRight: '6px' }}></i>
                Play Movie
              </button>
            </div>
          </div>
        </div>

        {/* Overview and Cast */}
        <div className="overview-cast-container">
          <div className="pill overview-section">
            <h3 className="h3-redish">Overview</h3>
            <p>{movie.overview}</p>
          </div>

          <div className="pill cast-section">
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
    </>
  );
}

export default MovieDetail;

