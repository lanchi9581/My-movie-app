import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./Home.css";

const API_KEY = "36669667bad13a98c59f98b32ebb67f5";
const BASE_URL = "https://api.themoviedb.org/3";

const POSTER_URL = "https://image.tmdb.org/t/p/w342";
const HERO_POSTER_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_URL = "https://image.tmdb.org/t/p/w1280";
const BACKDROP_CARD_URL = "https://image.tmdb.org/t/p/w780";

const STORAGE_LIMIT = 15;
const CONTINUE_DISPLAY_LIMIT = 5;
const RECENTLY_DISPLAY_LIMIT = 8;

const RECENTLY_KEYS = [
  "prestige_recently_viewed",
  "recentlyViewed",
  "recently-viewed",
  "prestigeRecentlyViewed",
  "recentlyViewedMovies",
  "recentlyViewedShows",
];

const CONTINUE_KEYS = [
  "prestige_continue_watching",
  "continueWatching",
  "continue-watching",
  "prestigeContinueWatching",
  "prestige_continueWatching",
];

const fallbackFeatured = {
  id: 550,
  title: "Prestige Movies",
  overview:
    "Discover trending movies, popular TV shows, trailers, favorites and your personal watchlist in one cinematic place.",
  backdrop_path: null,
  poster_path: null,
  vote_average: 8.9,
  media_type: "movie",
  release_date: "2026-01-01",
};

const genres = [
  { name: "Action", icon: "bx bxs-bolt", path: "/movies" },
  { name: "Horror", icon: "bx bxs-ghost", path: "/movies" },
  { name: "Comedy", icon: "bx bxs-laugh", path: "/movies" },
  { name: "Sci-Fi", icon: "bx bxs-planet", path: "/movies" },
];

function getTitle(item) {
  return (
    item?.title ||
    item?.name ||
    item?.original_title ||
    item?.original_name ||
    "Untitled"
  );
}

function getYear(item) {
  const date = item?.release_date || item?.first_air_date;
  return date ? date.slice(0, 4) : "New";
}

function getRating(item) {
  if (!item?.vote_average && item?.vote_average !== 0) return "N/A";
  return item.vote_average.toFixed(1);
}

function getMediaType(item, fallback = "movie") {
  if (item?.media_type === "movie") return "movie";
  if (item?.media_type === "tv") return "tv";

  if (item?.first_air_date || item?.original_name) return "tv";
  if (item?.release_date || item?.original_title || item?.title) return "movie";

  return fallback;
}

function getDetailsPath(item, fallback = "movie") {
  const mediaType = getMediaType(item, fallback);
  return mediaType === "tv" ? `/series/${item.id}` : `/movie/${item.id}`;
}

function getCardPath(item, fallbackType, preferContinuePath = false) {
  if (preferContinuePath && item?.continue_path) return item.continue_path;
  return getDetailsPath(item, fallbackType);
}

function getPoster(path, hero = false) {
  if (!path) return null;
  return `${hero ? HERO_POSTER_URL : POSTER_URL}${path}`;
}

function getBackdrop(path) {
  if (!path) return null;
  return `${BACKDROP_URL}${path}`;
}

function getCardBackdrop(path) {
  if (!path) return null;
  return `${BACKDROP_CARD_URL}${path}`;
}

function normalizeMovie(movie) {
  return { ...movie, media_type: "movie" };
}

function normalizeShow(show) {
  return {
    ...show,
    media_type: "tv",
    title: show.title || show.name,
    release_date: show.release_date || show.first_air_date,
  };
}

function readLocalStorageList(keys) {
  for (const key of keys) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (parsed && typeof parsed === "object") return Object.values(parsed).filter(Boolean);
    } catch {
      continue;
    }
  }

  return [];
}

function cleanLocalStorageItems(items) {
  const seen = new Set();

  return items
    .filter((item) => item && item.id && getTitle(item) !== "Untitled")
    .filter((item) => {
      const type = getMediaType(item);
      const key = `${type}-${item.id}`;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .slice(0, STORAGE_LIMIT);
}

function persistHomeList(keys, items) {
  localStorage.setItem(keys[0], JSON.stringify(items));
  keys.slice(1).forEach((key) => localStorage.removeItem(key));
}

function removeHomeItem(items, itemToRemove) {
  return items.filter((item) => {
    const itemType = getMediaType(item);
    const removeType = getMediaType(itemToRemove);

    return !(Number(item.id) === Number(itemToRemove.id) && itemType === removeType);
  });
}

function PosterCard({
  item,
  fallbackType = "movie",
  preferContinuePath = false,
  index = 0,
  onRemove,
}) {
  const title = getTitle(item);
  const poster = getPoster(item?.poster_path);
  const path = getCardPath(item, fallbackType, preferContinuePath);
  const subtitle = item?.continue_label || getYear(item);

  return (
    <article className="home-poster-card-shell">
      {onRemove && (
        <button
          className="home-remove-btn"
          type="button"
          onClick={() => onRemove(item)}
          aria-label={`Remove ${title}`}
          title="Remove"
        >
          <i className="bx bx-x"></i>
        </button>
      )}

      <NavLink to={path} className="home-poster-card">
        <div className="home-poster-image">
          {poster ? (
            <img
              src={poster}
              alt={title}
              loading={index < 4 ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <div className="home-poster-placeholder">
              <i className="bx bxs-movie-play"></i>
            </div>
          )}

          <div className="home-poster-rating">
            <i className="bx bxs-star"></i>
            {getRating(item)}
          </div>
        </div>

        <div className="home-poster-info">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </NavLink>
    </article>
  );
}

function WideCard({
  item,
  fallbackType = "movie",
  preferContinuePath = false,
  index = 0,
  onRemove,
}) {
  const title = getTitle(item);
  const path = getCardPath(item, fallbackType, preferContinuePath);
  const mediaType = getMediaType(item, fallbackType);
  const backdrop = getCardBackdrop(item?.backdrop_path);
  const poster = getPoster(item?.poster_path);
  const image = backdrop || poster;
  const subtitle = item?.continue_label || getYear(item);

  return (
    <article className="home-wide-card-shell">
      {onRemove && (
        <button
          className="home-remove-btn home-remove-btn-wide"
          type="button"
          onClick={() => onRemove(item)}
          aria-label={`Remove ${title}`}
          title="Remove"
        >
          <i className="bx bx-x"></i>
        </button>
      )}

      <NavLink to={path} className="home-wide-card">
        <div className="home-wide-image">
          {image ? (
            <img
              src={image}
              alt={title}
              loading={index < 3 ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <div className="home-wide-placeholder">
              <i className="bx bxs-movie-play"></i>
            </div>
          )}

          <div className="home-wide-play">
            <i className="bx bx-play"></i>
          </div>
        </div>

        <div className="home-wide-content">
          <span className="home-wide-kicker">
            {mediaType === "tv" ? "Series" : "Movie"}
          </span>

          <h3>{title}</h3>
          <p>{subtitle}</p>

          <div className="home-wide-meta">
            <span>
              <i className="bx bxs-star"></i>
              {getRating(item)}
            </span>
            <span>{getYear(item)}</span>
            <span>HD</span>
          </div>
        </div>
      </NavLink>
    </article>
  );
}

function HomeRow({
  title,
  kicker,
  items,
  fallbackType = "movie",
  viewAllPath,
  preferContinuePath = false,
  variant = "poster",
  displayLimit = 12,
  onRemove,
  onClear,
}) {
  if (!items || items.length === 0) return null;

  return (
    <section className="home-section">
      <div className="home-section-header">
        <div>
          <span>{kicker}</span>
          <h2>{title}</h2>
        </div>

        <div className="home-section-actions">
          {onClear && (
            <button className="home-clear-btn" type="button" onClick={onClear}>
              Clear all
            </button>
          )}

          {viewAllPath && (
            <NavLink to={viewAllPath} className="home-view-all">
              View all
              <i className="bx bx-chevron-right"></i>
            </NavLink>
          )}
        </div>
      </div>

      <div className={variant === "wide" ? "home-wide-row" : "home-row"}>
        {items.slice(0, displayLimit).map((item, index) =>
          variant === "wide" ? (
            <WideCard
              key={`${fallbackType}-${item.id}-${index}`}
              item={item}
              fallbackType={fallbackType}
              preferContinuePath={preferContinuePath}
              index={index}
              onRemove={onRemove}
            />
          ) : (
            <PosterCard
              key={`${fallbackType}-${item.id}-${index}`}
              item={item}
              fallbackType={fallbackType}
              preferContinuePath={preferContinuePath}
              index={index}
              onRemove={onRemove}
            />
          )
        )}
      </div>
    </section>
  );
}

function Home() {
  const [featured, setFeatured] = useState(fallbackFeatured);
  const [heroIndex, setHeroIndex] = useState(0);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);

  useEffect(() => {
    const storedRecentlyViewed = readLocalStorageList(RECENTLY_KEYS);
    const storedContinueWatching = readLocalStorageList(CONTINUE_KEYS);

    setRecentlyViewed(cleanLocalStorageItems(storedRecentlyViewed));
    setContinueWatching(cleanLocalStorageItems(storedContinueWatching));
  }, []);

  useEffect(() => {
    async function fetchHomeData() {
      try {
        const [moviesResponse, seriesResponse] = await Promise.all([
          fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=en-US`),
          fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=1`),
        ]);

        if (!moviesResponse.ok || !seriesResponse.ok) {
          throw new Error("Failed to fetch home data");
        }

        const moviesData = await moviesResponse.json();
        const seriesData = await seriesResponse.json();

        const movies = Array.isArray(moviesData.results)
          ? moviesData.results.map(normalizeMovie)
          : [];

        const series = Array.isArray(seriesData.results)
          ? seriesData.results.map(normalizeShow)
          : [];

        const heroMovies = movies.filter((movie) => movie.backdrop_path && movie.poster_path);

        setTrendingMovies(movies);
        setPopularSeries(series);
        setHeroIndex(0);
        setFeatured(heroMovies[0] || movies[0] || fallbackFeatured);
      } catch (error) {
        console.error("Failed to fetch home page data:", error);
        setFeatured(fallbackFeatured);
        setTrendingMovies([]);
        setPopularSeries([]);
      }
    }

    fetchHomeData();
  }, []);

  useEffect(() => {
    const heroMovies = trendingMovies.filter((movie) => movie.backdrop_path && movie.poster_path);

    if (heroMovies.length === 0) return;

    const interval = setInterval(() => {
      setHeroIndex((prev) => {
        const next = (prev + 1) % heroMovies.length;
        setFeatured(heroMovies[next]);
        return next;
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [trendingMovies]);

  const removeRecentlyViewed = (itemToRemove) => {
    const nextItems = removeHomeItem(recentlyViewed, itemToRemove);
    setRecentlyViewed(nextItems);
    persistHomeList(RECENTLY_KEYS, nextItems);
  };

  const removeContinueWatching = (itemToRemove) => {
    const nextItems = removeHomeItem(continueWatching, itemToRemove);
    setContinueWatching(nextItems);
    persistHomeList(CONTINUE_KEYS, nextItems);
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    persistHomeList(RECENTLY_KEYS, []);
  };

  const clearContinueWatching = () => {
    setContinueWatching([]);
    persistHomeList(CONTINUE_KEYS, []);
  };

  const heroBackground = useMemo(() => {
    const backdrop = getBackdrop(featured?.backdrop_path);
    if (!backdrop) return undefined;

    return {
      backgroundImage: `url(${backdrop})`,
    };
  }, [featured]);

  return (
    <>
      <Helmet>
        <title>Prestige Movies - Watch Movies & TV Shows Online</title>
        <meta
          name="description"
          content="Discover movies and TV shows, explore ratings, trailers, cast information and watch your favorite content on Prestige Movies."
        />
        <link rel="canonical" href="https://prestige-movies.vercel.app/" />
      </Helmet>

      <main className="home-page">
        <section className="home-hero" style={heroBackground}>
          <div className="home-hero-content">
            <span className="home-kicker">
              <i className="bx bxs-hot"></i>
              Prestige Featured
            </span>

            <h1>{getTitle(featured)}</h1>

            <p>
              {featured?.overview ||
                "Discover movies, series, trailers and your personal watchlist in one cinematic place."}
            </p>

            <div className="home-hero-meta">
              <span>
                <i className="bx bxs-star"></i>
                {getRating(featured)}
              </span>
              <span>{getYear(featured)}</span>
              <span>{getMediaType(featured) === "tv" ? "Series" : "Movie"}</span>
              <span>HD</span>
            </div>

            <div className="home-actions">
              <NavLink to={getDetailsPath(featured, "movie")} className="home-primary-btn">
                <i className="bx bxs-right-arrow"></i>
                Watch Now
              </NavLink>

              <NavLink to="/discover" className="home-secondary-btn">
                <i className="bx bx-compass"></i>
                Discover
              </NavLink>

              <NavLink to="/series" className="home-secondary-btn">
                <i className="bx bxs-tv"></i>
                Series
              </NavLink>

              <NavLink to="/search" className="home-secondary-btn">
                <i className="bx bx-search"></i>
                Search
              </NavLink>
            </div>
          </div>

          <div className="home-hero-poster-wrap">
            <div className="home-hero-poster">
              {featured?.poster_path ? (
                <img
                  src={getPoster(featured.poster_path, true)}
                  alt={getTitle(featured)}
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="home-hero-poster-placeholder">
                  <i className="bx bxs-movie-play"></i>
                  <span>Prestige Movies</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <HomeRow
          title="Recently Viewed"
          kicker="Jump back in"
          items={recentlyViewed}
          fallbackType="movie"
          viewAllPath="/movies"
          variant="poster"
          displayLimit={RECENTLY_DISPLAY_LIMIT}
          onRemove={removeRecentlyViewed}
          onClear={clearRecentlyViewed}
        />

        <HomeRow
          title="Continue Watching"
          kicker="Your queue"
          items={continueWatching}
          fallbackType="movie"
          viewAllPath="/watch-later"
          preferContinuePath
          variant="wide"
          displayLimit={CONTINUE_DISPLAY_LIMIT}
          onRemove={removeContinueWatching}
          onClear={clearContinueWatching}
        />

        <HomeRow
          title="Trending Movies"
          kicker="Popular this week"
          items={trendingMovies}
          fallbackType="movie"
          viewAllPath="/discover"
        />

        <HomeRow
          title="Popular TV Series"
          kicker="Binge-worthy shows"
          items={popularSeries}
          fallbackType="tv"
          viewAllPath="/discover"
        />

        <section className="home-genres-section">
          <div className="home-section-header">
            <div>
              <span>Browse by mood</span>
              <h2>Popular Genres</h2>
            </div>
          </div>

          <div className="home-genre-chips">
            {genres.map((genre) => (
              <NavLink to={genre.path} className="home-genre-chip" key={genre.name}>
                <i className={genre.icon}></i>
                {genre.name}
              </NavLink>
            ))}
          </div>
        </section>

        <section className="home-stats">
          <div>
            <strong>10,000+</strong>
            <span>Movies</span>
          </div>

          <div>
            <strong>5,000+</strong>
            <span>Series</span>
          </div>

          <div>
            <strong>HD</strong>
            <span>Trailers</span>
          </div>

          <div>
            <strong>TMDB</strong>
            <span>Powered Data</span>
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;