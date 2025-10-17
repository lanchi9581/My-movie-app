import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar';
import MoviePlayerPage from './MoviePlayerPage.jsx';
import TvPlayerPage from './TvPlayerPage.jsx'
/*Icone*/
import 'boxicons/css/boxicons.min.css';

import Home from './Home.jsx';
import Movies from './Movies.jsx';
import TvShows from './TvShows.jsx';
import About from './About.jsx';
import Contact from './Contact.jsx';
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import Footer from "./components/Footer.jsx";
import MovieDetail from './MovieDetail';
import TvDetail from './TvDetail';


function App() {
  return (
    <div>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/series" element={<TvShows />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/MoviePlayerPage/:id" element={<MoviePlayerPage />} />
          <Route path="/tv/:id" element={<TvDetail />} />
          <Route path="/TvPlayerPage/:id" element={<TvPlayerPage />} />
        </Routes>
        
      </main>
      <Footer />
    </div>
  );
}

export default App;