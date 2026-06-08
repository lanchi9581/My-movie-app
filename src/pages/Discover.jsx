import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MovieCard from "../components/MovieCard/MovieCard";
import CustomSelect from "../components/CustomSelect/CustomSelect";
import "./Discover.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";

const TYPE_OPTIONS = [
  { value: "movie", label: "Movies" },
  { value: "tv", label: "Series" },
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popular" },
  { value: "vote_average.desc", label: "Top Rated" },
  { value: "primary_release_date.desc", label: "Newest Movies" },
  { value: "first_air_date.desc", label: "Newest Series" },
];

const MOVIE_GENRES = [
  { value: "all", label: "All Genres" },
  { value: "28", label: "Action" },
  { value: "12", label: "Adventure" },
  { value: "16", label: "Animation" },
  { value: "35", label: "Comedy" },
  { value: "80", label: "Crime" },
  { value: "18", label: "Drama" },
  { value: "27", label: "Horror" },
  { value: "10749", label: "Romance" },
  { value: "878", label: "Sci-Fi" },
  { value: "53", label: "Thriller" },
];

const SERIES_GENRES = [
  { value: "all", label: "All Genres" },
  { value: "10759", label: "Action & Adventure" },
  { value: "16", label: "Animation" },
  { value: "35", label: "Comedy" },
  { value: "80", label: "Crime" },
  { value: "18", label: "Drama" },
  { value: "9648", label: "Mystery" },
  { value: "10765", label: "Sci-Fi & Fantasy" },
  { value: "10751", label: "Family" },
  { value: "10768", label: "War & Politics" },
];

function normalizeItem(item, type) {
  return {
    ...item,
    media_type: type,
  };
}

function Discover() {
  const [mediaType, setMediaType] = useState("movie");
  const [genre, setGenre] = useState("all");
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [query, setQuery] = useState("");

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("idle");

  const observerRef = useRef(null);
  const loadingRef = useRef(false);
  const seenIdsRef = useRef(new Set());

  const genres = mediaType === "movie" ? MOVIE_GENRES : SERIES_GENRES;
  const isSearching = query.trim().length > 1;
  const hasMore = page <= totalPages;

  const title = mediaType === "movie" ? "Discover Movies" : "Discover Series";

  const activeSortOptions = useMemo(() => {
    if (mediaType === "movie") {
      return SORT_OPTIONS.filter((option) => option.value !== "first_air_date.desc");
    }

    return SORT_OPTIONS.filter(
      (option) => option.value !== "primary_release_date.desc"
    );
  }, [mediaType]);

  const fetchItems = useCallback(
    async (pageNumber) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setStatus(pageNumber === 1 ? "loading" : "loading-more");

      try {
        const cleanQuery = query.trim();
        const endpoint = isSearching
          ? `/search/${mediaType}`
          : `/discover/${mediaType}`;

        const genreParam = !isSearching && genre !== "all" ? `&with_genres=${genre}` : "";
        const sortParam = !isSearching ? `&sort_by=${sortBy}` : "";

        const qualityFilter =
            mediaType === "movie"
                ? "&vote_count.gte=1000"
                : "&vote_count.gte=400";

        const searchParam = isSearching
          ? `&query=${encodeURIComponent(cleanQuery)}`
          : "";

        const response = await fetch(
          `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US&page=${pageNumber}&include_adult=false&include_video=false${sortParam}${genreParam}${qualityFilter}${searchParam}`
        );

        if (!response.ok) {
          throw new Error("Failed to load discover feed");
        }

        const data = await response.json();
        const results = Array.isArray(data.results) ? data.results : [];

        const cleanResults = results
          .map((item) => normalizeItem(item, mediaType))
          .filter((item) => {
            if (!item?.id || !item.poster_path) return false;

            const key = `${mediaType}-${item.id}`;
            if (seenIdsRef.current.has(key)) return false;

            seenIdsRef.current.add(key);
            return true;
          });

        setItems((prev) =>
          pageNumber === 1 ? cleanResults : [...prev, ...cleanResults]
        );

        setTotalPages(Math.min(data.total_pages || 1, 500));
        setPage(pageNumber + 1);
        setStatus("success");
      } catch (error) {
        console.error("Discover page error:", error);
        setStatus("error");
      } finally {
        loadingRef.current = false;
      }
    },
    [mediaType, genre, sortBy, query, isSearching]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setItems([]);
      setPage(1);
      setTotalPages(1);
      setStatus("idle");
      seenIdsRef.current = new Set();
      fetchItems(1);
    }, isSearching ? 350 : 0);

    return () => clearTimeout(timeout);
  }, [fetchItems, isSearching]);

  useEffect(() => {
    if (mediaType === "movie" && sortBy === "first_air_date.desc") {
      setSortBy("popularity.desc");
    }

    if (mediaType === "tv" && sortBy === "primary_release_date.desc") {
      setSortBy("popularity.desc");
    }
  }, [mediaType, sortBy]);

  function handleTypeChange(nextType) {
    setMediaType(nextType);
    setGenre("all");
    setQuery("");
  }

  const lastItemRef = useCallback(
    (node) => {
      if (status === "loading" || status === "loading-more") return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
            fetchItems(page);
          }
        },
        {
          root: null,
          rootMargin: "700px",
          threshold: 0.01,
        }
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [fetchItems, hasMore, page, status]
  );

  return (
    <main className={`discover-page discover-${mediaType}`}>
      <section className="discover-top">
        <div className="discover-intro">
          <span className="discover-kicker">
            <i className="bx bx-compass"></i>
            Prestige Discover
          </span>

          <h1>{title}</h1>

          <p>
            Search, filter and explore a premium endless feed of movies and
            series powered by TMDB.
          </p>
        </div>

        <div className="discover-tabs" aria-label="Discover type">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={mediaType === option.value ? "active" : ""}
              onClick={() => handleTypeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="discover-filter-bar">
        <div className="discover-search">
          <i className="bx bx-search"></i>
          <input
            type="search"
            value={query}
            placeholder={
              mediaType === "movie" ? "Search movies..." : "Search series..."
            }
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <CustomSelect
          value={genre}
          onChange={setGenre}
          options={genres}
          className="discover-select"
        />

        <CustomSelect
          value={sortBy}
          onChange={setSortBy}
          options={activeSortOptions}
          className="discover-select"
        />
      </section>

      {items.length > 0 && (
        <section className="discover-grid">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <div
                key={`${item.media_type}-${item.id}`}
                ref={isLast ? lastItemRef : null}
                className="discover-card-wrap"
              >
                <MovieCard movie={item} index={index} />
              </div>
            );
          })}
        </section>
      )}

      {!items.length && status !== "loading" && (
        <div className="discover-empty">
          {status === "error"
            ? "Something went wrong. Try again."
            : "No titles found."}
        </div>
      )}

      {(status === "loading" || status === "loading-more") && (
        <div className="discover-loader">
          <span></span>
          Loading more titles...
        </div>
      )}
    </main>
  );
}

export default Discover;