import { useEffect, useState } from 'react';

export default function FavoriteButton({ id }) {
  const localStorageKey = 'favoriteMovies';

  const [favorites, setFavorites] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const safeParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  // Load favorites iz localStorage
  useEffect(() => {
    const stored = localStorage.getItem(localStorageKey);
    const favs = stored ? safeParse(stored) : [];
    setFavorites(favs);
  }, []);

  // Update isFavorite state
  useEffect(() => {
    setIsFavorite(favorites.includes(id));
  }, [favorites, id]);

  const toggleFavorite = () => {
    let updatedFavorites;

    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter(itemId => itemId !== id);
    } else {
      updatedFavorites = [...favorites, id]; 
    }

    // Update state and localStorage
    setFavorites(updatedFavorites);
    localStorage.setItem(localStorageKey, JSON.stringify(updatedFavorites));
  };

  return (
    <button className="pill-button" onClick={toggleFavorite}>
      <i className={`bx ${isFavorite ? 'bxs-bookmarks' : 'bx-bookmarks'}`} style={{ marginRight: '6px', color: isFavorite? '#ffc107' : undefined }}></i>
      {isFavorite ? 'Favorited' : 'Favorite'}
    </button>
  );
}
