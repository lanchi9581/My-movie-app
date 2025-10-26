import './index.css';
import { useEffect, useState, useCallback } from 'react';
import SearchAndFilter from './components/SearchAndFilter';
import Pagination from './components/Pagination';
import AffiliateLinks from './components/AffiliateLinks';

import { Link, useLocation } from 'react-router-dom';

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

export default function Movies() {
  const location = useLocation();

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [newAndUpcomingMovies, setNewAndUpcomingMovies] = useState([]);

  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('default');
  const [sortFilter, setSortFilter] = useState('default');
  const [maxPagesToLoad, setMaxPagesToLoad] = useState(10);  // default 




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

  // Fetch trending movies
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`);
        const d = await res.json();
        if (d.results) {
          setTrendingMovies(d.results);
        }
      } catch (e) {
        console.error('Error fetching trending', e);
      }
    })();
  }, []);

  // Fetch upcoming movies
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}`);
        const d = await res.json();
        if (d.results) {
          setNewAndUpcomingMovies(d.results);
        }
      } catch (e) {
        console.error('Error fetching upcoming', e);
      }
    })();
  }, []);

  // Fetch first page (search or now playing)
  useEffect(() => {
    async function fetchFirstPage() {
      setLoading(true);
      try {
        if (searchTerm.length > 0) {
          const movieRes = await fetch(
            `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
              searchTerm
            )}&page=1&include_adult=false`
          );
          const movieData = await movieRes.json();

          const movies = (movieData.results || []).map((m) => ({
            ...m,
            media_type: 'movie',
            title: m.title,
            release_date: m.release_date,
          }));

          setAllItems(movies);
          setFilteredItems(movies);
          setTotalPages(movieData.total_pages || 1);
          setPage(1);
        } else {
          const movieRes = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=1`);
          const movieData = await movieRes.json();

          const movies = (movieData.results || []).map((m) => ({
            ...m,
            media_type: 'movie',
            title: m.title,
            release_date: m.release_date,
          }));

          setAllItems(movies);
          setFilteredItems(movies);
          setTotalPages(movieData.total_pages || 1);
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

  // Fetch pages for movies (including page 1)
  useEffect(() => {
    // Always fetch when page changes
    (async () => {
      setLoading(true);
      try {
        if (searchTerm.length > 0) {
          const movieRes = await fetch(
            `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
              searchTerm
            )}&page=${page}&include_adult=false`
          );
          const movieData = await movieRes.json();

          const movies = (movieData.results || []).map((m) => ({
            ...m,
            media_type: 'movie',
            title: m.title,
            release_date: m.release_date,
          }));

          setAllItems((prev) => {
            const existing = new Set(prev.map((i) => i.id));
            const filtered = movies.filter((i) => !existing.has(i.id));
            return page === 1 ? movies : [...prev, ...filtered];
          });
          setFilteredItems((prev) => {
            const existing = new Set(prev.map((i) => i.id));
            const filtered = movies.filter((i) => !existing.has(i.id));
            return page === 1 ? movies : [...prev, ...filtered];
          });
          setTotalPages(movieData.total_pages || 1);
        } else {
          const movieRes = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=${page}`);
          const movieData = await movieRes.json();

          const movies = (movieData.results || []).map((m) => ({
            ...m,
            media_type: 'movie',
            title: m.title,
            release_date: m.release_date,
          }));

          setAllItems((prev) => {
            const existing = new Set(prev.map((i) => i.id));
            const filtered = movies.filter((i) => !existing.has(i.id));
            return page === 1 ? movies : [...prev, ...filtered];
          });
          setFilteredItems((prev) => {
            const existing = new Set(prev.map((i) => i.id));
            const filtered = movies.filter((i) => !existing.has(i.id));
            return page === 1 ? movies : [...prev, ...filtered];
          });
          setTotalPages(movieData.total_pages || 1);
        }
      } catch (e) {
        console.error('Error fetching more pages', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [page, searchTerm]);

  // Filtering & sorting
  const applyClientFiltering = useCallback(() => {
    let arr = [...allItems];

    if (genreFilter !== 'default') {
      const genreId = GENRE_NAME_TO_ID[genreFilter];
      if (genreId != null) {
        arr = arr.filter((item) => item.genre_ids?.includes(genreId));
      }
    }

    arr.sort((a, b) => {
      switch (sortFilter) {
        case 'mostPopular':
          return (b.popularity || 0) - (a.popularity || 0);
        case 'leastPopular':
          return (a.popularity || 0) - (b.popularity || 0);
        case 'highestRated':
          return (b.vote_average || 0) - (a.vote_average || 0);
        case 'yearNewest':
          return new Date(b.release_date || '1900-01-01') - new Date(a.release_date || '1900-01-01');
        case 'yearOldest':
          return new Date(a.release_date || '1900-01-01') - new Date(b.release_date || '1900-01-01');
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

    // Load all movies
    const loadAllMovies = async (maxPages = maxPagesToLoad) => {
      setLoading(true);
      try {
        const allResults = [];
        let pageNum = 1;
        let totalPagesFetched = 1;

        do {
          const res = await fetch(
            `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=${pageNum}`
          );
          const data = await res.json();

          if (data?.results?.length) {
            allResults.push(...data.results);
          }

          totalPagesFetched = data.total_pages || 1;
          pageNum++;
        } while (pageNum <= totalPagesFetched && pageNum <= maxPages);

        // Remove duplicates by ID
        const uniqueMovies = Array.from(new Map(allResults.map(m => [m.id, m])).values());
        setAllItems(uniqueMovies);
        setFilteredItems(uniqueMovies);
        setTotalPages(1);
        setPage(1);

        console.log(`Loaded ${uniqueMovies.length} movies`);
      } catch (e) {
        console.error('Error loading all movies:', e);
      } finally {
        setLoading(false);
      }
    };



  return (
    <main>
      <h1 className="h1-redish">Trending Movies</h1>
      <section className="movies-wheel">
        <div className="wheel-track">
          {[...trendingMovies, ...trendingMovies].map((movie, index) => (
            <Link
              to={`/movie/${movie.id}`}
              className="movie-item"
              key={`trend-${movie.id}-${index}`}
            >
              <img
                src={movie.poster_path ? `${IMG_URL}${movie.poster_path}` : PLACEHOLDER_IMG}
                alt={movie.title}
                onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
              />
              <h2 className="movie_title">{movie.title}</h2>
            </Link>
          ))}
        </div>
      </section>

      <AffiliateLinks />

      <h1 className="h1-redish">New & Upcoming</h1>
      <section className="new_and_upcoming">
        {newAndUpcomingMovies.slice(0, 20).map((movie) => (
          <Link
            to={`/movie/${movie.id}`}
            className="movie-item"
            key={`up-${movie.id}`}
            state={{
              from: location.pathname + location.search,
              searchState: { searchTerm, genreFilter, sortFilter },
              mediaState: { page, allItems, filteredItems },
            }}
          >
            <img
              src={movie.poster_path ? `${IMG_URL}${movie.poster_path}` : PLACEHOLDER_IMG}
              alt={movie.title}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
            />
            <h2 className="movie_title">{movie.title}</h2>
          </Link>
        ))}
      </section>

      <br />

      <h1 className="h1-redish">Explore More</h1>
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
          onLoadAllMovies={loadAllMovies}
          maxPagesToLoad={maxPagesToLoad}           
          setMaxPagesToLoad={setMaxPagesToLoad} 
        />

        <section className="explore-more">
          {filteredItems.length === 0 ? (
            <p>No items found.</p>
          ) : (
            filteredItems.map((item) => (
              <Link
                to={`/movie/${item.id}`}
                className="movie-item"
                key={`movie-${item.id}`}
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
