import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

import Home from "./Home";

import Movies from "./pages/Movies";
import TvShows from "./pages/TvShows";

import SearchPage from "./pages/SearchPage";
import FavoritePage from "./pages/FavoritePage";
import WatchLaterPage from "./pages/WatchLaterPage";

import About from "./About";

import MovieDetail from "./MovieDetail";
import MoviePlayerPage from "./MoviePlayerPage";

import TvDetail from "./TvDetail";
import TvPlayerPage from "./TvPlayerPage";

function App() {
  return (
    <div className="app">
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/movies" element={<Movies />} />
          <Route path="/series" element={<TvShows />} />

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