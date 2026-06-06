import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import CustomSelect from "../components/CustomSelect/CustomSelect";
import "./FavoritePage.css";

const IMG_URL = "https://image.tmdb.org/t/p/w342";
const PLACEHOLDER_IMG =
  "https://placehold.co/342x513/10131f/ffffff?text=No+Poster";

const localStorageKey = "watchLaterItems";

function readItems(key) {
  try {
    const stored = localStorage.getItem(key);
    const parsed = JSON.parse(stored || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getItemTitle(item) {
  return item.title || item.name || "Untitled";
}

function getItemYear(item) {
  const date = item.release_date || item.first_air_date;
  return date ? date.slice(0, 4) : item.media_type === "tv" ? "Series" : "Movie";
}

function getItemLink(item) {
  return item.media_type === "tv" ? `/series/${item.id}` : `/movie/${item.id}`;
}

function WatchLaterPage() {
  const [items, setItems] = useState(() => readItems(localStorageKey));
  const [sortBy, setSortBy] = useState("newest");

  const sortedItems = useMemo(() => {
    const cloned = [...items];

    if (sortBy === "rating") {
      return cloned.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    }

    if (sortBy === "title") {
      return cloned.sort((a, b) => getItemTitle(a).localeCompare(getItemTitle(b)));
    }

    if (sortBy === "oldest") {
      return cloned.reverse();
    }

    return cloned;
  }, [items, sortBy]);

  const removeItem = (itemToRemove) => {
    const nextItems = items.filter(
      (item) =>
        !(
          Number(item.id) === Number(itemToRemove.id) &&
          item.media_type === itemToRemove.media_type
        )
    );

    localStorage.setItem(localStorageKey, JSON.stringify(nextItems));
    setItems(nextItems);
  };

  const clearAll = () => {
    localStorage.setItem(localStorageKey, JSON.stringify([]));
    setItems([]);
  };

  if (items.length === 0) {
    return (
      <main className="library-page">
        <section className="library-empty">
          <div className="library-empty-icon">
            <i className="bx bxs-time-five"></i>
          </div>

          <span>Watch Later</span>
          <h1>Your watchlist is empty</h1>

          <p>
            Save movies and TV series for later and build your perfect streaming queue.
          </p>

          <div className="library-empty-actions">
            <NavLink to="/movies">
              <i className="bx bxs-movie"></i>
              Explore Movies
            </NavLink>

            <NavLink to="/series">
              <i className="bx bxs-tv"></i>
              Explore Series
            </NavLink>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="library-page">
      <section className="library-hero">
        <div>
          <span className="library-kicker">Watchlist</span>
          <h1>Watch Later</h1>
          <p>{items.length} titles waiting for your next movie night.</p>
        </div>

        <div className="library-stats">
          <div>
            <strong>{items.length}</strong>
            <span>Total</span>
          </div>

          <div>
            <strong>
              {items.filter((item) => item.media_type === "tv").length}
            </strong>
            <span>Series</span>
          </div>

          <div>
            <strong>
              {items.filter((item) => (item.vote_average || 0) >= 7).length}
            </strong>
            <span>Top Rated</span>
          </div>
        </div>
      </section>

      <section className="library-toolbar">
        <label>
          Sort
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
              { value: "rating", label: "Rating" },
              { value: "title", label: "Title" },
            ]}
          />
        </label>

        <button type="button" onClick={clearAll}>
          <i className="bx bx-trash"></i>
          Clear All
        </button>
      </section>

      <section className="library-grid">
        {sortedItems.map((item) => (
          <article className="library-card" key={`${item.media_type}-${item.id}`}>
            <Link to={getItemLink(item)} className="library-poster">
              <img
                src={item.poster_path ? `${IMG_URL}${item.poster_path}` : PLACEHOLDER_IMG}
                alt={getItemTitle(item)}
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMG;
                }}
              />

              <span>
                <i className="bx bxs-star"></i>
                {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}
              </span>
            </Link>

            <div className="library-card-info">
              <Link to={getItemLink(item)}>
                <h2>{getItemTitle(item)}</h2>
              </Link>

              <p>{item.media_type === "tv" ? "Series" : "Movie"} • {getItemYear(item)}</p>

              <button type="button" onClick={() => removeItem(item)}>
                <i className="bx bx-x"></i>
                Remove
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default WatchLaterPage;