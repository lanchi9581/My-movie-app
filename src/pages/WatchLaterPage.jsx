import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import "./FavoritePage.css";

const API_KEY = '36669667bad13a98c59f98b32ebb67f5';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w300';
const PLACEHOLDER_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png';

function WatchLaterPage() {
  const [items, setItems] = useState([]);
  const [watchLaterIds, setWatchLaterIds] = useState([]);

  const localStorageKey = 'watchLaterMovies';

  // Load watch later movie IDs from localStorage
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
    setWatchLaterIds(ids);
  }, []);

  useEffect(() => {
    async function fetchItems() {
      if (watchLaterIds.length === 0) {
        setItems([]);
        return;
      }

      try {
        const data = await Promise.all(
          watchLaterIds.map(async (id) => {
            const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
          })
        );
        setItems(data);
      } catch (error) {
        console.error('Error fetching Watch Later movies:', error);
        setItems([]);
      }
    }

    fetchItems();
  }, [watchLaterIds]);

  if (items.length === 0) {
    return <p>You have no movies in your Watch Later list.</p>;
  }

  return (
    <main>
      <h1 className="h2-redish">Your Watch Later Movies</h1>
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

export default WatchLaterPage;
