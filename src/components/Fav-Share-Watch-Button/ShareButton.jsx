import React from 'react';
import './ShareButton.css'; 

function ShareButton({ movieTitle = "Movie", movieUrl }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movieTitle,
          text: `Check out this movie: ${movieTitle}`,
          url: movieUrl,
        });
        alert('Thanks for sharing!');
      } catch (error) {
        alert('Sharing failed: ' + error.message);
      }
    } else {
      alert('Your browser doesnt support the share feature.');
    }
  };

  return (
    <button className="pill-button" onClick={handleShare}>
      <i className='bx bx-share' style={{ marginRight: '6px' }}></i> Share
    </button>
  );
}

export default ShareButton;