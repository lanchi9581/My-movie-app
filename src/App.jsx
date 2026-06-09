import { Routes, Route, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import Navbar from "./components/Navbar/Navbar";
import ScrollManager from "./components/ScrollManager";
import Footer from "./components/Footer/Footer";

import Home from "./Home";

import Movies from "./pages/Movies";
import TvShows from "./pages/TvShows";
import Discover from "./pages/Discover";

import SearchPage from "./pages/SearchPage";
import FavoritePage from "./pages/FavoritePage";
import WatchLaterPage from "./pages/WatchLaterPage";

import About from "./pages/About/About";

import MovieDetail from "./MovieDetail";
import MoviePlayerPage from "./MoviePlayerPage";

import TvDetail from "./TvDetail";
import TvPlayerPage from "./TvPlayerPage";

const SITE_URL = "https://prestige-movies.vercel.app";

function App() {
  const location = useLocation();
  const canonicalUrl = `${SITE_URL}${location.pathname}`;

  return (
    <div className="app">
      <Helmet>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <Navbar />
      <ScrollManager />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/movies" element={<Movies />} />
          <Route path="/series" element={<TvShows />} />

          <Route path="/discover" element={<Discover />} />

          <Route path="/search" element={<SearchPage />} />
          <Route path="/favorites" element={<FavoritePage />} />
          <Route path="/watch-later" element={<WatchLaterPage />} />

          <Route path="/about" element={<About />} />

          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/movie/:id/watch" element={<MoviePlayerPage />} />

          <Route path="/series/:id" element={<TvDetail />} />
          <Route path="/series/:id/watch" element={<TvPlayerPage />} />

          <Route path="/tv/:id" element={<TvDetail />} />
          <Route path="/tv/:id/watch" element={<TvPlayerPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;