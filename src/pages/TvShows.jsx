import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import MovieCard from "../components/MovieCard";

import "./TvShows.css";

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
  {
    id: "trending",
    title: "Trending Series",
    endpoint: "/trending/tv/day",
  },
  {
    id: "popular",
    title: "Popular Series",
    endpoint: "/tv/popular",
  },
  {
    id: "top-rated",
    title: "Top Rated Series",
    endpoint: "/tv/top_rated",
  },
  {
    id: "on-the-air",
    title: "On The Air",
    endpoint: "/tv/on_the_air",
  },
  {
    id: "airing-today",
    title: "Airing Today",
    endpoint: "/tv/airing_today",
  },
  {
    id: "drama",
    title: "Drama Series",
    endpoint: "/discover/tv",
    params: "&with_genres=18&sort_by=popularity.desc",
  },
  {
    id: "comedy",
    title: "Comedy Series",
    endpoint: "/discover/tv",
    params: "&with_genres=35&sort_by=popularity.desc",
  },
  {
    id: "crime",
    title: "Crime Series",
    endpoint: "/discover/tv",
    params: "&with_genres=80&sort_by=popularity.desc",
  },
  {
    id: "sci-fi",
    title: "Sci-Fi & Fantasy",
    endpoint: "/discover/tv",
    params: "&with_genres=10765&sort_by=popularity.desc",
  },
];

const preloadedPosterUrls = new Set();

function normalizeShow(show) {
  return {
    ...show,
    media_type: "tv",
    title: show.title || show.name,
    release_date: show.release_date || show.first_air_date,
  };
}

function buildSectionUrl(section, page = 1) {
  return `${BASE_URL}${section.endpoint}?api_key=${API_KEY}&language=en-US&page=${page}${
    section.params || ""
  }`;
}

function getShowKey(show) {
  if (!show?.id) return null;
  return String(show.id);
}

async function fetchRawSectionPage(section, page) {
  const res = await fetch(buildSectionUrl(section, page));

  if (!res.ok) {
    throw new Error(`Failed to fetch ${section.title}, page ${page}`);
  }

  const data = await res.json();
  return (data.results || []).map(normalizeShow);
}

function mergeUniqueShows(oldShows, newShows) {
  const map = new Map();

  [...oldShows, ...newShows].forEach((show) => {
    const key = getShowKey(show);

    if (key) {
      map.set(key, show);
    }
  });

  return Array.from(map.values());
}

function filterShowsForSection(fetchedShows, sectionId, allSectionsData) {
  const usedShowIds = new Set();

  Object.entries(allSectionsData).forEach(([currentSectionId, shows]) => {
    if (currentSectionId === sectionId) return;

    shows.forEach((show) => {
      const key = getShowKey(show);

      if (key) {
        usedShowIds.add(key);
      }
    });
  });

  return fetchedShows.filter((show) => {
    const key = getShowKey(show);

    if (!key || usedShowIds.has(key)) return false;

    usedShowIds.add(key);
    return true;
  });
}

function getPosterUrl(show) {
  if (!show?.poster_path) return null;
  return `${POSTER_URL}${show.poster_path}`;
}

function preloadPoster(show) {
  const posterUrl = getPosterUrl(show);

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

function TVShows() {
  const [trailerShows, setTrailerShows] = useState([]);
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
    async function fetchTrailerShows() {
      try {
        const shows = await fetchRawSectionPage(
          {
            title: "On The Air",
            endpoint: "/tv/on_the_air",
          },
          1
        );

        const filteredShows = shows
          .filter((show) => show.backdrop_path)
          .slice(0, 8);

        setTrailerShows(filteredShows);
      } catch (error) {
        console.error("Failed to fetch trailer shows:", error);
      }
    }

    fetchTrailerShows();
  }, []);

  useEffect(() => {
    async function fetchSections() {
      setLoading(true);

      try {
        const firstPages = await Promise.all(
          SECTIONS.map(async (section) => {
            const shows = await fetchRawSectionPage(section, 1);

            return {
              section,
              shows,
            };
          })
        );

        const usedShowIds = new Set();
        const nextData = {};
        const nextPages = {};
        const nextVisibleCounts = {};
        const nextCanGoLeft = {};

        for (const result of firstPages) {
          const { section } = result;

          let currentPage = 1;
          const uniqueShows = [];

          const addUniqueShows = (shows) => {
            shows.forEach((show) => {
              const key = getShowKey(show);

              if (!key || usedShowIds.has(key)) return;

              usedShowIds.add(key);
              uniqueShows.push(show);
            });
          };

          addUniqueShows(result.shows);

          while (
            uniqueShows.length < INITIAL_VISIBLE &&
            currentPage < MAX_SECTION_PAGES
          ) {
            currentPage += 1;

            try {
              const moreShows = await fetchRawSectionPage(
                section,
                currentPage
              );

              addUniqueShows(moreShows);
            } catch (error) {
              console.error(`Failed to fill section ${section.title}:`, error);
              break;
            }
          }

          nextData[section.id] = uniqueShows;
          nextPages[section.id] = currentPage;
          nextVisibleCounts[section.id] = Math.min(
            INITIAL_VISIBLE,
            uniqueShows.length
          );
          nextCanGoLeft[section.id] = false;
        }

        setSectionsData(nextData);
        setSectionPages(nextPages);
        setVisibleCounts(nextVisibleCounts);
        setRowCanGoLeft(nextCanGoLeft);
      } catch (error) {
        console.error("Failed to fetch TV sections:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSections();
  }, []);

  useEffect(() => {
    if (trailerShows.length <= 1) return;

    const interval = setInterval(() => {
      setActiveTrailerIndex((prev) =>
        prev === trailerShows.length - 1 ? 0 : prev + 1
      );
    }, 6500);

    return () => clearInterval(interval);
  }, [trailerShows.length]);

  useEffect(() => {
    if (loading) return;

    const preloadNextImages = () => {
      SECTIONS.forEach((section) => {
        const shows = sectionsData[section.id] || [];
        const visibleCount = visibleCounts[section.id] || INITIAL_VISIBLE;

        shows
          .slice(visibleCount, visibleCount + LOAD_MORE)
          .forEach((show) => preloadPoster(show));
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

  const activeTrailer = trailerShows[activeTrailerIndex];

  const upNextShows = useMemo(() => {
    if (!trailerShows.length) return [];

    return trailerShows
      .filter((_, index) => index !== activeTrailerIndex)
      .slice(0, 4);
  }, [trailerShows, activeTrailerIndex]);

  const goPrevTrailer = (event) => {
    event.preventDefault();

    setActiveTrailerIndex((prev) =>
      prev === 0 ? trailerShows.length - 1 : prev - 1
    );
  };

  const goNextTrailer = (event) => {
    event.preventDefault();

    setActiveTrailerIndex((prev) =>
      prev === trailerShows.length - 1 ? 0 : prev + 1
    );
  };

  const setActiveShow = (showId) => {
    const index = trailerShows.findIndex((show) => show.id === showId);

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
        shows: baseSectionsData[section.id] || [],
        sectionsData: baseSectionsData,
      };
    }

    setLoadingMoreSections((prev) => ({
      ...prev,
      [section.id]: true,
    }));

    try {
      const fetchedShows = await fetchRawSectionPage(section, page);

      const filteredShows = filterShowsForSection(
        fetchedShows,
        section.id,
        baseSectionsData
      );

      const currentShows = baseSectionsData[section.id] || [];
      const combinedShows = mergeUniqueShows(currentShows, filteredShows);

      const nextSectionsData = {
        ...baseSectionsData,
        [section.id]: combinedShows,
      };

      setSectionsData((prev) => {
        const latestFilteredShows = filterShowsForSection(
          fetchedShows,
          section.id,
          prev
        );

        return {
          ...prev,
          [section.id]: mergeUniqueShows(
            prev[section.id] || [],
            latestFilteredShows
          ),
        };
      });

      setSectionPages((prev) => ({
        ...prev,
        [section.id]: Math.max(prev[section.id] || 1, page),
      }));

      return {
        shows: combinedShows,
        sectionsData: nextSectionsData,
      };
    } catch (error) {
      console.error("Failed to fetch more series:", error);

      return {
        shows: baseSectionsData[section.id] || [],
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
    const currentShows = sectionsData[sectionId] || [];

    const hasMoreInCurrentData = currentVisible < currentShows.length;
    const canFetchMorePages = currentPage < MAX_SECTION_PAGES;

    if (!hasMoreInCurrentData && !canFetchMorePages) return;

    loadMoreLocksRef.current.add(sectionId);

    try {
      let workingSectionsData = sectionsData;
      let shows = workingSectionsData[sectionId] || [];
      let totalShows = shows.length;

      let nextPage = currentPage;
      const wantedVisible = currentVisible + LOAD_MORE;

      while (
        wantedVisible > totalShows - PREFETCH_OFFSET &&
        nextPage < MAX_SECTION_PAGES
      ) {
        nextPage += 1;

        const result = await fetchSectionPage(
          section,
          nextPage,
          workingSectionsData
        );

        workingSectionsData = result.sectionsData;
        shows = result.shows;
        totalShows = shows.length;

        if (totalShows >= wantedVisible) {
          break;
        }
      }

      const nextVisible = Math.min(wantedVisible, totalShows);
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
    const row = document.getElementById(`series-row-${sectionId}`);

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
    <main className="movies-page series-page">
      <section className="trailers-section">
        <div className="section-heading">
          <span className="section-kicker">Series Preview</span>
          <h1>Explore Series</h1>
        </div>

        {activeTrailer && (
          <div className="trailers-layout">
            <Link className="trailer-hero" to={`/series/${activeTrailer.id}`}>
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
                aria-label="Previous series"
              >
                <i className="bx bx-chevron-left" aria-hidden="true"></i>
              </button>

              <button
                className="trailer-arrow trailer-arrow-right"
                type="button"
                onClick={goNextTrailer}
                aria-label="Next series"
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
                        : "Open the series page and discover your next show."}
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
                        <i className="bx bx-tv" aria-hidden="true"></i>
                        Series
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <aside className="up-next-panel">
              <h2>Up Next</h2>

              <div className="up-next-list">
                {upNextShows.map((show) => (
                  <button
                    key={show.id}
                    className="up-next-card"
                    type="button"
                    onClick={() => setActiveShow(show.id)}
                  >
                    {show.poster_path && (
                      <img
                        src={`${POSTER_URL}${show.poster_path}`}
                        alt={show.title}
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                    <div>
                      <span className="mini-play">
                        <i className="bx bx-play" aria-hidden="true"></i>
                      </span>

                      <strong>{show.title}</strong>
                      <small>Open series details</small>

                      <span className="up-next-rating">
                        <i className="bx bxs-star" aria-hidden="true"></i>
                        {show.vote_average?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}
      </section>

      {loading && <p className="movies-loading">Loading series...</p>}

      {!loading &&
        SECTIONS.map((section) => {
          const sectionShows = sectionsData[section.id] || [];
          const visibleCount = visibleCounts[section.id] || INITIAL_VISIBLE;
          const visibleShows = sectionShows.slice(0, visibleCount);

          const currentPage = sectionPages[section.id] || 1;
          const isLoadingMore = Boolean(loadingMoreSections[section.id]);
          const isAnimating = Boolean(animatingRows[section.id]);

          const canGoLeft = Boolean(rowCanGoLeft[section.id]);

          const canGoRight =
            visibleCount < sectionShows.length ||
            currentPage < MAX_SECTION_PAGES;

          return (
            <section className="movie-row-section" key={section.id}>
              <div className="movie-row-header">
                <div>
                  <span className="section-kicker">Prestige Series</span>
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
                  id={`series-row-${section.id}`}
                  onScroll={(event) => handleRowScroll(section, event)}
                >
                  {visibleShows.map((show) => (
                    <MovieCard key={`${section.id}-${show.id}`} movie={show} />
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

export default TVShows;