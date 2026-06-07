import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./Navbar.css";

const MAIN_LINKS = [
  { to: "/", label: "Home", icon: "bx bxs-home" },
  { to: "/movies", label: "Movies", icon: "bx bxs-movie" },
  { to: "/series", label: "Series", icon: "bx bxs-tv" },
];

const LIBRARY_LINKS = [
  { to: "/favorites", label: "Favorites", icon: "bx bxs-bookmark-heart" },
  { to: "/watch-later", label: "Watch Later", icon: "bx bxs-time-five" },
  { to: "/about", label: "About", icon: "bx bxs-info-circle" },
];

function getActiveIndex(pathname) {
  if (pathname.startsWith("/movies") || pathname.startsWith("/movie")) return 1;
  if (pathname.startsWith("/series") || pathname.startsWith("/tv")) return 2;
  if (pathname.startsWith("/search")) return 3;
  return 0;
}

function getMobileTabIndex(pathname) {
  if (pathname.startsWith("/movies") || pathname.startsWith("/movie")) return 1;
  if (pathname.startsWith("/series") || pathname.startsWith("/tv")) return 2;
  return 0;
}

function LibraryDropdown({ closeMenu, mobile = false }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        !mobile &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobile]);

  const handleLinkClick = () => {
    setOpen(false);
    closeMenu();
  };

  return (
    <div
      className={mobile ? "mobile-library-select" : "library-select"}
      ref={dropdownRef}
    >
      <button
        type="button"
        className={`${mobile ? "mobile-library-button" : "library-select__button"} ${
          open ? "active" : ""
        }`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span>Library</span>
        <span
          className={mobile ? "mobile-library-arrow" : "library-select__arrow"}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className={mobile ? "mobile-library-menu" : "library-select__menu"}>
          {LIBRARY_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                isActive
                  ? mobile
                    ? "mobile-library-option selected"
                    : "library-select__option selected"
                  : mobile
                    ? "mobile-library-option"
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFloatingNav, setShowFloatingNav] = useState(false);

  const floatingIndex = getActiveIndex(location.pathname);
  const mobileTabIndex = getMobileTabIndex(location.pathname);

  useEffect(() => {
    function handleScroll() {
      setShowFloatingNav(window.scrollY > 220);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const goToSearch = () => {
    navigate("/search");
    closeMenu();
  };

  return (
    <>
      <header className="site-header">
        <nav className="navbar" aria-label="Main navigation">
          <div className="navbar-left">
            <NavLink to="/" className="brand" onClick={closeMenu}>
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

          <button
            className="hamburger-btn"
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <i className="bx bx-menu" aria-hidden="true"></i>
          </button>

          <aside className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
            <div className="mobile-menu-card">
              <div className="mobile-card-header">
                <NavLink
                  to="/"
                  className="mobile-card-brand"
                  onClick={closeMenu}
                >
                  <img src="/logo3.webp" alt="Prestige Movies" />
                  <div>
                    <span>Prestige</span>
                    <strong>Movies</strong>
                  </div>
                </NavLink>

                <button
                  className="close-menu"
                  type="button"
                  onClick={closeMenu}
                  aria-label="Close navigation menu"
                >
                  <i className="bx bx-x" aria-hidden="true"></i>
                </button>
              </div>

              <button className="mobile-search" type="button" onClick={goToSearch}>
                <i className="bx bx-search" aria-hidden="true"></i>
                <span>Search</span>
              </button>

              <div className={`mobile-main-links active-${mobileTabIndex}`}>
                <span className="mobile-tab-indicator"></span>

                {MAIN_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={closeMenu}
                    className="mobile-tab"
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>

              <LibraryDropdown closeMenu={closeMenu} mobile />
            </div>
          </aside>

          {isMenuOpen && <div className="nav-overlay" onClick={closeMenu}></div>}
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

        <button className="floating-link" type="button" onClick={goToSearch}>
          <i className="bx bx-search" aria-hidden="true"></i>
          <span>Search</span>
        </button>
      </nav>
    </>
  );
}

export default Navbar;