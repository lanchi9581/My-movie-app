import { NavLink } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-kicker">Prestige Streaming</span>

          <h1>Welcome to Prestige Movies</h1>

          <p>
            Discover movies, series, trailers and your personal watchlist in one
            cinematic place.
          </p>

          <div className="home-actions">
            <NavLink to="/movies" className="home-primary-btn">
              <i className="bx bxs-movie-play"></i>
              Explore Movies
            </NavLink>

            <NavLink to="/series" className="home-secondary-btn">
              <i className="bx bxs-tv"></i>
              Browse Series
            </NavLink>

            <NavLink to="/search" className="home-secondary-btn">
              <i className="bx bx-search"></i>
              Search
            </NavLink>
          </div>
        </div>

        <div className="home-hero-card">
          <div className="home-mini-poster poster-one"></div>
          <div className="home-mini-poster poster-two"></div>
          <div className="home-mini-poster poster-three"></div>
        </div>
      </section>

      <section className="home-grid">
        <NavLink to="/movies" className="home-card">
          <div className="home-card-icon">
            <i className="bx bxs-movie"></i>
          </div>

          <h2>Movies</h2>
          <p>Explore trending films, new releases, trailers and top rated picks.</p>

          <span>
            Open Movies
            <i className="bx bx-chevron-right"></i>
          </span>
        </NavLink>

        <NavLink to="/series" className="home-card">
          <div className="home-card-icon">
            <i className="bx bxs-tv"></i>
          </div>

          <h2>Series</h2>
          <p>Browse popular TV shows, seasons, episodes and new premieres.</p>

          <span>
            Open Series
            <i className="bx bx-chevron-right"></i>
          </span>
        </NavLink>

        <NavLink to="/favorites" className="home-card">
          <div className="home-card-icon">
            <i className="bx bxs-bookmark-heart"></i>
          </div>

          <h2>Favorites</h2>
          <p>Keep your best movies and shows saved in one clean collection.</p>

          <span>
            View Favorites
            <i className="bx bx-chevron-right"></i>
          </span>
        </NavLink>

        <NavLink to="/watch-later" className="home-card">
          <div className="home-card-icon">
            <i className="bx bxs-time-five"></i>
          </div>

          <h2>Watch Later</h2>
          <p>Save titles for later and build your perfect movie night queue.</p>

          <span>
            View Watch Later
            <i className="bx bx-chevron-right"></i>
          </span>
        </NavLink>
      </section>
    </main>
  );
}

export default Home;