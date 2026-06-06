import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Fuse from "fuse.js";
import "./SearchPage.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const PLACEHOLDER_IMG =
  "https://placehold.co/500x750/10131f/ffffff?text=No+Poster";

function getTitle(item) {
  return (
    item.title ||
    item.name ||
    item.original_title ||
    item.original_name ||
    "Untitled"
  );
}

function getYear(item) {
  const date = item.release_date || item.first_air_date;
  return date ? date.slice(0, 4) : "N/A";
}

function getRating(item) {
  if (!item.vote_average && item.vote_average !== 0) return "N/A";
  return item.vote_average.toFixed(1);
}

function getMediaType(item) {
  if (item.media_type === "tv") return "tv";
  return "movie";
}

function getDetailsPath(item) {
  return getMediaType(item) === "tv" ? `/series/${item.id}` : `/movie/${item.id}`;
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
          `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US`,
          `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US`,
          `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US`,
          `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US`,
          `${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=en-US`,
        ];

        const responses = await Promise.all(urls.map((url) => fetch(url)));
        const data = await Promise.all(responses.map((res) => res.json()));

        const combined = data
          .flatMap((group) => group.results || [])
          .filter((item) => {
            const mediaType = item.media_type || (item.title ? "movie" : "tv");
            return (
              (mediaType === "movie" || mediaType === "tv") &&
              item.poster_path
            );
          })
          .map((item) => ({
            ...item,
            media_type: item.media_type || (item.title ? "movie" : "tv"),
            searchTitle: normalizeText(getTitle(item)),
          }));

        const unique = Array.from(
          new Map(
            combined.map((item) => [`${item.media_type}-${item.id}`, item])
          ).values()
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
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
            cleanQuery
          )}&include_adult=false`
        );

        const data = await res.json();

        let tmdbResults = (data.results || [])
          .filter((item) => {
            return (
              (item.media_type === "movie" || item.media_type === "tv") &&
              item.poster_path
            );
          })
          .map((item) => ({
            ...item,
            media_type: item.media_type,
          }));

        if (filter !== "all") {
          tmdbResults = tmdbResults.filter((item) => item.media_type === filter);
        }

        setResults(tmdbResults);
        setFuzzyResults([]);

        if (tmdbResults.length === 0 && cleanQuery.length >= 2) {
          let fuzzy = fuse
            .search(normalizeText(cleanQuery))
            .map((result) => result.item);

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
  const hasQuery = query.trim().length > 0;
  const showDidYouMean =
    !loading && hasQuery && results.length === 0 && fuzzyResults.length > 0;
  const showEmpty =
    !loading && hasQuery && results.length === 0 && fuzzyResults.length === 0;

  return (
    <main className="search-page">
      <section className="search-hero">
        <span>Prestige Search</span>
        <h1>Find your next obsession</h1>
        <p>
          Search movies and TV series from one cinematic place. Filter your
          results and jump straight into details.
        </p>
      </section>

      <section className="search-controls">
        <div className="search-box">
          <i className="bx bx-search"></i>

          <input
            type="text"
            placeholder="Search movies or series..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          {query && (
            <button
              className="search-clear"
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <i className="bx bx-x"></i>
            </button>
          )}
        </div>

        <div className="search-filter" aria-label="Search filter">
          <button
            type="button"
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            type="button"
            className={filter === "movie" ? "active" : ""}
            onClick={() => setFilter("movie")}
          >
            Movies
          </button>

          <button
            type="button"
            className={filter === "tv" ? "active" : ""}
            onClick={() => setFilter("tv")}
          >
            Series
          </button>
        </div>
      </section>

      {loading && (
        <section className="search-state">
          <div className="search-spinner"></div>
          <p>Searching...</p>
        </section>
      )}

      {!loading && !hasQuery && (
        <section className="search-state search-state-intro">
          <i className="bx bx-search-alt"></i>
          <h2>Start searching</h2>
          <p>Type a movie or TV series name to discover results.</p>
        </section>
      )}

      {showEmpty && (
        <section className="search-state">
          <i className="bx bx-error-circle"></i>
          <h2>No results found</h2>
          <p>Try another title or change the filter.</p>
        </section>
      )}

      {showDidYouMean && (
        <section className="did-you-mean">
          <span>No exact results found</span>
          <h2>Did you mean this?</h2>
        </section>
      )}

      {cardsToShow.length > 0 && (
        <section className="search-grid">
          {cardsToShow.map((item) => {
            const title = getTitle(item);
            const mediaType = getMediaType(item);
            const link = getDetailsPath(item);

            return (
              <Link
                to={link}
                className="search-card"
                key={`${mediaType}-${item.id}`}
              >
                <div className="search-card-poster">
                  <img
                    src={
                      item.poster_path
                        ? `${IMG_URL}${item.poster_path}`
                        : PLACEHOLDER_IMG
                    }
                    alt={title}
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_IMG;
                    }}
                  />

                  <div className="search-card-overlay">
                    <span>
                      <i className="bx bxs-star"></i>
                      {getRating(item)}
                    </span>

                    <span>{getYear(item)}</span>
                  </div>
                </div>

                <div className="search-card-info">
                  <h3>{title}</h3>

                  <p>{mediaType === "tv" ? "Series" : "Movie"}</p>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}