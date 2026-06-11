import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./Navbar.css";

const MAIN_LINKS = [
  { to: "/", label: "Home", icon: "bx bxs-home" },
  { to: "/movies", label: "Movies", icon: "bx bxs-movie" },
  { to: "/series", label: "Series", icon: "bx bxs-tv" },
  { to: "/discover", label: "Discover", icon: "bx bx-compass" },
];

const LIBRARY_LINKS = [
  { to: "/favorites", label: "Favorites", icon: "bx bxs-bookmark-heart" },
  { to: "/watch-later", label: "Watch Later", icon: "bx bxs-time-five" },
  { to: "/about", label: "About", icon: "bx bxs-info-circle" },
];

const HIDE_DELAY = 7000;
const MOBILE_WIDTH = 980;

function getActiveIndex(pathname) {
  if (pathname.startsWith("/movies") || pathname.startsWith("/movie")) return 1;
  if (pathname.startsWith("/series") || pathname.startsWith("/tv")) return 2;
  if (pathname.startsWith("/discover")) return 3;
  if (pathname.startsWith("/search")) return 4;
  return 0;
}

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

  function handleLinkClick() {
    setOpen(false);
    closeMenu();
  }

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
              onClick={handleLinkClick}
              className={({ isActive }) =>
                isActive
                  ? "library-select__option selected"
                  : "library-select__option"
              }
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
  const location = useLocation();

  const [showFloatingNav, setShowFloatingNav] = useState(true);
  const hideTimerRef = useRef(null);

  const floatingIndex = getActiveIndex(location.pathname);

  const closeMenu = () => {};

  function goToSearch() {
    navigate("/search");
  }

  useEffect(() => {
    function isMobile() {
      return window.innerWidth <= MOBILE_WIDTH;
    }

    function clearHideTimer() {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    }

    function showNavTemporarily() {
      if (!isMobile()) {
        setShowFloatingNav(false);
        clearHideTimer();
        return;
      }

      setShowFloatingNav(true);
      clearHideTimer();

      hideTimerRef.current = setTimeout(() => {
        setShowFloatingNav(false);
      }, HIDE_DELAY);
    }

    showNavTemporarily();

    window.addEventListener("scroll", showNavTemporarily, { passive: true });
    window.addEventListener("touchstart", showNavTemporarily, { passive: true });
    window.addEventListener("mousemove", showNavTemporarily);
    window.addEventListener("keydown", showNavTemporarily);
    window.addEventListener("resize", showNavTemporarily);

    return () => {
      clearHideTimer();

      window.removeEventListener("scroll", showNavTemporarily);
      window.removeEventListener("touchstart", showNavTemporarily);
      window.removeEventListener("mousemove", showNavTemporarily);
      window.removeEventListener("keydown", showNavTemporarily);
      window.removeEventListener("resize", showNavTemporarily);
    };
  }, [location.pathname]);

  return (
    <>
      <header className="site-header">
        <nav className="navbar" aria-label="Main navigation">
          <div className="navbar-left">
            <NavLink to="/" className="brand">
              <img
                src="/logo3.webp"
                alt="Prestige Movies"
                className="brand-logo"
              />

              <div className="brand-copy">
                <span>Prestige</span>
                <strong>Movies</strong>
              </div>
            </NavLink>

            <button className="search-link" type="button" onClick={goToSearch}>
              <i className="bx bx-search" aria-hidden="true"></i>
              <span>Search</span>
            </button>
          </div>

          <div className="center-nav">
            {MAIN_LINKS.map((link) => (
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

          <div className="mobile-header-actions">
            <NavLink
              to="/favorites"
              className="mobile-header-icon"
              aria-label="Favorites"
            >
              <i className="bx bxs-heart" aria-hidden="true"></i>
            </NavLink>

            <NavLink
              to="/watch-later"
              className="mobile-header-icon"
              aria-label="Watch Later"
            >
              <i className="bx bxs-bookmark" aria-hidden="true"></i>
            </NavLink>

            <NavLink
              to="/about"
              className="mobile-header-icon"
              aria-label="About"
            >
              <i className="bx bxs-info-circle" aria-hidden="true"></i>
            </NavLink>
          </div>
        </nav>
      </header>

      <nav
        className={`mobile-floating-nav ${
          showFloatingNav ? "visible" : ""
        } active-${floatingIndex}`}
        aria-label="Mobile quick navigation"
      >
        <span className="floating-indicator"></span>

        <NavLink to="/" className="floating-link">
          <i className="bx bxs-home" aria-hidden="true"></i>
          <span>Home</span>
        </NavLink>

        <NavLink to="/movies" className="floating-link">
          <i className="bx bxs-movie" aria-hidden="true"></i>
          <span>Movies</span>
        </NavLink>

        <NavLink to="/series" className="floating-link">
          <i className="bx bxs-tv" aria-hidden="true"></i>
          <span>Series</span>
        </NavLink>

        <NavLink to="/discover" className="floating-link">
          <i className="bx bx-compass" aria-hidden="true"></i>
          <span>Discover</span>
        </NavLink>

        <button className="floating-link" type="button" onClick={goToSearch}>
          <i className="bx bx-search" aria-hidden="true"></i>
          <span>Search</span>
        </button>
      </nav>
    </>
  );
}

export default Navbar;