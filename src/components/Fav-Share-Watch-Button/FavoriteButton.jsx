import { useEffect, useState } from "react";

export default function FavoriteButton({
  id,
  media_type = "movie",
  title,
  poster_path,
  vote_average,
}) {
  const localStorageKey = "favoriteItems";

  const [favorites, setFavorites] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const safeParse = (value) => {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const normalizeItem = () => ({
    id,
    media_type,
    title: title || "Untitled",
    poster_path: poster_path || null,
    vote_average: vote_average || 0,
  });

  useEffect(() => {
    const stored = localStorage.getItem(localStorageKey);
    setFavorites(safeParse(stored));
  }, []);

  useEffect(() => {
    setIsFavorite(
      favorites.some(
        (item) =>
          Number(item.id) === Number(id) && item.media_type === media_type
      )
    );
  }, [favorites, id, media_type]);

  const toggleFavorite = () => {
    let updatedFavorites;

    if (isFavorite) {
      updatedFavorites = favorites.filter(
        (item) =>
          !(
            Number(item.id) === Number(id) &&
            item.media_type === media_type
          )
      );
    } else {
      updatedFavorites = [normalizeItem(), ...favorites];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem(localStorageKey, JSON.stringify(updatedFavorites));
  };

  return (
    <button
      className={isFavorite ? "pill-button is-active" : "pill-button"}
      onClick={toggleFavorite}
      type="button"
    >
      <i className={`bx ${isFavorite ? "bxs-bookmarks" : "bx-bookmarks"}`}></i>
      <span>{isFavorite ? "Favorited" : "Favorite"}</span>
    </button>
  );
}