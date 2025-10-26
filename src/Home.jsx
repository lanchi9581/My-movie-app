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
          <h2 className="h1-5-redish">Crazy About Movies?</h2>
          <p>Browse action, romance, horror, or indie hits anytime.</p>
          <NavLink to="/movies" className="load-more-btn">
            <i className="bx bxs-movie" style={{ marginRight: '8px', fontSize: '20px'}}></i>Explore Movies
          </NavLink>
        </div>

        <div className="home-card">
          <h2 className="h1-5-redish">Fan of TV Shows?</h2>
          <p>Get hooked on trending shows and new seasons weekly.</p>
          <NavLink to="/series" className="load-more-btn">
            <i className="bx bxs-tv" style={{ marginRight: '8px', fontSize: '20px'}}></i>Browse Series
          </NavLink>
        </div>

        <div className="home-card">
          <h2 className="h2-redish">Need Help?</h2>
          <p>Contact support for quick help, feedback or account issues.</p>
          <NavLink to="/contact" className="load-more-btn">
            <i className="bx bxs-chat" style={{ marginRight: '8px', fontSize: '20px'}}></i>Contact Support
          </NavLink>
        </div>

        <div className="home-card">
          <h2 className="h2-redish">My Collection</h2>
          <p>Organize your favorites and watch later list to make movie nights effortless.</p>
          <NavLink to="/favorites" className="load-more-btn">
            <i className="bx bxs-bookmarks" style={{ marginRight: '8px', fontSize: '20px'}}></i>Favorites
          </NavLink>
          <NavLink to="/watch-later" className="load-more-btn">
            <i className="bx bxs-time" style={{ marginRight: '8px', fontSize: '20px'}}></i>Watch Later
          </NavLink>
        </div>
      </section>
      <br />
      <br />
      <br />
      <br />
      <br />
    </main>
  );
}

export default Home;
