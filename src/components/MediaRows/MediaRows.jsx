import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import MovieCard from "../MovieCard/MovieCard";

import "./MediaRows.css";

const INITIAL_VISIBLE = 9;
const LOAD_MORE = 4;
const MAX_SECTION_PAGES = 6;
const PREFETCH_OFFSET = 6;
const SCROLL_ANIMATION_MS = 600;
const AUTO_LOAD_SCROLL_OFFSET = 420;

const preloadedPosterUrls = new Set();

const defaultNormalizeItem = (item) => item;

const defaultGetItemKey = (item) => {
  if (!item?.id) return null;
  return String(item.id);
};

function buildSectionUrl({ baseUrl, apiKey, section, page = 1 }) {
  return `${baseUrl}${section.endpoint}?api_key=${apiKey}&language=en-US&page=${page}${
    section.params || ""
  }`;
}

async function fetchRawSectionPage({
  baseUrl,
  apiKey,
  section,
  page,
  normalizeItem,
}) {
  const res = await fetch(
    buildSectionUrl({
      baseUrl,
      apiKey,
      section,
      page,
    })
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch ${section.title}, page ${page}`);
  }

  const data = await res.json();
  return (data.results || []).map(normalizeItem);
}

function mergeUniqueItems(oldItems, newItems, getItemKey) {
  const map = new Map();

  [...oldItems, ...newItems].forEach((item) => {
    const key = getItemKey(item);

    if (key) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

function filterItemsForSection(fetchedItems, sectionId, allSectionsData, getItemKey) {
  const usedItemIds = new Set();

  Object.entries(allSectionsData).forEach(([currentSectionId, items]) => {
    if (currentSectionId === sectionId) return;

    items.forEach((item) => {
      const key = getItemKey(item);

      if (key) {
        usedItemIds.add(key);
      }
    });
  });

  return fetchedItems.filter((item) => {
    const key = getItemKey(item);

    if (!key || usedItemIds.has(key)) return false;

    usedItemIds.add(key);
    return true;
  });
}

function getPosterUrl(item, posterUrl) {
  if (!item?.poster_path) return null;
  return `${posterUrl}${item.poster_path}`;
}

function preloadPoster(item, posterUrl) {
  const finalPosterUrl = getPosterUrl(item, posterUrl);

  if (!finalPosterUrl || preloadedPosterUrls.has(finalPosterUrl)) return;

  preloadedPosterUrls.add(finalPosterUrl);

  const img = new Image();
  img.src = finalPosterUrl;
}

function getCardScrollDistance(row, count) {
  const card = row.querySelector(".movie-card");

  if (!card) return 520;

  const rowStyles = window.getComputedStyle(row);
  const gap = parseFloat(rowStyles.columnGap || rowStyles.gap || "0") || 0;

  return (card.getBoundingClientRect().width + gap) * count;
}

function MediaRows({
  sections,
  baseUrl,
  apiKey,
  posterUrl,
  kicker,
  loadingText,
  rowIdPrefix,
  viewMoreTo = "/search",
  normalizeItem = defaultNormalizeItem,
  getItemKey = defaultGetItemKey,
  accent = "#e50914",
  arrowHoverBackground = "rgba(229, 9, 20, 0.86)",
  arrowHoverBorder = "rgba(229, 9, 20, 0.95)",
}) {
  const [sectionsData, setSectionsData] = useState({});
  const [sectionPages, setSectionPages] = useState({});
  const [visibleCounts, setVisibleCounts] = useState({});
  const [loadingMoreSections, setLoadingMoreSections] = useState({});
  const [animatingRows, setAnimatingRows] = useState({});
  const [rowCanGoLeft, setRowCanGoLeft] = useState({});
  const [loading, setLoading] = useState(true);

  const loadMoreLocksRef = useRef(new Set());

  useEffect(() => {
    let isMounted = true;

    async function fetchSections() {
      setLoading(true);

      try {
        const firstPages = await Promise.all(
          sections.map(async (section) => {
            const items = await fetchRawSectionPage({
              baseUrl,
              apiKey,
              section,
              page: 1,
              normalizeItem,
            });

            return {
              section,
              items,
            };
          })
        );

        if (!isMounted) return;

        const usedItemIds = new Set();
        const nextData = {};
        const nextPages = {};
        const nextVisibleCounts = {};
        const nextCanGoLeft = {};

        for (const result of firstPages) {
          const { section } = result;

          let currentPage = 1;
          const uniqueItems = [];

          const addUniqueItems = (items) => {
            items.forEach((item) => {
              const key = getItemKey(item);

              if (!key || usedItemIds.has(key)) return;

              usedItemIds.add(key);
              uniqueItems.push(item);
            });
          };

          addUniqueItems(result.items);

          while (
            uniqueItems.length < INITIAL_VISIBLE &&
            currentPage < MAX_SECTION_PAGES
          ) {
            currentPage += 1;

            try {
              const moreItems = await fetchRawSectionPage({
                baseUrl,
                apiKey,
                section,
                page: currentPage,
                normalizeItem,
              });

              addUniqueItems(moreItems);
            } catch (error) {
              console.error(`Failed to fill section ${section.title}:`, error);
              break;
            }
          }

          nextData[section.id] = uniqueItems;
          nextPages[section.id] = currentPage;
          nextVisibleCounts[section.id] = Math.min(
            INITIAL_VISIBLE,
            uniqueItems.length
          );
          nextCanGoLeft[section.id] = false;
        }

        setSectionsData(nextData);
        setSectionPages(nextPages);
        setVisibleCounts(nextVisibleCounts);
        setRowCanGoLeft(nextCanGoLeft);
      } catch (error) {
        console.error("Failed to fetch media sections:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSections();

    return () => {
      isMounted = false;
    };
  }, [apiKey, baseUrl, getItemKey, normalizeItem, sections]);

  useEffect(() => {
    if (loading) return;

    const preloadNextImages = () => {
      sections.forEach((section) => {
        const items = sectionsData[section.id] || [];
        const visibleCount = visibleCounts[section.id] || INITIAL_VISIBLE;

        items
          .slice(visibleCount, visibleCount + LOAD_MORE)
          .forEach((item) => preloadPoster(item, posterUrl));
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
  }, [loading, posterUrl, sections, sectionsData, visibleCounts]);

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
        items: baseSectionsData[section.id] || [],
        sectionsData: baseSectionsData,
      };
    }

    setLoadingMoreSections((prev) => ({
      ...prev,
      [section.id]: true,
    }));

    try {
      const fetchedItems = await fetchRawSectionPage({
        baseUrl,
        apiKey,
        section,
        page,
        normalizeItem,
      });

      const filteredItems = filterItemsForSection(
        fetchedItems,
        section.id,
        baseSectionsData,
        getItemKey
      );

      const currentItems = baseSectionsData[section.id] || [];
      const combinedItems = mergeUniqueItems(
        currentItems,
        filteredItems,
        getItemKey
      );

      const nextSectionsData = {
        ...baseSectionsData,
        [section.id]: combinedItems,
      };

      setSectionsData((prev) => {
        const latestFilteredItems = filterItemsForSection(
          fetchedItems,
          section.id,
          prev,
          getItemKey
        );

        return {
          ...prev,
          [section.id]: mergeUniqueItems(
            prev[section.id] || [],
            latestFilteredItems,
            getItemKey
          ),
        };
      });

      setSectionPages((prev) => ({
        ...prev,
        [section.id]: Math.max(prev[section.id] || 1, page),
      }));

      return {
        items: combinedItems,
        sectionsData: nextSectionsData,
      };
    } catch (error) {
      console.error("Failed to fetch more media:", error);

      return {
        items: baseSectionsData[section.id] || [],
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
    const currentItems = sectionsData[sectionId] || [];

    const hasMoreInCurrentData = currentVisible < currentItems.length;
    const canFetchMorePages = currentPage < MAX_SECTION_PAGES;

    if (!hasMoreInCurrentData && !canFetchMorePages) return;

    loadMoreLocksRef.current.add(sectionId);

    try {
      let workingSectionsData = sectionsData;
      let items = workingSectionsData[sectionId] || [];
      let totalItems = items.length;

      let nextPage = currentPage;
      const wantedVisible = currentVisible + LOAD_MORE;

      while (
        wantedVisible > totalItems - PREFETCH_OFFSET &&
        nextPage < MAX_SECTION_PAGES
      ) {
        nextPage += 1;

        const result = await fetchSectionPage(
          section,
          nextPage,
          workingSectionsData
        );

        workingSectionsData = result.sectionsData;
        items = result.items;
        totalItems = items.length;

        if (totalItems >= wantedVisible) {
          break;
        }
      }

      const nextVisible = Math.min(wantedVisible, totalItems);
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
    const row = document.getElementById(`${rowIdPrefix}-${sectionId}`);

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

  const rootStyle = {
    "--media-row-accent": accent,
    "--media-row-arrow-hover": arrowHoverBackground,
    "--media-row-arrow-hover-border": arrowHoverBorder,
  };

  return (
    <div className="media-rows" style={rootStyle}>
      {loading && <p className="media-rows-loading">{loadingText}</p>}

      {!loading &&
        sections.map((section) => {
          const sectionItems = sectionsData[section.id] || [];
          const visibleCount = visibleCounts[section.id] || INITIAL_VISIBLE;
          const visibleItems = sectionItems.slice(0, visibleCount);

          const currentPage = sectionPages[section.id] || 1;
          const isLoadingMore = Boolean(loadingMoreSections[section.id]);
          const isAnimating = Boolean(animatingRows[section.id]);

          const canGoLeft = Boolean(rowCanGoLeft[section.id]);

          const canGoRight =
            visibleCount < sectionItems.length ||
            currentPage < MAX_SECTION_PAGES;

          return (
            <section className="media-row-section" key={section.id}>
              <div className="media-row-header">
                <div>
                  <span className="media-row-kicker">{kicker}</span>
                  <h2>{section.title}</h2>
                </div>

                <Link to={viewMoreTo} className="media-view-more-link">
                  View more
                  <i className="bx bx-chevron-right" aria-hidden="true"></i>
                </Link>
              </div>

              <div className="media-row-wrap">
                <button
                  className="media-row-arrow media-row-arrow-left"
                  type="button"
                  onClick={() => scrollRow(section, "left")}
                  disabled={!canGoLeft || isAnimating}
                  aria-label={`Scroll ${section.title} left`}
                >
                  <i className="bx bx-chevron-left" aria-hidden="true"></i>
                </button>

                <div
                  className={`media-row ${isAnimating ? "is-animating" : ""}`}
                  id={`${rowIdPrefix}-${section.id}`}
                  onScroll={(event) => handleRowScroll(section, event)}
                >
                  {visibleItems.map((item) => (
                    <MovieCard
                      key={`${section.id}-${getItemKey(item)}`}
                      movie={item}
                    />
                  ))}
                </div>

                <button
                  className="media-row-arrow media-row-arrow-right"
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
    </div>
  );
}

export default MediaRows;