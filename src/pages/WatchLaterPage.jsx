import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_KEY = '36669667bad13a98c59f98b32ebb67f5';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w300';
const PLACEHOLDER_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png';

function WatchLaterPage({ contentType = 'movie' }) {
  const [items, setItems] = useState([]);
  const [watchLaterIds, setWatchLaterIds] = useState([]);

  const localStorageKey = contentType === 'movie' ? 'watchLaterMovies' : 'watchLaterTVShows';

  // Read localStorage on mount or when contentType changes
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
    setWatchLaterIds(ids);
  }, [localStorageKey]);

  useEffect(() => {
    async function fetchItems() {
      if (watchLaterIds.length === 0) {
        setItems([]);
        return;
      }

      try {
        const data = await Promise.all(
          watchLaterIds.map(async (id) => {
            const res = await fetch(`${BASE_URL}/${contentType}/${id}?api_key=${API_KEY}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
          })
        );
        setItems(data);
      } catch (error) {
        console.error('Error fetching Watch Later items:', error);
        setItems([]);
      }
    }

    fetchItems();
  }, [watchLaterIds, contentType]);

  if (items.length === 0) {
    return <p>You have no {contentType === 'movie' ? 'movies' : 'TV shows'} in your Watch Later list.</p>;
  }

  return (
    <main>
      <h1>Your Watch Later {contentType === 'movie' ? 'Movies' : 'TV Shows'}</h1>
      <section className="movie-list">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/${contentType}/${item.id}`}
            className="movie-item"
          >
            <img
              src={item.poster_path ? `${IMG_URL}${item.poster_path}` : PLACEHOLDER_IMG}
              alt={item.title || item.name}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
            />
            <h2 className="movie_title">{item.title || item.name}</h2>
          </Link>
        ))}
      </section>
    </main>
  );
}

export default WatchLaterPage;
