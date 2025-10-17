import React from 'react';
import { NavLink } from 'react-router-dom';
import './Home.css'; // Optional: if you want to isolate Home-specific tweaks

function Home() {
  return (
    <main className="home-main">
      <header className="home-header">
        <h1 className="h1-redish">Welcome to Prestige Movies</h1>
        <p className="home-subtitle">Your Gateway to the Finest Films from Around the World</p>
      </header>
      <br />

      <section className="home-sections">
        <div className="home-card">
          <h2 className="h1-5-redish">Love Movies?</h2>
          <p>Browse action, romance, horror, or indie hits anytime.</p>
          <NavLink to="/movies" className="load-more-btn">
            Explore Movies
          </NavLink>
        </div>

        <div className="home-card">
          <h2 className="h1-5-redish">Fan of TV Shows?</h2>
          <p>Get hooked on trending shows and new seasons weekly.</p>
          <NavLink to="/series" className="load-more-btn">
            Browse Series
          </NavLink>
        </div>

        <div className="home-card">
          <h2 className="h2-redish">Need Help?</h2>
          <p>Contact support for quick help, feedback or account issues.</p>
          <NavLink to="/contact" className="load-more-btn">
            Contact Support
          </NavLink>
        </div>

        <div className="home-card">
          <h2 className="h2-redish">Login/Register?</h2>
          <p>Join the fun and unlock exclusive perks</p>
          <NavLink to="/login" className="load-more-btn">
            Login
          </NavLink>
          <NavLink to="/register" className="load-more-btn">
            Register
          </NavLink>
        </div>
      </section>
      <br />
      <br />
      <br />
      <br />
    </main>
  );
}

export default Home;
