import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";

const MAIN_LINKS = [
  { to: "/", label: "Home", icon: "bx bxs-home" },
  { to: "/movies", label: "Movies", icon: "bx bxs-movie" },
  { to: "/series", label: "Series", icon: "bx bxs-tv" },
  {
    to: "/search",
    label: "Search",
    icon: "bx bx-search-alt-2",
    mobileOnly: true,
  },
];

const BOTTOM_LINKS = [
  { to: "/favorites", label: "Favorites", icon: "bx bxs-bookmark-heart" },
  { to: "/watch-later", label: "Watch Later", icon: "bx bxs-time-five" },
  { to: "/about", label: "About", icon: "bx bxs-info-circle" },
];

function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const goToSearch = () => {
    navigate("/search");
    closeMenu();
  };

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <NavLink to="/" className="brand" onClick={closeMenu}>
          <div className="brand-mark">
            <img
              src="/logo3.webp"
              alt="Prestige Movies"
              width="42"
              height="42"
            />
          </div>

          <div className="brand-text">
            <span>Prestige</span>
            <strong>Movies</strong>
          </div>
        </NavLink>

        <button
          className="nav-search-button"
          type="button"
          onClick={goToSearch}
          aria-label="Search movies and series"
        >
          <i className="bx bx-search" aria-hidden="true"></i>
          <span>Search</span>
        </button>

        <div className={`nav-menu ${isMenuOpen ? "nav-open" : ""}`}>
          <button
            className="mobile-menu-close"
            onClick={closeMenu}
            type="button"
            aria-label="Close navigation menu"
          >
            <i className="bx bx-x" aria-hidden="true"></i>
          </button>

          <ul className="nav-list">
            {MAIN_LINKS.map((link) => (
              <li
                key={link.to}
                className={link.mobileOnly ? "mobile-only-link" : ""}
              >
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                  onClick={closeMenu}
                >
                  <i className={`${link.icon} nav-icon`} aria-hidden="true"></i>
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <ul className="nav-list nav-list-bottom">
            {BOTTOM_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                  onClick={closeMenu}
                >
                  <i className={`${link.icon} nav-icon`} aria-hidden="true"></i>
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <button
          className="hamburger-btn"
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
        >
          <i
            className={`bx ${isMenuOpen ? "bx-x" : "bx-menu"}`}
            aria-hidden="true"
          ></i>
        </button>

        {isMenuOpen && (
          <div
            className="nav-overlay"
            onClick={closeMenu}
            aria-hidden="true"
          ></div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;