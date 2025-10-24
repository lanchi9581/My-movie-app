import './index.css';
import { useEffect, useState, useCallback } from 'react';
import SearchAndFilter from './components/SearchAndFilter';
import Pagination from './components/Pagination';

import { Link, useLocation } from 'react-router-dom';

const API_KEY = '36669667bad13a98c59f98b32ebb67f5';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w300';
const PLACEHOLDER_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png';

const GENRE_NAME_TO_ID = {
  action: 10759,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 10765,
  history: 36,
  horror: 27,
  mystery: 9648,
  reality: 10764,
  romance: 10749,
  sci_fi: 10765,
  thriller: 53,
  war: 10768,
  western: 37,
};

export default function TVShows() {
  const location = useLocation();

  const [trendingShows, setTrendingShows] = useState([]);
  const [newAndUpcomingShows, setNewAndUpcomingShows] = useState([]);

  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('default');
  const [sortFilter, setSortFilter] = useState('default');
  const [maxPagesToLoad, setMaxPagesToLoad] = useState(10);

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

  // Fetch trending shows
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/trending/tv/day?api_key=${API_KEY}`);
        const d = await res.json();
        if (d.results) {
          setTrendingShows(d.results);
        }
      } catch (e) {
        console.error('Error fetching trending shows', e);
      }
    })();
  }, []);

  // Fetch new & upcoming shows (using "on the air" endpoint)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/tv/on_the_air?api_key=${API_KEY}`);
        const d = await res.json();
        if (d.results) {
          setNewAndUpcomingShows(d.results);
        }
      } catch (e) {
        console.error('Error fetching upcoming shows', e);
      }
    })();
  }, []);

  // Fetch first page (search or popular shows)
  useEffect(() => {
    async function fetchFirstPage() {
      setLoading(true);
      try {
        if (searchTerm.length > 0) {
          const searchRes = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(
              searchTerm
            )}&page=1&include_adult=false`
          );
          const data = await searchRes.json();

          const shows = (data.results || []).map((s) => ({
            ...s,
            media_type: 'tv',
            title: s.name,
            release_date: s.first_air_date,
          }));

          setAllItems(shows);
          setFilteredItems(shows);
          setTotalPages(data.total_pages || 1);
          setPage(1);
        } else {
          const popularRes = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&page=1`);
          const data = await popularRes.json();

          const shows = (data.results || []).map((s) => ({
            ...s,
            media_type: 'tv',
            title: s.name,
            release_date: s.first_air_date,
          }));

          setAllItems(shows);
          setFilteredItems(shows);
          setTotalPages(data.total_pages || 1);
          setPage(1);
        }
      } catch (e) {
        console.error('Error in fetchFirstPage for TV shows', e);
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

  // Fetch pages for shows (including page 1)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (searchTerm.length > 0) {
          const searchRes = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(
              searchTerm
            )}&page=${page}&include_adult=false`
          );
          const data = await searchRes.json();

          const shows = (data.results || []).map((s) => ({
            ...s,
            media_type: 'tv',
            title: s.name,
            release_date: s.first_air_date,
          }));

          setAllItems((prev) => {
            const existing = new Set(prev.map((i) => i.id));
            const filtered = shows.filter((i) => !existing.has(i.id));
            return page === 1 ? shows : [...prev, ...filtered];
          });

          setFilteredItems((prev) => {
            const existing = new Set(prev.map((i) => i.id));
            const filtered = shows.filter((i) => !existing.has(i.id));
            return page === 1 ? shows : [...prev, ...filtered];
          });

          setTotalPages(data.total_pages || 1);
        } else {
          const popularRes = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&page=${page}`);
          const data = await popularRes.json();

          const shows = (data.results || []).map((s) => ({
            ...s,
            media_type: 'tv',
            title: s.name,
            release_date: s.first_air_date,
          }));

          setAllItems((prev) => {
            const existing = new Set(prev.map((i) => i.id));
            const filtered = shows.filter((i) => !existing.has(i.id));
            return page === 1 ? shows : [...prev, ...filtered];
          });

          setFilteredItems((prev) => {
            const existing = new Set(prev.map((i) => i.id));
            const filtered = shows.filter((i) => !existing.has(i.id));
            return page === 1 ? shows : [...prev, ...filtered];
          });

          setTotalPages(data.total_pages || 1);
        }
      } catch (e) {
        console.error('Error fetching more pages for TV shows', e);
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

  // Load all shows
  const loadAllShows = async (maxPages = maxPagesToLoad) => {
    setLoading(true);
    try {
      const allResults = [];
      let pageNum = 1;
      let totalPagesFetched = 1;

      do {
        const res = await fetch(
          `${BASE_URL}/tv/popular?api_key=${API_KEY}&page=${pageNum}`
        );
        const data = await res.json();

        if (data?.results?.length) {
          allResults.push(...data.results);
        }

        totalPagesFetched = data.total_pages || 1;
        pageNum++;
      } while (pageNum <= totalPagesFetched && pageNum <= maxPages);

      // Remove duplicates by ID
      const uniqueShows = Array.from(new Map(allResults.map(s => [s.id, s])).values());
      setAllItems(uniqueShows);
      setFilteredItems(uniqueShows);
      setTotalPages(1);
      setPage(1);

      console.log(`Loaded ${uniqueShows.length} TV shows`);
    } catch (e) {
      console.error('Error loading all shows:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1 className="h1-redish">Trending TV Shows</h1>
      <section className="movies-wheel">
        <div className="wheel-track">
          {[...trendingShows, ...trendingShows].map((show, index) => (
            <Link
              to={`/tv/${show.id}`}
              className="movie-item"
              key={`trend-${show.id}-${index}`}
            >
              <img
                src={show.poster_path ? `${IMG_URL}${show.poster_path}` : PLACEHOLDER_IMG}
                alt={show.name}
                onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
              />
              <h2 className="movie_title">{show.name}</h2>
            </Link>
          ))}
        </div>
      </section>

      <br />

      <h1 className="h1-redish">New & Upcoming TV Shows</h1>
      <section className="new_and_upcoming">
        {newAndUpcomingShows.slice(0, 20).map((show) => (
          <Link
            to={`/tv/${show.id}`}
            className="movie-item"
            key={`up-${show.id}`}
            state={{
              from: location.pathname + location.search,
              searchState: { searchTerm, genreFilter, sortFilter },
              mediaState: { page, allItems, filteredItems },
            }}
          >
            <img
              src={show.poster_path ? `${IMG_URL}${show.poster_path}` : PLACEHOLDER_IMG}
              alt={show.name}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
            />
            <h2 className="movie_title">{show.name}</h2>
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
          onLoadAllMovies={loadAllShows}
          maxPagesToLoad={maxPagesToLoad}
          setMaxPagesToLoad={setMaxPagesToLoad}
        />

        <section className="explore-more">
          {filteredItems.length === 0 ? (
            <p>No items found.</p>
          ) : (
            filteredItems.map((item) => (
              <Link
                to={`/tv/${item.id}`}
                className="movie-item"
                key={`tvshow-${item.id}`}
                state={{
                  from: location.pathname + location.search,
                  searchState: { searchTerm, genreFilter, sortFilter },
                  mediaState: { page, allItems, filteredItems },
                }}
              >
                <img
                  src={item.poster_path ? `${IMG_URL}${item.poster_path}` : PLACEHOLDER_IMG}
                  alt={item.name || ''}
                  onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                />
                <h2 className="movie_title">{item.name || ''}</h2>
              </Link>
            ))
          )}
        </section>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          {!loading && totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              setPage={setPage}
              loading={loading}
            />
          )}
          {loading && <p>Loading...</p>}
        </div>
      </div>
    </main>
  );
}
