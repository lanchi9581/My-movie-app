import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import "./FavoritePage.css";

const API_KEY = '36669667bad13a98c59f98b32ebb67f5';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w300';
const PLACEHOLDER_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png';

function FavoritePage() {
  const [items, setItems] = useState([]);
  const localStorageKey = 'favoriteMovies';

  const favoriteIds = JSON.parse(localStorage.getItem(localStorageKey) || '[]');

  useEffect(() => {
    async function fetchItems() {
      const data = await Promise.all(
        favoriteIds.map(async (id) => {
          const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);
          return res.json();
        })
      );
      setItems(data);
    }

    if (favoriteIds.length) {
      fetchItems();
    } else {
      setItems([]);
    }
  }, [favoriteIds]);

  if (items.length === 0) {
    return <p>You have no favorite movies yet.</p>;
  }

  return (
    <main style={{ padding: '1rem' }}>
      <h1 className="h2-redish" style={{ textAlign: 'left' }}>
        Your Favorite Movies
      </h1>
      <section className="movie-list2">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/movie/${item.id}`}
            className="movie-item2"
          >
            <img
              src={item.poster_path ? `${IMG_URL}${item.poster_path}` : PLACEHOLDER_IMG}
              alt={item.title}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
            />
            <h2 className="movie_title2">{item.title}</h2>
          </Link>
        ))}
      </section>
    </main>
  );
}

export default FavoritePage;
