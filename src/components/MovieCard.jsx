import { Link } from "react-router-dom";
import "./MovieCard.css";

const IMG_URL = "https://image.tmdb.org/t/p/w500";
const FALLBACK_IMG =
  "https://placehold.co/500x750/111827/ffffff?text=No+Poster";

function MovieCard({ movie }) {
  if (!movie) return null;

  const isTv =
    movie.media_type === "tv" ||
    movie.name ||
    movie.first_air_date;

  const title = movie.title || movie.name || "Untitled";
  const date = movie.release_date || movie.first_air_date || "";
  const year = date ? date.slice(0, 4) : "N/A";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  const detailPath = isTv ? `/series/${movie.id}` : `/movie/${movie.id}`;

  return (
    <Link to={detailPath} className="movie-card">
      <div className="movie-card-poster-wrap">
        <img
          src={movie.poster_path ? `${IMG_URL}${movie.poster_path}` : FALLBACK_IMG}
          alt={title}
          className="movie-card-poster"
          loading="lazy"
        />

        <div className="movie-card-gradient" />

        <div className="movie-card-rating">⭐ {rating}</div>
      </div>

      <div className="movie-card-info">
        <h3>{title}</h3>

        <div className="movie-card-meta">
          <span>{year}</span>
          <span>{isTv ? "Series" : "Movie"}</span>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;