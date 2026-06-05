import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import MovieCard from "../components/MovieCard";

import "./Movies.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";

const BACKDROP_URL = "https://image.tmdb.org/t/p/w1280";
const POSTER_URL = "https://image.tmdb.org/t/p/w342";

const INITIAL_VISIBLE = 9;
const LOAD_MORE = 4;
const MAX_SECTION_PAGES = 6;
const PREFETCH_OFFSET = 6;
const SCROLL_ANIMATION_MS = 600;
const AUTO_LOAD_SCROLL_OFFSET = 420;

const SECTIONS = [
  { id: "trending", title: "Trending Movies", endpoint: "/trending/movie/day" },
  { id: "now-playing", title: "Now Playing", endpoint: "/movie/now_playing" },
  { id: "upcoming", title: "New & Upcoming", endpoint: "/movie/upcoming" },
  { id: "popular", title: "Popular Movies", endpoint: "/movie/popular" },
  { id: "top-rated", title: "Top Rated", endpoint: "/movie/top_rated" },
  {
    id: "action",
    title: "Action Picks",
    endpoint: "/discover/movie",
    params: "&with_genres=28&sort_by=popularity.desc",
  },
  {
    id: "horror",
    title: "Horror Nights",
    endpoint: "/discover/movie",
    params: "&with_genres=27&sort_by=popularity.desc",
  },
  {
    id: "comedy",
    title: "Comedy Hits",
    endpoint: "/discover/movie",
    params: "&with_genres=35&sort_by=popularity.desc",
  },
];

const preloadedPosterUrls = new Set();

function buildSectionUrl(section, page = 1) {
  return `${BASE_URL}${section.endpoint}?api_key=${API_KEY}&language=en-US&page=${page}${
    section.params || ""
  }`;
}

function getMovieKey(movie) {
  if (!movie?.id) return null;
  return String(movie.id);
}

async function fetchRawSectionPage(section, page) {
  const res = await fetch(buildSectionUrl(section, page));

  if (!res.ok) {
    throw new Error(`Failed to fetch ${section.title}, page ${page}`);
  }

  const data = await res.json();
  return data.results || [];
}

function mergeUniqueMovies(oldMovies, newMovies) {
  const map = new Map();

  [...oldMovies, ...newMovies].forEach((movie) => {
    const key = getMovieKey(movie);

    if (key) {
      map.set(key, movie);
    }
  });

  return Array.from(map.values());
}

function filterMoviesForSection(fetchedMovies, sectionId, allSectionsData) {
  const usedMovieIds = new Set();

  Object.entries(allSectionsData).forEach(([currentSectionId, movies]) => {
    if (currentSectionId === sectionId) return;

    movies.forEach((movie) => {
      const key = getMovieKey(movie);

      if (key) {
        usedMovieIds.add(key);
      }
    });
  });

  return fetchedMovies.filter((movie) => {
    const key = getMovieKey(movie);

    if (!key || usedMovieIds.has(key)) return false;

    usedMovieIds.add(key);
    return true;
  });
}

function getPosterUrl(movie) {
  if (!movie?.poster_path) return null;
  return `${POSTER_URL}${movie.poster_path}`;
}

function preloadPoster(movie) {
  const posterUrl = getPosterUrl(movie);

  if (!posterUrl || preloadedPosterUrls.has(posterUrl)) return;

  preloadedPosterUrls.add(posterUrl);

  const img = new Image();
  img.src = posterUrl;
}

function getCardScrollDistance(row, count) {
  const card = row.querySelector(".movie-card");

  if (!card) return 520;

  const rowStyles = window.getComputedStyle(row);
  const gap = parseFloat(rowStyles.columnGap || rowStyles.gap || "0") || 0;

  return (card.getBoundingClientRect().width + gap) * count;
}

function Movies() {
  const [trailerMovies, setTrailerMovies] = useState([]);
  const [activeTrailerIndex, setActiveTrailerIndex] = useState(0);

  const [sectionsData, setSectionsData] = useState({});
  const [sectionPages, setSectionPages] = useState({});
  const [visibleCounts, setVisibleCounts] = useState({});
  const [loadingMoreSections, setLoadingMoreSections] = useState({});
  const [animatingRows, setAnimatingRows] = useState({});
  const [rowCanGoLeft, setRowCanGoLeft] = useState({});

  const [loading, setLoading] = useState(true);

  const loadMoreLocksRef = useRef(new Set());

  useEffect(() => {
    async function fetchTrailerMovies() {
      try {
        const movies = await fetchRawSectionPage(
          {
            title: "Upcoming trailers",
            endpoint: "/movie/upcoming",
          },
          1
        );

        const filteredMovies = movies
          .filter((movie) => movie.backdrop_path)
          .slice(0, 8);

        setTrailerMovies(filteredMovies);
      } catch (error) {
        console.error("Failed to fetch trailer movies:", error);
      }
    }

    fetchTrailerMovies();
  }, []);

  useEffect(() => {
    async function fetchSections() {
      setLoading(true);

      try {
        const firstPages = await Promise.all(
          SECTIONS.map(async (section) => {
            const movies = await fetchRawSectionPage(section, 1);

            return {
              section,
              movies,
            };
          })
        );

        const usedMovieIds = new Set();
        const nextData = {};
        const nextPages = {};
        const nextVisibleCounts = {};
        const nextCanGoLeft = {};

        for (const result of firstPages) {
          const { section } = result;

          let currentPage = 1;
          const uniqueMovies = [];

          const addUniqueMovies = (movies) => {
            movies.forEach((movie) => {
              const key = getMovieKey(movie);

              if (!key || usedMovieIds.has(key)) return;

              usedMovieIds.add(key);
              uniqueMovies.push(movie);
            });
          };

          addUniqueMovies(result.movies);

          while (
            uniqueMovies.length < INITIAL_VISIBLE &&
            currentPage < MAX_SECTION_PAGES
          ) {
            currentPage += 1;

            try {
              const moreMovies = await fetchRawSectionPage(
                section,
                currentPage
              );

              addUniqueMovies(moreMovies);
            } catch (error) {
              console.error(`Failed to fill section ${section.title}:`, error);
              break;
            }
          }

          nextData[section.id] = uniqueMovies;
          nextPages[section.id] = currentPage;
          nextVisibleCounts[section.id] = Math.min(
            INITIAL_VISIBLE,
            uniqueMovies.length
          );
          nextCanGoLeft[section.id] = false;
        }

        setSectionsData(nextData);
        setSectionPages(nextPages);
        setVisibleCounts(nextVisibleCounts);
        setRowCanGoLeft(nextCanGoLeft);
      } catch (error) {
        console.error("Failed to fetch movie sections:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSections();
  }, []);

  useEffect(() => {
    if (trailerMovies.length <= 1) return;

    const interval = setInterval(() => {
      setActiveTrailerIndex((prev) =>
        prev === trailerMovies.length - 1 ? 0 : prev + 1
      );
    }, 6500);

    return () => clearInterval(interval);
  }, [trailerMovies.length]);

  useEffect(() => {
    if (loading) return;

    const preloadNextImages = () => {
      SECTIONS.forEach((section) => {
        const movies = sectionsData[section.id] || [];
        const visibleCount = visibleCounts[section.id] || INITIAL_VISIBLE;

        movies
          .slice(visibleCount, visibleCount + LOAD_MORE)
          .forEach((movie) => preloadPoster(movie));
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preloadNextImages, {
        timeout: 1500,
      });

      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(preloadNextImages, 400);

    return () => clearTimeout(timeoutId);
  }, [loading, sectionsData, visibleCounts]);

  const activeTrailer = trailerMovies[activeTrailerIndex];

  const upNextMovies = useMemo(() => {
    if (!trailerMovies.length) return [];

    return trailerMovies
      .filter((_, index) => index !== activeTrailerIndex)
      .slice(0, 4);
  }, [trailerMovies, activeTrailerIndex]);

  const goPrevTrailer = (event) => {
    event.preventDefault();

    setActiveTrailerIndex((prev) =>
      prev === 0 ? trailerMovies.length - 1 : prev - 1
    );
  };

  const goNextTrailer = (event) => {
    event.preventDefault();

    setActiveTrailerIndex((prev) =>
      prev === trailerMovies.length - 1 ? 0 : prev + 1
    );
  };

  const setActiveMovie = (movieId) => {
    const index = trailerMovies.findIndex((movie) => movie.id === movieId);

    if (index !== -1) {
      setActiveTrailerIndex(index);
    }
  };

  const setRowLeftState = (sectionId, canGoLeft) => {
    setRowCanGoLeft((prev) => {
      if (prev[sectionId] === canGoLeft) return prev;

      return {
        ...prev,
        [sectionId]: canGoLeft,
      };
    });
  };

  const fetchSectionPage = async (section, page, baseSectionsData) => {
    if (loadingMoreSections[section.id]) {
      return {
        movies: baseSectionsData[section.id] || [],
        sectionsData: baseSectionsData,
      };
    }

    setLoadingMoreSections((prev) => ({
      ...prev,
      [section.id]: true,
    }));

    try {
      const fetchedMovies = await fetchRawSectionPage(section, page);

      const filteredMovies = filterMoviesForSection(
        fetchedMovies,
        section.id,
        baseSectionsData
      );

      const currentMovies = baseSectionsData[section.id] || [];
      const combinedMovies = mergeUniqueMovies(currentMovies, filteredMovies);

      const nextSectionsData = {
        ...baseSectionsData,
        [section.id]: combinedMovies,
      };

      setSectionsData((prev) => {
        const latestFilteredMovies = filterMoviesForSection(
          fetchedMovies,
          section.id,
          prev
        );

        return {
          ...prev,
          [section.id]: mergeUniqueMovies(
            prev[section.id] || [],
            latestFilteredMovies
          ),
        };
      });

      setSectionPages((prev) => ({
        ...prev,
        [section.id]: Math.max(prev[section.id] || 1, page),
      }));

      return {
        movies: combinedMovies,
        sectionsData: nextSectionsData,
      };
    } catch (error) {
      console.error("Failed to fetch more movies:", error);

      return {
        movies: baseSectionsData[section.id] || [],
        sectionsData: baseSectionsData,
      };
    } finally {
      setLoadingMoreSections((prev) => ({
        ...prev,
        [section.id]: false,
      }));
    }
  };

  const loadMoreForSection = async ({
    section,
    row,
    shouldAnimateScroll = false,
  }) => {
    const sectionId = section.id;

    if (!row) return;
    if (loadMoreLocksRef.current.has(sectionId)) return;
    if (animatingRows[sectionId]) return;

    const currentVisible = visibleCounts[sectionId] || INITIAL_VISIBLE;
    const currentPage = sectionPages[sectionId] || 1;
    const currentMovies = sectionsData[sectionId] || [];

    const hasMoreInCurrentData = currentVisible < currentMovies.length;
    const canFetchMorePages = currentPage < MAX_SECTION_PAGES;

    if (!hasMoreInCurrentData && !canFetchMorePages) return;

    loadMoreLocksRef.current.add(sectionId);

    try {
      let workingSectionsData = sectionsData;
      let movies = workingSectionsData[sectionId] || [];
      let totalMovies = movies.length;

      let nextPage = currentPage;
      const wantedVisible = currentVisible + LOAD_MORE;

      while (
        wantedVisible > totalMovies - PREFETCH_OFFSET &&
        nextPage < MAX_SECTION_PAGES
      ) {
        nextPage += 1;

        const result = await fetchSectionPage(
          section,
          nextPage,
          workingSectionsData
        );

        workingSectionsData = result.sectionsData;
        movies = result.movies;
        totalMovies = movies.length;

        if (totalMovies >= wantedVisible) {
          break;
        }
      }

      const nextVisible = Math.min(wantedVisible, totalMovies);
      const addedCount = nextVisible - currentVisible;

      if (addedCount <= 0) return;

      const distance = getCardScrollDistance(row, addedCount);

      if (shouldAnimateScroll) {
        setAnimatingRows((prev) => ({
          ...prev,
          [sectionId]: true,
        }));
      }

      setVisibleCounts((prev) => ({
        ...prev,
        [sectionId]: nextVisible,
      }));

      if (shouldAnimateScroll) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            row.scrollBy({
              left: distance,
              behavior: "smooth",
            });
          });
        });

        setTimeout(() => {
          setAnimatingRows((prev) => {
            const next = { ...prev };
            delete next[sectionId];
            return next;
          });

          setRowLeftState(sectionId, true);
        }, SCROLL_ANIMATION_MS);
      }
    } finally {
      const unlockDelay = shouldAnimateScroll ? SCROLL_ANIMATION_MS + 80 : 350;

      setTimeout(() => {
        loadMoreLocksRef.current.delete(sectionId);
      }, unlockDelay);
    }
  };

  const handleRowScroll = (section, event) => {
    const sectionId = section.id;
    const row = event.currentTarget;

    setRowLeftState(sectionId, row.scrollLeft > 8);

    const isNearEnd =
      row.scrollLeft + row.clientWidth >=
      row.scrollWidth - AUTO_LOAD_SCROLL_OFFSET;

    if (isNearEnd) {
      loadMoreForSection({
        section,
        row,
        shouldAnimateScroll: false,
      });
    }
  };

  const scrollRow = async (section, direction) => {
    const sectionId = section.id;
    const row = document.getElementById(`movie-row-${sectionId}`);

    if (!row || animatingRows[sectionId]) return;

    if (direction === "left") {
      if (!rowCanGoLeft[sectionId]) return;

      const distance = getCardScrollDistance(row, LOAD_MORE);

      setAnimatingRows((prev) => ({
        ...prev,
        [sectionId]: true,
      }));

      row.scrollBy({
        left: -distance,
        behavior: "smooth",
      });

      setTimeout(() => {
        setAnimatingRows((prev) => {
          const next = { ...prev };
          delete next[sectionId];
          return next;
        });

        setRowLeftState(sectionId, row.scrollLeft > 8);
      }, SCROLL_ANIMATION_MS);

      return;
    }

    await loadMoreForSection({
      section,
      row,
      shouldAnimateScroll: true,
    });
  };

  return (
    <main className="movies-page">
      <section className="trailers-section">
        <div className="section-heading">
          <span className="section-kicker">Cinema Preview</span>
          <h1>Explore Movies</h1>
        </div>

        {activeTrailer && (
          <div className="trailers-layout">
            <Link className="trailer-hero" to={`/movie/${activeTrailer.id}`}>
              <img
                className="trailer-backdrop"
                src={`${BACKDROP_URL}${activeTrailer.backdrop_path}`}
                alt={activeTrailer.title}
                decoding="async"
                fetchPriority="high"
              />

              <div className="trailer-gradient" />

              <button
                className="trailer-arrow trailer-arrow-left"
                type="button"
                onClick={goPrevTrailer}
                aria-label="Previous movie"
              >
                <i className="bx bx-chevron-left" aria-hidden="true"></i>
              </button>

              <button
                className="trailer-arrow trailer-arrow-right"
                type="button"
                onClick={goNextTrailer}
                aria-label="Next movie"
              >
                <i className="bx bx-chevron-right" aria-hidden="true"></i>
              </button>

              <div className="trailer-info">
                {activeTrailer.poster_path && (
                  <img
                    className="trailer-poster"
                    src={`${POSTER_URL}${activeTrailer.poster_path}`}
                    alt={activeTrailer.title}
                    loading="lazy"
                    decoding="async"
                  />
                )}

                <div className="trailer-copy">
                  <span className="trailer-play">
                    <i className="bx bx-play" aria-hidden="true"></i>
                  </span>

                  <div>
                    <h2>{activeTrailer.title}</h2>

                    <p>
                      {activeTrailer.overview
                        ? `${activeTrailer.overview.slice(0, 150)}...`
                        : "Open the movie page and discover what is coming next."}
                    </p>

                    <div className="trailer-meta">
                      <span>
                        <i className="bx bxs-star" aria-hidden="true"></i>
                        {activeTrailer.vote_average?.toFixed(1) || "N/A"}
                      </span>

                      <span>
                        <i className="bx bx-calendar" aria-hidden="true"></i>
                        {activeTrailer.release_date?.slice(0, 4) || "Soon"}
                      </span>

                      <span>
                        <i className="bx bx-movie-play" aria-hidden="true"></i>
                        Movie
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <aside className="up-next-panel">
              <h2>Up Next</h2>

              <div className="up-next-list">
                {upNextMovies.map((movie) => (
                  <button
                    key={movie.id}
                    className="up-next-card"
                    type="button"
                    onClick={() => setActiveMovie(movie.id)}
                  >
                    {movie.poster_path && (
                      <img
                        src={`${POSTER_URL}${movie.poster_path}`}
                        alt={movie.title}
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                    <div>
                      <span className="mini-play">
                        <i className="bx bx-play" aria-hidden="true"></i>
                      </span>

                      <strong>{movie.title}</strong>
                      <small>Open movie details</small>

                      <span className="up-next-rating">
                        <i className="bx bxs-star" aria-hidden="true"></i>
                        {movie.vote_average?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}
      </section>

      {loading && <p className="movies-loading">Loading movies...</p>}

      {!loading &&
        SECTIONS.map((section) => {
          const sectionMovies = sectionsData[section.id] || [];
          const visibleCount = visibleCounts[section.id] || INITIAL_VISIBLE;
          const visibleMovies = sectionMovies.slice(0, visibleCount);

          const currentPage = sectionPages[section.id] || 1;
          const isLoadingMore = Boolean(loadingMoreSections[section.id]);
          const isAnimating = Boolean(animatingRows[section.id]);

          const canGoLeft = Boolean(rowCanGoLeft[section.id]);

          const canGoRight =
            visibleCount < sectionMovies.length ||
            currentPage < MAX_SECTION_PAGES;

          return (
            <section className="movie-row-section" key={section.id}>
              <div className="movie-row-header">
                <div>
                  <span className="section-kicker">Prestige Movies</span>
                  <h2>{section.title}</h2>
                </div>

                <Link to="/search" className="view-more-link">
                  View more
                  <i className="bx bx-chevron-right" aria-hidden="true"></i>
                </Link>
              </div>

              <div className="movie-row-wrap">
                <button
                  className="row-arrow row-arrow-left"
                  type="button"
                  onClick={() => scrollRow(section, "left")}
                  disabled={!canGoLeft || isAnimating}
                  aria-label={`Scroll ${section.title} left`}
                >
                  <i className="bx bx-chevron-left" aria-hidden="true"></i>
                </button>

                <div
                  className={`movie-row ${isAnimating ? "is-animating" : ""}`}
                  id={`movie-row-${section.id}`}
                  onScroll={(event) => handleRowScroll(section, event)}
                >
                  {visibleMovies.map((movie) => (
                    <MovieCard
                      key={`${section.id}-${movie.id}`}
                      movie={movie}
                    />
                  ))}
                </div>

                <button
                  className="row-arrow row-arrow-right"
                  type="button"
                  onClick={() => scrollRow(section, "right")}
                  disabled={!canGoRight || isLoadingMore || isAnimating}
                  aria-label={`Scroll ${section.title} right`}
                >
                  <i className="bx bx-chevron-right" aria-hidden="true"></i>
                </button>
              </div>
            </section>
          );
        })}
    </main>
  );
}

export default Movies;