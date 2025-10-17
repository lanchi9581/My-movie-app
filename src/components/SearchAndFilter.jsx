import React, { useEffect, useRef, useState } from 'react';
import './SearchAndFilter.css';

const LOCAL_STORAGE_KEY = 'mediaFilters';

const SearchAndFilter = ({
  initialSearchTerm = '',
  initialGenreFilter = 'default',
  initialSortFilter = 'default',
  onSearchTermChange = () => {},
  onGenreFilterChange = () => {},
  onSortFilterChange = () => {},
}) => {
  const debounceTimeout = useRef(null);

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [genreFilter, setGenreFilter] = useState(initialGenreFilter);
  const [sortFilter, setSortFilter] = useState(initialSortFilter);

  // Load filters from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (saved) {
      if (initialSearchTerm === '' && saved.searchTerm) {
        setSearchTerm(saved.searchTerm);
      }
      if (initialGenreFilter === 'default' && saved.genreFilter) {
        setGenreFilter(saved.genreFilter);
      }
      if (initialSortFilter === 'default' && saved.sortFilter) {
        setSortFilter(saved.sortFilter);
      }
    }
  }, []);

  // Debounced - search
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      onSearchTermChange(searchTerm);
      saveFilters({ searchTerm, genreFilter, sortFilter });
    }, 400);

    return () => clearTimeout(debounceTimeout.current);
  }, [searchTerm]);

  // Genre change
  useEffect(() => {
    onGenreFilterChange(genreFilter);
    saveFilters({ searchTerm, genreFilter, sortFilter });
  }, [genreFilter]);

  // Sort change
  useEffect(() => {
    onSortFilterChange(sortFilter);
    saveFilters({ searchTerm, genreFilter, sortFilter });
  }, [sortFilter]);

  const saveFilters = (filters) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      console.warn('Could not save filters', e);
    }
  };

  const clearAll = () => {
    setSearchTerm('');
    setGenreFilter('default');
    setSortFilter('default');
    onSearchTermChange('');
    onGenreFilterChange('default');
    onSortFilterChange('default');
    saveFilters({ searchTerm: '', genreFilter: 'default', sortFilter: 'default' });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="search-filter-container">
      <div className="search-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search media..."
          value={searchTerm}
          onChange={handleSearch}
        />
        {searchTerm && (
          <button
            className="clear-button"
            onClick={handleClearSearch}
            aria-label="Clear search"
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <select
        className="sort-dropdown"
        value={genreFilter}
        onChange={(e) => setGenreFilter(e.target.value)}
      >
        <option value="default">All genres</option>
        <option value="action">Action</option>
        <option value="adventure">Adventure</option>
        <option value="animation">Animation</option>
        <option value="comedy">Comedy</option>
        <option value="crime">Crime</option>
        <option value="documentary">Documentary</option>
        <option value="drama">Drama</option>
        <option value="family">Family</option>
        <option value="fantasy">Fantasy</option>
        <option value="history">History</option>
        <option value="horror">Horror</option>
        <option value="mystery">Mystery</option>
        <option value="romance">Romance</option>
        <option value="sci-fi">Sci-Fi</option>
        <option value="war">War</option>
        <option value="thriller">Thriller</option>
      </select>

      <select
        className="sort-dropdown"
        value={sortFilter}
        onChange={(e) => setSortFilter(e.target.value)}
      >
        <option value="default">Sort by</option>
        <option value="mostPopular">Most Popular</option>
        <option value="leastPopular">Least Popular</option>
        <option value="highestRated">Highest Rated</option>
        <option value="yearNewest">Year (Newest First)</option>
        <option value="yearOldest">Year (Oldest First)</option>
        <option value="az">A-Z</option>
      </select>

      <div className="clear-filters">
        <button className="clear-filters-button" onClick={clearAll}>
          Clear all filters
        </button>
      </div>
    </div>
  );
};

export default SearchAndFilter;
