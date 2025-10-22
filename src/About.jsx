import './index.css';
import React from 'react';

export default function About() {
  return (
    <>
      <h1 className="h2-redish">About us</h1>

      <section className="about-section">
        <p>
          Welcome to <strong>Prestige Movies</strong> - your go-to destination for discovering and exploring movies from <strong>every genre, country, and era.</strong>
        </p>
        <p>
          Whether you're a <b>casual viewer</b> or a <b>dedicated film fan</b>, this site is designed to help you quickly find something <b>great to watch</b>. 
          From <b>Hollywood blockbusters</b> to <b>indie hits</b> and <b>hidden gems</b>, our movie collection is always growing.
        </p>
        <br />
        <h3 className="h3-redish">What you'll Find Here:</h3>
        <ul className="About-list">
          <li className="costum-li"><b>A wide range of genres:</b> action, drama, comedy, horror, romance, thrillers, and more</li>
          <li className="costum-li"><b>Easy-to-browse movie listings</b> with posters, summaries, and key info</li>
          <li className="costum-li"><b>Regular updates</b> with new and classic films</li>
          <li className="costum-li"><b>A simple, user-friendly design</b> to help you get to the good stuff faster</li>
          </ul>
          <p>We're here to make movie discovery easy - no logins, no subscriptions, just great films at your fingertips.</p>
        <br />
        <h3 className="h3-redish">Why We Built This</h3>
          <p>We <b>love movies</b>.
          And we wanted a place where people could browse through a wide selection <b>withouth feeling overwhelmed</b>: 
          <b>That's what inspired us to build Prestige Movies</b> - space focused on helping you find your next favorite film.
          </p>
          <p>So <b>grab some popcorn</b>, <b>get comfy</b>, and <b>start exploring</b>. We're excited to help you find your <b>next great movie experience!</b></p>
          
          <br /><br /><br />
          <p>Prestige Movies was created in 2025 with a simple goal: to make movie discovery easire and more enjoyable for everyone. </p>
          <p className="MadeBy">Made by: Lan</p>
      </section>

    </>
  );
}