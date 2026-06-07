import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./Navbar.css";

const CENTER_LINKS = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/series", label: "Series" },
];

const LIBRARY_LINKS = [
  { to: "/favorites", label: "Favorites", icon: "bx bxs-bookmark-heart" },
  { to: "/watch-later", label: "Watch Later", icon: "bx bxs-time-five" },
  { to: "/about", label: "About", icon: "bx bxs-info-circle" },
];

function LibraryDropdown({ closeMenu }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLinkClick = () => {
    setOpen(false);
    closeMenu();
  };

  return (
    <div className="library-select" ref={dropdownRef}>
      <button
        type="button"
        className={`library-select__button ${open ? "active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span>Library</span>
        <span className="library-select__arrow">▾</span>
      </button>

      {open && (
        <div className="library-select__menu">
          {LIBRARY_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive
                  ? "library-select__option selected"
                  : "library-select__option"
              }
              onClick={handleLinkClick}
            >
              <i className={link.icon} aria-hidden="true"></i>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const goToSearch = () => {
    navigate("/search");
    closeMenu();
  };

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <NavLink to="/" className="brand" onClick={closeMenu}>
          <img src="/logo3.webp" alt="Prestige Movies" className="brand-logo" />
          <div className="brand-copy">
            <span>Prestige</span>
            <strong>Movies</strong>
          </div>
        </NavLink>

        <button className="search-link" type="button" onClick={goToSearch}>
          <i className="bx bx-search" aria-hidden="true"></i>
          <span>Search</span>
        </button>

        <div className="center-nav">
          {CENTER_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive ? "center-link active" : "center-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <LibraryDropdown closeMenu={closeMenu} />

        <button
          className="hamburger-btn"
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <i className="bx bx-menu" aria-hidden="true"></i>
        </button>

        <aside className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
          <button
            className="close-menu"
            type="button"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            <i className="bx bx-x" aria-hidden="true"></i>
          </button>

          <NavLink to="/" className="mobile-brand" onClick={closeMenu}>
            <img src="/logo3.webp" alt="Prestige Movies" />
            <div>
              <span>Prestige</span>
              <strong>Movies</strong>
            </div>
          </NavLink>

          <button className="mobile-search" type="button" onClick={goToSearch}>
            <i className="bx bx-search" aria-hidden="true"></i>
            <span>Search</span>
          </button>

          <div className="mobile-links">
            {[...CENTER_LINKS, ...LIBRARY_LINKS].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  isActive ? "mobile-link active" : "mobile-link"
                }
              >
                {link.icon && <i className={link.icon} aria-hidden="true"></i>}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </aside>

        {isMenuOpen && <div className="nav-overlay" onClick={closeMenu}></div>}
      </nav>
    </header>
  );
}

export default Navbar;