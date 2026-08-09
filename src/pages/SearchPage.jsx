import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Fuse from "fuse.js";
import "./SearchPage.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const PLACEHOLDER_IMG =
  "https://placehold.co/500x750/10131f/ffffff?text=No+Poster";

const MIN_VOTES = 250;
const FUZZY_PAGES = 3;

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
  return getMediaType(item) === "tv"
    ? `/series/${item.id}`
    : `/movie/${item.id}`;
}

function normalizeText(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function passesVoteFilter(item, hideLowVotes) {
  if (!hideLowVotes) return true;

  return (item.vote_count || 0) >= MIN_VOTES;
}

function dedupeItems(items) {
  return Array.from(
    new Map(
      items.map((item) => [
        `${getMediaType(item)}-${item.id}`,
        item,
      ])
    ).values()
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const [hideLowVotes, setHideLowVotes] = useState(true);
  const [reviewMenuOpen, setReviewMenuOpen] = useState(false);

  const [results, setResults] = useState([]);
  const [fuzzyResults, setFuzzyResults] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(false);

  const reviewFilterRef = useRef(null);

  const fuse = useMemo(() => {
    return new Fuse(library, {
      keys: [
        {
          name: "title",
          weight: 1,
        },
        {
          name: "name",
          weight: 1,
        },
        {
          name: "original_title",
          weight: 0.7,
        },
        {
          name: "original_name",
          weight: 0.7,
        },
        {
          name: "searchTitle",
          weight: 1.4,
        },
      ],

      threshold: 0.38,
      ignoreLocation: true,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
    });
  }, [library]);

  /*
   * Close the review dropdown when clicking
   * anywhere outside of it.
   */
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        reviewFilterRef.current &&
        !reviewFilterRef.current.contains(event.target)
      ) {
        setReviewMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /*
   * Load a larger collection of popular / top-rated
   * titles for typo correction with Fuse.
   */
  useEffect(() => {
    async function loadFuzzyLibrary() {
      try {
        const baseEndpoints = [
          "/movie/popular",
          "/movie/top_rated",
          "/tv/popular",
          "/tv/top_rated",
          "/trending/all/week",
        ];

        const urls = baseEndpoints.flatMap((endpoint) =>
          Array.from(
            { length: FUZZY_PAGES },
            (_, index) => {
              const page = index + 1;

              return `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US&page=${page}`;
            }
          )
        );

        const responses = await Promise.all(
          urls.map((url) => fetch(url))
        );

        const data = await Promise.all(
          responses.map((response) =>
            response.json()
          )
        );

        const combined = data
          .flatMap((group) => group.results || [])

          .filter((item) => {
            const mediaType =
              item.media_type ||
              (item.title ? "movie" : "tv");

            return (
              (mediaType === "movie" ||
                mediaType === "tv") &&
              item.poster_path
            );
          })

          .map((item) => ({
            ...item,

            media_type:
              item.media_type ||
              (item.title ? "movie" : "tv"),

            searchTitle: normalizeText(
              getTitle(item)
            ),
          }));

        setLibrary(
          dedupeItems(combined)
        );
      } catch (error) {
        console.error(
          "Fuzzy library error:",
          error
        );
      }
    }

    loadFuzzyLibrary();
  }, []);

  /*
   * Main TMDB search.
   */
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
        const response = await fetch(
          `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
            cleanQuery
          )}&include_adult=false&page=1`
        );

        const data =
          await response.json();

        let tmdbResults =
          (data.results || [])

            .filter((item) => {
              return (
                (item.media_type === "movie" ||
                  item.media_type === "tv") &&
                item.poster_path &&
                passesVoteFilter(
                  item,
                  hideLowVotes
                )
              );
            })

            .map((item) => ({
              ...item,
              media_type: item.media_type,
            }));

        /*
         * Apply All / Movies / Series filter.
         */
        if (filter !== "all") {
          tmdbResults =
            tmdbResults.filter(
              (item) =>
                item.media_type === filter
            );
        }

        setResults(tmdbResults);

        /*
         * Run Fuse even when TMDB finds something.
         *
         * This is important because TMDB may return
         * irrelevant results for a typo.
         *
         * Example:
         * reachar -> Reacher
         */
        if (cleanQuery.length >= 2) {
          let fuzzy = fuse
            .search(
              normalizeText(cleanQuery)
            )

            .filter(
              (result) =>
                result.score <= 0.38
            )

            .map(
              (result) =>
                result.item
            )

            .filter((item) =>
              passesVoteFilter(
                item,
                hideLowVotes
              )
            );

          if (filter !== "all") {
            fuzzy =
              fuzzy.filter(
                (item) =>
                  item.media_type === filter
              );
          }

          /*
           * Remove duplicate results already
           * returned by TMDB.
           */
          const directKeys =
            new Set(
              tmdbResults.map(
                (item) =>
                  `${item.media_type}-${item.id}`
              )
            );

          fuzzy =
            fuzzy.filter(
              (item) =>
                !directKeys.has(
                  `${item.media_type}-${item.id}`
                )
            );

          setFuzzyResults(
            fuzzy.slice(0, 12)
          );
        } else {
          setFuzzyResults([]);
        }
      } catch (error) {
        console.error(
          "Search error:",
          error
        );

        setResults([]);
        setFuzzyResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () =>
      clearTimeout(timer);
  }, [
    query,
    filter,
    fuse,
    hideLowVotes,
  ]);

  const hasQuery =
    query.trim().length > 0;

  /*
   * Check if TMDB found something that
   * actually resembles the searched title.
   */
  const directMatchesQuery =
    results.some((item) => {
      const title =
        normalizeText(
          getTitle(item)
        );

      const searched =
        normalizeText(query);

      return (
        title === searched ||
        title.startsWith(searched) ||
        searched.startsWith(title)
      );
    });

  /*
   * If TMDB gave weak results but Fuse
   * found a likely typo correction,
   * prefer the Fuse results.
   */
  const shouldPreferFuzzy =
    hasQuery &&
    fuzzyResults.length > 0 &&
    !directMatchesQuery;

  const cardsToShow =
    shouldPreferFuzzy
      ? fuzzyResults
      : results.length > 0
      ? results
      : fuzzyResults;

  const showDidYouMean =
    !loading &&
    hasQuery &&
    fuzzyResults.length > 0 &&
    (results.length === 0 ||
      shouldPreferFuzzy);

  const showEmpty =
    !loading &&
    hasQuery &&
    results.length === 0 &&
    fuzzyResults.length === 0;

  function selectReviewFilter(value) {
    setHideLowVotes(value);
    setReviewMenuOpen(false);
  }

  return (
    <main className="search-page">

      {/* HERO */}

      <section className="search-hero">
        <span>
          Prestige Search
        </span>

        <h1>
          Find your next obsession
        </h1>

        <p>
          Search movies and TV series
          from one cinematic place.
          Filter your results and jump
          straight into details.
        </p>
      </section>

      {/* SEARCH CONTROLS */}

      <section className="search-controls">

        {/* SEARCH BAR */}

        <div className="search-box">
          <i className="bx bx-search"></i>

          <input
            type="text"
            placeholder="Search movies or series..."
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            autoFocus
          />

          {query && (
            <button
              className="search-clear"
              type="button"
              onClick={() =>
                setQuery("")
              }
              aria-label="Clear search"
            >
              <i className="bx bx-x"></i>
            </button>
          )}
        </div>

        {/* MEDIA FILTER */}

        <div
          className="search-filter"
          aria-label="Search filter"
        >
          <button
            type="button"
            className={
              filter === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("all")
            }
          >
            All
          </button>

          <button
            type="button"
            className={
              filter === "movie"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("movie")
            }
          >
            Movies
          </button>

          <button
            type="button"
            className={
              filter === "tv"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("tv")
            }
          >
            Series
          </button>
        </div>

        {/* REVIEW FILTER */}

        <div
          className="review-filter"
          ref={reviewFilterRef}
        >
          <span className="review-filter-label">
            Filter low review titles
          </span>

          <button
            type="button"
            className={`review-filter-button ${
              reviewMenuOpen
                ? "open"
                : ""
            }`}
            onClick={() =>
              setReviewMenuOpen(
                (current) =>
                  !current
              )
            }
            aria-expanded={
              reviewMenuOpen
            }
          >
            <span className="review-filter-icon">
              <i className="bx bx-bar-chart-alt-2"></i>
            </span>

            <span className="review-filter-button-text">
              {hideLowVotes
                ? `Minimum ${MIN_VOTES} reviews`
                : "Show all titles"}
            </span>

            <i
              className={`bx bx-chevron-down review-chevron ${
                reviewMenuOpen
                  ? "open"
                  : ""
              }`}
            ></i>
          </button>

          {/* REVIEW DROPDOWN */}

          {reviewMenuOpen && (
            <div className="review-dropdown">

              <div className="review-dropdown-title">
                Review filter
              </div>

              {/* 250 OPTION */}

              <button
                type="button"
                className={`review-option ${
                  hideLowVotes
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  selectReviewFilter(
                    true
                  )
                }
              >
                <span className="review-option-check">
                  {hideLowVotes && (
                    <i className="bx bx-check"></i>
                  )}
                </span>

                <span className="review-option-icon">
                  <i className="bx bx-bar-chart-alt-2"></i>
                </span>

                <span className="review-option-content">
                  <strong>
                    Minimum{" "}
                    {MIN_VOTES} reviews
                  </strong>

                  <small>
                    Hide titles with
                    less than{" "}
                    {MIN_VOTES} reviews
                  </small>
                </span>

                <span
                  className={`review-status ${
                    hideLowVotes
                      ? "active"
                      : ""
                  }`}
                >
                  ON
                </span>
              </button>

              {/* SHOW ALL OPTION */}

              <button
                type="button"
                className={`review-option ${
                  !hideLowVotes
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  selectReviewFilter(
                    false
                  )
                }
              >
                <span className="review-option-check">
                  {!hideLowVotes && (
                    <i className="bx bx-check"></i>
                  )}
                </span>

                <span className="review-option-icon">
                  <i className="bx bx-list-ul"></i>
                </span>

                <span className="review-option-content">
                  <strong>
                    Show all titles
                  </strong>

                  <small>
                    Include titles with
                    any number of reviews
                  </small>
                </span>

                <span
                  className={`review-status ${
                    !hideLowVotes
                      ? "active"
                      : ""
                  }`}
                >
                  ALL
                </span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* LOADING */}

      {loading && (
        <section className="search-state">
          <div className="search-spinner"></div>

          <p>
            Searching...
          </p>
        </section>
      )}

      {/* START SEARCHING */}

      {!loading &&
        !hasQuery && (
          <section className="search-state search-state-intro">
            <i className="bx bx-search-alt"></i>

            <h2>
              Start searching
            </h2>

            <p>
              Type a movie or TV
              series name to discover
              results.
            </p>
          </section>
        )}

      {/* NO RESULTS */}

      {showEmpty && (
        <section className="search-state">
          <i className="bx bx-error-circle"></i>

          <h2>
            No results found
          </h2>

          <p>
            Try another title,
            change the filter,
            or show all titles.
          </p>
        </section>
      )}

      {/* FUZZY SEARCH */}

      {showDidYouMean && (
        <section className="did-you-mean">
          <span>
            No exact results found
          </span>

          <h2>
            Did you mean this?
          </h2>
        </section>
      )}

      {/* RESULTS */}

      {cardsToShow.length > 0 && (
        <section className="search-grid">
          {cardsToShow.map(
            (item) => {
              const title =
                getTitle(item);

              const mediaType =
                getMediaType(item);

              const link =
                getDetailsPath(item);

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
                      onError={(
                        event
                      ) => {
                        event.currentTarget.src =
                          PLACEHOLDER_IMG;
                      }}
                    />

                    <div className="search-card-overlay">
                      <span>
                        <i className="bx bxs-star"></i>

                        {getRating(
                          item
                        )}
                      </span>

                      <span>
                        {getYear(
                          item
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="search-card-info">
                    <h3>
                      {title}
                    </h3>

                    <p>
                      {mediaType ===
                      "tv"
                        ? "Series"
                        : "Movie"}
                    </p>
                  </div>
                </Link>
              );
            }
          )}
        </section>
      )}
    </main>
  );
}