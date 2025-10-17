import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './MovieDetail.css';
import './MoviePlayerPage.css';

const API_KEY = '36669667bad13a98c59f98b32ebb67f5';
const BASE_URL = 'https://api.themoviedb.org/3';

function MoviePlayerPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [movie, setMovie] = useState(null);

    // Get trailer key
    const searchParams = new URLSearchParams(location.search);
    const trailerKey = searchParams.get('trailer');

    useEffect(() => {
  const fetchMovie = async () => {
    try {
      const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);
      const data = await res.json();
      setMovie(data);
    } catch (err) {
      console.error("Failed to fetch movie:", err);
    }
  };

  fetchMovie();
}, [id]);


    const handleBackClick = () => {
        navigate(`/movie/${id}`);
    };

    if (!movie) return <p>Loading movie details...</p>;

    return (
  <div className="MoviePlayer-header">
    <button
      className="back-arrow-button"
      onClick={handleBackClick}
      aria-label="Go back"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width={55} height={55} fill="#ff3f3f" viewBox="0 0 24 24">
        <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2m5 11h-6.59l2.29 2.29-1.41 1.41-4.71-4.71 4.71-4.71 1.41 1.41-2.29 2.29H17v2Z" />
      </svg>
    </button>

    <h2 className="h2-redish">{movie.title}</h2>
    <hr className="custom-hr" />

    {trailerKey ? (
      <div className="movie-detail-window2">
        <iframe
          className="iframe"
          src={`https://www.youtube.com/embed/${trailerKey}`}
          title="Movie Trailer"
          allow="autoplay; encrypted-media"
          allowFullScreen
          frameBorder="0"
        />
      </div>
    ) : (
      <div className="movie-detail-window3">
        <p>
          If nothing is showing up click on the clouds icon <strong>Left-Top-Corner</strong>
        </p>
        <br />
        <iframe
          className="iframe"
          src={`https://vidsrc-embed.ru/embed/movie?tmdb=${id}`}
          allowFullScreen
          title="Movie Player"
          frameBorder="0"
        />
      </div>
    )}
  </div>
);

}

export default MoviePlayerPage;