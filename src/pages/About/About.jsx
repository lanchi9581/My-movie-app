import { NavLink } from "react-router-dom";
import "./About.css";

function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <span className="about-kicker">Prestige Movies</span>

        <h1>About Prestige Movies</h1>

        <p>
          Discover movies and TV series from around the world. Explore ratings,
          posters, trailers, favorites, watchlists and trending content in one
          modern cinematic platform.
        </p>

        <div className="about-hero-actions">
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

      <section className="about-stats">
        <div>
          <strong>10,000+</strong>
          <span>Movies</span>
        </div>

        <div>
          <strong>5,000+</strong>
          <span>TV Series</span>
        </div>

        <div>
          <strong>20+</strong>
          <span>Genres</span>
        </div>

        <div>
          <strong>TMDB</strong>
          <span>Powered Data</span>
        </div>
      </section>

      <section className="about-grid">
        <article className="about-main-card">
          <span>What is Prestige Movies?</span>

          <h2>A modern movie discovery experience</h2>

          <p>
            Prestige Movies is built for people who want a fast, clean and
            premium way to discover what to watch next. Browse movies and TV
            series, view ratings, explore details and keep your personal
            collection organized.
          </p>

          <p>
            Whether you are looking for trending blockbusters, popular series,
            hidden gems or something to save for later, Prestige Movies gives
            you everything in one place.
          </p>
        </article>

        <article className="about-side-card">
          <i className="bx bxs-hot"></i>

          <h3>Streaming inspired design</h3>

          <p>
            The interface is inspired by premium platforms like Netflix,
            Disney+ and Max, with dark backgrounds, cinematic cards and smooth
            browsing.
          </p>
        </article>
      </section>

      <section className="about-features">
        <div className="about-section-heading">
          <span>Features</span>
          <h2>Everything you need</h2>
        </div>

        <div className="about-feature-grid">
          <article>
            <i className="bx bxs-heart"></i>
            <h3>Favorites</h3>
            <p>Save movies and TV series you love in your personal collection.</p>
          </article>

          <article>
            <i className="bx bxs-time-five"></i>
            <h3>Watch Later</h3>
            <p>Build your own watchlist and keep titles ready for movie night.</p>
          </article>

          <article>
            <i className="bx bxs-right-arrow-circle"></i>
            <h3>Continue Watching</h3>
            <p>Jump back into the movies and episodes you recently watched.</p>
          </article>

          <article>
            <i className="bx bx-search"></i>
            <h3>Smart Search</h3>
            <p>Search movies and TV series with filters and fuzzy matching.</p>
          </article>
        </div>
      </section>

      <section className="about-tmdb">
        <div>
          <span>Data Attribution</span>
          <h2>Powered by TMDB</h2>

          <p>
            Prestige Movies uses The Movie Database API for posters, ratings,
            descriptions, release dates and metadata. This product uses the
            TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>

        <div className="about-tmdb-badge">TMDB</div>
      </section>

      <section className="about-cta">
        <span>Ready to discover something new?</span>

        <h2>Start exploring now</h2>

        <p>
          Find trending movies, binge-worthy series and hidden gems with
          Prestige Movies.
        </p>

        <div className="about-cta-actions">
          <NavLink to="/movies">Browse Movies</NavLink>
          <NavLink to="/search">Search Titles</NavLink>
        </div>
      </section>

      <p className="about-made-by">Made by Lan • 2025</p>
    </main>
  );
}

export default About;