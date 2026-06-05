import { useEffect, useState } from "react";

export default function FavoriteButton({ id }) {
  const localStorageKey = "favoriteMovies";

  const [favorites, setFavorites] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const safeParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(localStorageKey);
    const favs = stored ? safeParse(stored) : [];

    setFavorites(favs);
  }, []);

  useEffect(() => {
    setIsFavorite(favorites.includes(id));
  }, [favorites, id]);

  const toggleFavorite = () => {
    let updatedFavorites;

    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter((itemId) => itemId !== id);
    } else {
      updatedFavorites = [...favorites, id];
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