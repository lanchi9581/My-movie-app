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
    <button className="pill-button" style={{ boxShadow : '0 0 8px 2px rgba(229, 9, 20, 0.6)', border : 'solid 2px rgba(255, 255, 255, 0.3)' }} onClick={handleShare}>
      <i className='bx bx-share' style={{ marginRight: '6px' }}></i> Share
    </button>
  );
}

export default ShareButton;