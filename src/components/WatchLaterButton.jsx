import { useEffect, useState } from 'react';

export default function WatchLaterButton({ id }) {
  const localStorageKey = 'watchLaterMovies';

  const [watchLaterList, setWatchLaterList] = useState([]);
  const [isInWatchLater, setIsInWatchLater] = useState(false);

  const safeParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  // Load watch later iz localStorage
  useEffect(() => {
    const stored = localStorage.getItem(localStorageKey);
    const list = stored ? safeParse(stored) : [];
    setWatchLaterList(list);
  }, []);

  // Update isInWatchLater ko se watchLaterList spremeni
  useEffect(() => {
    setIsInWatchLater(watchLaterList.includes(id));
  }, [watchLaterList, id]);

  const toggleWatchLater = () => {
    let updatedList;

    if (watchLaterList.includes(id)) {
      updatedList = watchLaterList.filter((itemId) => itemId !== id);
    } else {
      updatedList = [...watchLaterList, id];
    }

    // Update state in localStorage
    setWatchLaterList(updatedList);
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
