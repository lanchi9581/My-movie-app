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

  // Load watch later list from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(localStorageKey);
    const list = stored ? safeParse(stored) : [];
    setWatchLaterList(list);
  }, []);

  // Update isInWatchLater when watchLaterList or id changes
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

    // Update state and localStorage
    setWatchLaterList(updatedList);
    localStorage.setItem(localStorageKey, JSON.stringify(updatedList));
  };

  return (
    <button className="pill-button" style={{ boxShadow : '0 0 8px 2px rgba(229, 9, 20, 0.6)', border : 'solid 2px rgba(255, 255, 255, 0.3)' }} onClick={toggleWatchLater}>
      
      <i
        className={`bx ${isInWatchLater ? 'bxs-time' : 'bx-time'}`}
        style={{ marginRight: '6px', color: isInWatchLater ? '#f0ad4e' : undefined }}
      ></i>
      {isInWatchLater ? 'In Watch Later' : 'Watch Later'}
    </button>
  );
}
