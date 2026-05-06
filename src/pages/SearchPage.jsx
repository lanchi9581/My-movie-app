import React from "react";
import "./SearchPage.css";

export default function SearchPage() {
  return (
    <div className="search-page">
      <h1>Search</h1>

      <div className="search-box">
        <i className="bx bx-search"></i>
        <input
          type="text"
          placeholder="Search movies or series..."
        />
      </div>
    </div>
  );
}