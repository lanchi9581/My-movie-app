import { Link } from "react-router-dom";
import "./MovieCard.css";

const IMG_URL = "https://image.tmdb.org/t/p/w342";
const FALLBACK_IMG =
  "https://placehold.co/342x513/07080d/ffffff?text=Prestige";

function MovieCard({ movie, index = 0 }) {
  if (!movie) return null;

  const isTv =
    movie.media_type === "tv" ||
    Boolean(movie.name) ||
    Boolean(movie.first_air_date);

  const title = movie.title || movie.name || "Untitled";
  const date = movie.release_date || movie.first_air_date || "";
  const year = date ? date.slice(0, 4) : "New";
  const rating =
    typeof movie.vote_average === "number"
      ? movie.vote_average.toFixed(1)
      : "N/A";

  const detailPath = isTv ? `/series/${movie.id}` : `/movie/${movie.id}`;
  const posterSrc = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : FALLBACK_IMG;

  return (
    <Link to={detailPath} className="movie-card">
      <div className="movie-card-poster-wrap">
        <img
          src={posterSrc}
          alt={title}
          className="movie-card-poster"
          loading={index < 6 ? "eager" : "lazy"}
          decoding="async"
        />

        <div className="movie-card-rating">
          <i className="bx bxs-star"></i>
          {rating}
        </div>
      </div>

      <div className="movie-card-info">
        <h3>{title}</h3>
        <p>{year}</p>
      </div>
    </Link>
  );
}

export default MovieCard;