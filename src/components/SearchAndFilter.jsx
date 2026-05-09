import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import "./SearchAndFilter.css";

const LOCAL_STORAGE_KEY = "mediaFilters";

function SearchAndFilter({
  initialSearchTerm = "",
  initialGenreFilter = "default",
  initialSortFilter = "default",
  onSearchTermChange = () => {},
  onGenreFilterChange = () => {},
  onSortFilterChange = () => {},
  onLoadAllMovies = () => {},
}) {
  const debounceTimeout = useRef(null);

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [genreFilter, setGenreFilter] = useState(initialGenreFilter);
  const [sortFilter, setSortFilter] = useState(initialSortFilter);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));

      if (!saved) return;

      if (initialSearchTerm === "" && saved.searchTerm) {
        setSearchTerm(saved.searchTerm);
      }

      if (initialGenreFilter === "default" && saved.genreFilter) {
        setGenreFilter(saved.genreFilter);
      }

      if (initialSortFilter === "default" && saved.sortFilter) {
        setSortFilter(saved.sortFilter);
      }
    } catch (e) {
      console.warn("Could not read saved filters", e);
    }
  }, [initialSearchTerm, initialGenreFilter, initialSortFilter]);

  const saveFilters = (filters) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      console.warn("Could not save filters", e);
    }
  };

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      onSearchTermChange(searchTerm);
      saveFilters({ searchTerm, genreFilter, sortFilter });
    }, 350);

    return () => clearTimeout(debounceTimeout.current);
  }, [searchTerm, genreFilter, sortFilter, onSearchTermChange]);

  useEffect(() => {
    onGenreFilterChange(genreFilter);
    saveFilters({ searchTerm, genreFilter, sortFilter });
  }, [genreFilter, searchTerm, sortFilter, onGenreFilterChange]);

  useEffect(() => {
    onSortFilterChange(sortFilter);
    saveFilters({ searchTerm, genreFilter, sortFilter });
  }, [sortFilter, searchTerm, genreFilter, onSortFilterChange]);

  const clearAll = () => {
    setSearchTerm("");
    setGenreFilter("default");
    setSortFilter("default");

    onSearchTermChange("");
    onGenreFilterChange("default");
    onSortFilterChange("default");

    saveFilters({
      searchTerm: "",
      genreFilter: "default",
      sortFilter: "default",
    });
  };

  const confirmLoadAll = () => {
    toast(
      <div className="toast-confirm-container">
        <p className="toast-confirm-text">
          Load a bigger library? On weaker phones this can reduce performance.
        </p>

        <div className="toast-confirm-buttons">
          <button
            className="toast-btn-yes"
            onClick={() => {
              toast.dismiss();
              chooseLoadAmount();
            }}
          >
            Continue
          </button>

          <button className="toast-btn-cancel" onClick={() => toast.dismiss()}>
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        position: "bottom-right",
        className: "themed-toast",
      }
    );
  };

  const chooseLoadAmount = () => {
    const options = [
      { label: "100", pages: 5 },
      { label: "250", pages: 13 },
      { label: "500", pages: 25 },
    ];

    toast(
      <div className="toast-confirm-container">
        <p className="toast-confirm-text">
          Choose how many titles you want to load.
        </p>

        <div className="toast-confirm-buttons">
          {options.map((option) => (
            <button
              key={option.label}
              className="toast-btn-yes"
              onClick={() => {
                toast.dismiss();
                onLoadAllMovies(option.pages);
              }}
            >
              {option.label}
            </button>
          ))}

          <button className="toast-btn-cancel" onClick={() => toast.dismiss()}>
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        position: "bottom-right",
        className: "themed-toast",
      }
    );
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    genreFilter !== "default" ||
    sortFilter !== "default";

  return (
    <div className="search-filter-container">
      <div className="search-filter-top">
        <div className="search-wrapper">
          <i className="bx bx-search search-icon"></i>

          <input
            type="text"
            className="search-input"
            placeholder="Search movies or series..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm && (
            <button
              className="clear-button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <button className="load-all-button" onClick={confirmLoadAll}>
          Load more
        </button>
      </div>

      <div className="filter-row">
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
          <option value="yearNewest">Newest First</option>
          <option value="yearOldest">Oldest First</option>
          <option value="az">A-Z</option>
        </select>

        <button
          className="clear-filters-button"
          onClick={clearAll}
          disabled={!hasActiveFilters}
        >
          Clear filters
        </button>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default SearchAndFilter;