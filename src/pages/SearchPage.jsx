import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Fuse from "fuse.js";
import "./SearchPage.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

function getTitle(item) {
  return item.title || item.name || item.original_title || item.original_name || "Untitled";
}

function normalizeText(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [results, setResults] = useState([]);
  const [fuzzyResults, setFuzzyResults] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(false);

  const fuse = useMemo(() => {
    return new Fuse(library, {
      keys: ["title", "name", "original_title", "original_name", "searchTitle"],
      threshold: 0.45,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [library]);

  useEffect(() => {
    async function loadFuzzyLibrary() {
      try {
        const urls = [
          `${BASE_URL}/movie/popular?api_key=${API_KEY}`,
          `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`,
          `${BASE_URL}/tv/popular?api_key=${API_KEY}`,
          `${BASE_URL}/tv/top_rated?api_key=${API_KEY}`,
          `${BASE_URL}/trending/all/week?api_key=${API_KEY}`,
        ];

        const responses = await Promise.all(urls.map((url) => fetch(url)));
        const data = await Promise.all(responses.map((res) => res.json()));

        const combined = data
          .flatMap((group) => group.results || [])
          .filter(
            (item) =>
              (item.media_type === "movie" ||
                item.media_type === "tv" ||
                item.title ||
                item.name) &&
              item.poster_path
          )
          .map((item) => ({
            ...item,
            media_type: item.media_type || (item.title ? "movie" : "tv"),
            searchTitle: normalizeText(getTitle(item)),
          }));

        const unique = Array.from(
          new Map(combined.map((item) => [`${item.media_type}-${item.id}`, item])).values()
        );

        setLibrary(unique);
      } catch (error) {
        console.error("Fuzzy library error:", error);
      }
    }

    loadFuzzyLibrary();
  }, []);

  useEffect(() => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setResults([]);
      setFuzzyResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(
            cleanQuery
          )}&include_adult=false`
        );

        const data = await res.json();

        let tmdbResults = (data.results || []).filter(
          (item) =>
            (item.media_type === "movie" || item.media_type === "tv") &&
            item.poster_path
        );

        if (filter !== "all") {
          tmdbResults = tmdbResults.filter((item) => item.media_type === filter);
        }

        setResults(tmdbResults);
        setFuzzyResults([]);

        if (tmdbResults.length === 0 && cleanQuery.length >= 2) {
          let fuzzy = fuse.search(normalizeText(cleanQuery)).map((result) => result.item);

          if (filter !== "all") {
            fuzzy = fuzzy.filter((item) => item.media_type === filter);
          }

          setFuzzyResults(fuzzy.slice(0, 12));
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
        setFuzzyResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, filter, fuse]);

  const cardsToShow = results.length > 0 ? results : fuzzyResults;

  return (
    <div className="search-page">
      <div className="search-hero">
        <h1>Find your next movie</h1>
        <p>Search movies and series from one place.</p>
      </div>

      <div className="search-controls">
        <div className="search-box">
          <i className="bx bx-search"></i>
          <input
            type="text"
            placeholder="Search movies or series..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="movie">Movies</option>
          <option value="tv">Series</option>
        </select>
      </div>

      {loading && <p className="search-message">Searching...</p>}

      {!loading && query && results.length === 0 && fuzzyResults.length === 0 && (
        <p className="search-message">No results found.</p>
      )}

      {!loading && query && results.length === 0 && fuzzyResults.length > 0 && (
        <div className="did-you-mean">
          <p>No exact results found.</p>
          <h2>Did you mean this?</h2>
        </div>
      )}

      <div className="search-grid">
        {cardsToShow.map((item) => {
          const title = getTitle(item);
          const link = item.media_type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`;

          return (
            <Link to={link} className="search-card" key={`${item.media_type}-${item.id}`}>
              <img src={`${IMG_URL}${item.poster_path}`} alt={title} />

              <div className="search-card-title">{title}</div>
              <div className="search-card-type">
                {item.media_type === "tv" ? "Series" : "Movie"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}