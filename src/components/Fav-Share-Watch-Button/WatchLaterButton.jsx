import { useEffect, useState } from "react";

export default function WatchLaterButton({
  id,
  media_type = "movie",
  title,
  poster_path,
  vote_average,
}) {
  const localStorageKey = "watchLaterItems";

  const [watchLaterList, setWatchLaterList] = useState([]);
  const [isInWatchLater, setIsInWatchLater] = useState(false);

  const safeParse = (value) => {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const normalizeItem = () => ({
    id,
    media_type,
    title: title || "Untitled",
    poster_path: poster_path || null,
    vote_average: vote_average || 0,
  });

  useEffect(() => {
    const stored = localStorage.getItem(localStorageKey);
    setWatchLaterList(safeParse(stored));
  }, []);

  useEffect(() => {
    setIsInWatchLater(
      watchLaterList.some(
        (item) =>
          Number(item.id) === Number(id) && item.media_type === media_type
      )
    );
  }, [watchLaterList, id, media_type]);

  const toggleWatchLater = () => {
    let updatedList;

    if (isInWatchLater) {
      updatedList = watchLaterList.filter(
        (item) =>
          !(
            Number(item.id) === Number(id) &&
            item.media_type === media_type
          )
      );
    } else {
      updatedList = [normalizeItem(), ...watchLaterList];
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