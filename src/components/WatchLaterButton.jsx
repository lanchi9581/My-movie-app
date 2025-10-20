import { useEffect, useState } from 'react';

export default function WatchLaterButton({ id, contentType = 'movie' }) {
  const localStorageKey = contentType === 'movie' ? 'watchLaterMovies' : 'watchLaterTVShows';
  const [isInWatchLater, setIsInWatchLater] = useState(false);

  useEffect(() => {
    const watchLaterList = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    setIsInWatchLater(watchLaterList.includes(id));
  }, [id, localStorageKey]);

  const toggleWatchLater = () => {
    const watchLaterList = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    let updatedList;

    if (watchLaterList.includes(id)) {
      updatedList = watchLaterList.filter(itemId => itemId !== id);
      setIsInWatchLater(false);
      alert('Removed from watch later!');
    } else {
      updatedList = [...watchLaterList, id];
      setIsInWatchLater(true);
      alert('Added to watch later!');
    }

    localStorage.setItem(localStorageKey, JSON.stringify(updatedList));
  };

  return (
    <button className="pill-button" onClick={toggleWatchLater}>
      <i
        className={`bx ${isInWatchLater ? 'bxs-time' : 'bx-time'}`}
        style={{ marginRight: '6px', color: isInWatchLater ? '#f0ad4e' : undefined }}
      ></i>
      {isInWatchLater ? 'In Watch Later' : 'Watch Later'}
    </button>
  );
}
