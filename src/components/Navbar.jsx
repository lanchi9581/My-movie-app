import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useState } from 'react';
import './Navbar.css';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header>
      <h1 className="h1-5-redish">Prestige Movies</h1><h1></h1>
      <hr className="custom-hr" />
      <nav className="navbar">
        {/* Hamburger Button - Mobile Only */}
        <button 
          className="hamburger-btn"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <i className={`bx ${isMenuOpen ? 'bx-x' : 'bx-menu'}`}></i>
        </button>

        {/* Left Navigation */}
        <div className={`navbar-left ${isMenuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-list">
            <li>
              <NavLink to="/" className="nav-link" onClick={closeMenu}>
                <i className="bx bxs-home nav-icon"></i> 
                <span className="nav-text">Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/movies" className="nav-link" onClick={closeMenu}>
                <i className="bx bxs-movie nav-icon"></i> 
                <span className="nav-text">Movies</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/series" className="nav-link" onClick={closeMenu}>
                <i className="bx bxs-tv nav-icon"></i> 
                <span className="nav-text">Series</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className="nav-link" onClick={closeMenu}>
                <i className="bx bxs-book nav-icon"></i> 
                <span className="nav-text">About</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" className="nav-link" onClick={closeMenu}>
                <i className="bx bxs-chat nav-icon"></i> 
                <span className="nav-text">Contact support</span>
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Right Navigation */}
        <div className={`navbar-right ${isMenuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-list">
            <li><ThemeToggle /></li>
            <li>
              <NavLink to="/favorites" className="nav-link" onClick={closeMenu}>
                <i className="bx bxs-heart nav-icon"></i> 
                <span className="nav-text">Favorites</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/watch-later" className="nav-link" onClick={closeMenu}>
                <i className="bx bxs-time nav-icon"></i> 
                <span className="nav-text">Watch Later</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/login" className="nav-link" onClick={closeMenu}>
                <i className="bx bx-log-in nav-icon"></i> 
                <span className="nav-text">Log in</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/register" className="nav-link" onClick={closeMenu}>
                <i className="bx bxs-edit nav-icon"></i> 
                <span className="nav-text">Register</span>
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Overlay for mobile */}
        {isMenuOpen && (
          <div className="nav-overlay" onClick={closeMenu}></div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;