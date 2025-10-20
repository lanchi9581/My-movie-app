import { useEffect, useState } from 'react';

export default function FavoriteButton({ id, contentType = 'movie' }) {
  const localStorageKey = contentType === 'movie' ? 'favoriteMovies' : 'favoriteTVShows';
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    setIsFavorite(favorites.includes(id));
  }, [id, localStorageKey]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    let updatedFavorites;

    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter(itemId => itemId !== id);
      setIsFavorite(false);
      alert('Removed from favorites!');
    } else {
      updatedFavorites = [...favorites, id];
      setIsFavorite(true);
      alert('Added to favorites!');
    }

    localStorage.setItem(localStorageKey, JSON.stringify(updatedFavorites));
  };

  return (
    <button className="pill-button" onClick={toggleFavorite}>
      <i className={`bx ${isFavorite ? 'bxs-heart' : 'bx-heart'}`} style={{ marginRight: '6px' }}></i>
      {isFavorite ? 'Favorited' : 'Favorite'}
    </button>
  );
}
