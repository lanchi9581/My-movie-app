import './index.css';
import { useEffect, useState, useCallback } from 'react';
import SearchAndFilter from './components/SearchAndFilter';
import { Link, useLocation } from 'react-router-dom';
import Pagination from './components/Pagination';

const API_KEY = '36669667bad13a98c59f98b32ebb67f5';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w300';
const PLACEHOLDER_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png';

const GENRE_NAME_TO_ID = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878,
  war: 10752,
  thriller: 53,
};

export default function TvShows() {
  const location = useLocation();

  const [trendingTv, setTrendingTv] = useState([]);
  const [newAndUpcomingTv, setNewAndUpcomingTv] = useState([]);

  // TV list
  const [allItems, setAllItems] = useState([]); 
  const [filteredItems, setFilteredItems] = useState([]);

  // Loading, paging
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters + search
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('default');
  const [sortFilter, setSortFilter] = useState('default');

  // Obdrzi state ko prides iz movie detail
  useEffect(() => {
    if (location.state?.searchState) {
      const { searchState, mediaState } = location.state;
      setSearchTerm(searchState.searchTerm || '');
      setGenreFilter(searchState.genreFilter || 'default');
      setSortFilter(searchState.sortFilter || 'default');
      if (mediaState) {
        setPage(mediaState.page || 1);
        setAllItems(mediaState.allItems || []);
        setFilteredItems(mediaState.filteredItems || []);
      }
    }
  }, [location.state]);

  // fetch TV shows
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/trending/tv/day?api_key=${API_KEY}`);
        const d = await res.json();
        if (d.results) {
          setTrendingTv(d.results);
        }
      } catch (e) {
        console.error('Error fetching trending TV shows', e);
      }
    })();
  }, []);

  // fetch upcoming TV shows 
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/tv/on_the_air?api_key=${API_KEY}`);
        const d = await res.json();
        if (d.results) {
          setNewAndUpcomingTv(d.results);
        }
      } catch (e) {
        console.error('Error fetching upcoming TV shows', e);
      }
    })();
  }, []);

  // fetch first page
  useEffect(() => {
    async function fetchFirstPage() {
      setLoading(true);
      try {
        if (searchTerm.length > 0) {
          const tvRes = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(searchTerm)}&page=1`
          );
          const tvData = await tvRes.json();

          const tvs = (tvData.results || []).map((t) => ({
            ...t,
            media_type: 'tv',
            title: t.name,
            release_date: t.first_air_date,
          }));

          setAllItems(tvs);
          setFilteredItems(tvs);
          setTotalPages(tvData.total_pages || 1);
          setPage(1);
        } else {
          const tvRes = await fetch(`${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&page=1`);
          const tvData = await tvRes.json();

          const tvs = (tvData.results || []).map((t) => ({
            ...t,
            media_type: 'tv',
            title: t.name,
            release_date: t.first_air_date,
          }));

          setAllItems(tvs);
          setFilteredItems(tvs);
          setTotalPages(tvData.total_pages || 1);
          setPage(1);
        }
      } catch (e) {
        console.error('Error in fetchFirstPage', e);
        setAllItems([]);
        setFilteredItems([]);
        setTotalPages(1);
        setPage(1);
      } finally {
        setLoading(false);
      }
    }
    fetchFirstPage();
  }, [searchTerm]);

  // Fetch pages
  useEffect(() => {
    if (page === 1) return;
    if (loading) return;

    (async () => {
      setLoading(true);
      try {
        if (searchTerm.length > 0) {
          const tvRes = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(searchTerm)}&page=${page}`
          );
          const tvData = await tvRes.json();

          const tvs = (tvData.results || []).map((t) => ({
            ...t,
            media_type: 'tv',
            title: t.name,
            release_date: t.first_air_date,
          }));

          setAllItems((prev) => {
            const existing = new Set(prev.map((i) => `${i.media_type}-${i.id}`));
            const filtered = tvs.filter((i) => !existing.has(`${i.media_type}-${i.id}`));
            return [...prev, ...filtered];
          });
          setFilteredItems((prev) => {
            const existing = new Set(prev.map((i) => `${i.media_type}-${i.id}`));
            const filtered = tvs.filter((i) => !existing.has(`${i.media_type}-${i.id}`));
            return [...prev, ...filtered];
          });
        } else {
          const tvRes = await fetch(`${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&page=${page}`);
          const tvData = await tvRes.json();

          const tvs = (tvData.results || []).map((t) => ({
            ...t,
            media_type: 'tv',
            title: t.name,
            release_date: t.first_air_date,
          }));

          setAllItems((prev) => {
            const existing = new Set(prev.map((i) => `${i.media_type}-${i.id}`));
            const filtered = tvs.filter((i) => !existing.has(`${i.media_type}-${i.id}`));
            return [...prev, ...filtered];
          });
          setFilteredItems((prev) => {
            const existing = new Set(prev.map((i) => `${i.media_type}-${i.id}`));
            const filtered = tvs.filter((i) => !existing.has(`${i.media_type}-${i.id}`));
            return [...prev, ...filtered];
          });
        }
      } catch (e) {
        console.error('Error fetching more pages', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  // Client filtering and sorting
  const applyClientFiltering = useCallback(() => {
    let arr = [...allItems];

    // Genre filter 
    if (genreFilter !== 'default') {
      const genreId = GENRE_NAME_TO_ID[genreFilter];
      if (genreId != null) {
        arr = arr.filter((item) => {
          if (!item.genre_ids) return false;
          return item.genre_ids.includes(genreId);
        });
      }
    }

    // Sorting
    arr.sort((a, b) => {
      switch (sortFilter) {
        case 'mostPopular':
          return (b.popularity || 0) - (a.popularity || 0);
        case 'leastPopular':
          return (a.popularity || 0) - (b.popularity || 0);
        case 'highestRated':
          return (b.vote_average || 0) - (a.vote_average || 0);
        case 'yearNewest':
          return (
            new Date(b.release_date || '1900-01-01') -
            new Date(a.release_date || '1900-01-01')
          );
        case 'yearOldest':
          return (
            new Date(a.release_date || '1900-01-01') -
            new Date(b.release_date || '1900-01-01')
          );
        case 'az':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    setFilteredItems(arr);
  }, [allItems, genreFilter, sortFilter]);

  useEffect(() => {
    applyClientFiltering();
  }, [allItems, genreFilter, sortFilter, applyClientFiltering]);

  return (
    <main>
      <h1 className="h1-redish">Trending TV Shows</h1>
      <section className="movies-wheel">
        <div className="wheel-track">
          {[...trendingTv, ...trendingTv].map((tv, index) => (
            <Link
              to={`/tv/${tv.id}`}
              className="movie-item"
              key={`trend-tv-${tv.id}-${index}`} // Ensure uniqueness
              state={{
                from: location.pathname + location.search,
                searchState: { searchTerm, genreFilter, sortFilter },
                mediaState: { page, allItems, filteredItems },
              }}
            >
              <img
                src={tv.poster_path ? `${IMG_URL}${tv.poster_path}` : PLACEHOLDER_IMG}
                alt={tv.name}
                onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
              />
              <h2 className="movie_title">{tv.name}</h2>
            </Link>
          ))}
        </div>
      </section>
      <br />

      <h1 className="h1-redish">New & Upcoming TV Shows</h1>
      <section className="new_and_upcoming">
        {newAndUpcomingTv.slice(0, 20).map((tv) => (
          <Link
            to={`/tv/${tv.id}`}
            className="movie-item"
            key={`up-${tv.id}`}
            state={{
              from: location.pathname + location.search,
              searchState: { searchTerm, genreFilter, sortFilter },
              mediaState: { page, allItems, filteredItems },
            }}
          >
            <img
              src={tv.poster_path ? `${IMG_URL}${tv.poster_path}` : PLACEHOLDER_IMG}
              alt={tv.name}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
            />
            <h2 className="movie_title">{tv.name}</h2>
          </Link>
        ))}
      </section>

      <br />

      <h1 className="h1-redish">Explore More TV Shows</h1>
      <hr className="custom-hr" />
      <div className="Movie-search-container">
        <p className="movie-count">{filteredItems.length} items loaded</p>
        <SearchAndFilter
          data={allItems}
          initialSearchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          initialGenreFilter={genreFilter}
          onGenreFilterChange={setGenreFilter}
          initialSortFilter={sortFilter}
          onSortFilterChange={setSortFilter}
        />

        <section className="explore-more">
          {filteredItems.length === 0 ? (
            <p>No items found.</p>
          ) : (
            filteredItems.map((item) => (
              <Link
                to={`/tv/${item.id}`}
                className="movie-item"
                key={`tv-${item.id}`}
                state={{
                  from: location.pathname + location.search,
                  searchState: { searchTerm, genreFilter, sortFilter },
                  mediaState: { page, allItems, filteredItems },
                }}
              >
                <img
                  src={item.poster_path ? `${IMG_URL}${item.poster_path}` : PLACEHOLDER_IMG}
                  alt={item.title || ''}
                  onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                />
                <h2 className="movie_title">{item.title || ''}</h2>
              </Link>
            ))
          )}
        </section>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          {!loading && totalPages > 1 && (
            <>
              <Pagination
                page={page}
                totalPages={totalPages}
                setPage={setPage}
                loading={loading}
              />
            </>
          )}
          {loading && <p>Loading...</p>}
        </div>
      </div>
    </main>
  );
}
