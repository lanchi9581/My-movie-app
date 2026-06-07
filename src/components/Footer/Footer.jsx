import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer>
      <div className="footer-glow" />

      <h3>PRESTIGE MOVIES</h3>

      <p className="tagline">Discover. Watch. Enjoy.</p>

      <div className="footer-links">
        <Link to="/movies">Movies</Link>
        <Link to="/series">TV Series</Link>
        <Link to="/favorites">Favorites</Link>
        <Link to="/about">About</Link>
      </div>

      <p className="copyright">© 2025 Prestige Movies</p>

      <span className="MadeBy">Powered by TMDB</span>
    </footer>
  );
};

export default Footer;