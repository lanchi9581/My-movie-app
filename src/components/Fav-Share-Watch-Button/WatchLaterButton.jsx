import { useEffect, useState } from "react";

export default function WatchLaterButton({ id }) {
  const localStorageKey = "watchLaterMovies";

  const [watchLaterList, setWatchLaterList] = useState([]);
  const [isInWatchLater, setIsInWatchLater] = useState(false);

  const safeParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(localStorageKey);
    const list = stored ? safeParse(stored) : [];

    setWatchLaterList(list);
  }, []);

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

    setWatchLaterList(updatedList);
    localStorage.setItem(localStorageKey, JSON.stringify(updatedList));
  };

  return (
    <button
      className={isInWatchLater ? "pill-button is-active" : "pill-button"}
      onClick={toggleWatchLater}
      type="button"
    >
      <i className={`bx ${isInWatchLater ? "bxs-time" : "bx-time"}`}></i>
      <span>{isInWatchLater ? "In Watch Later" : "Watch Later"}</span>
    </button>
  );
}