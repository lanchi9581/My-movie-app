import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "prestige_scroll_positions";

function getPositions() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function savePosition(key) {
  const positions = getPositions();

  positions[key] = {
    x: window.scrollX,
    y: window.scrollY,
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

function restorePosition(key) {
  const positions = getPositions();
  const saved = positions[key];

  if (!saved) {
    window.scrollTo(0, 0);
    return;
  }

  let attempts = 0;
  const maxAttempts = 25;

  function tryRestore() {
    attempts += 1;

    window.scrollTo(saved.x, saved.y);

    const closeEnough = Math.abs(window.scrollY - saved.y) < 20;
    const canStillTry = attempts < maxAttempts;

    if (!closeEnough && canStillTry) {
      requestAnimationFrame(tryRestore);
    }
  }

  requestAnimationFrame(tryRestore);
}

function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const key = location.key;

    const handleSave = () => savePosition(key);

    window.addEventListener("scroll", handleSave, { passive: true });
    window.addEventListener("beforeunload", handleSave);

    return () => {
      handleSave();
      window.removeEventListener("scroll", handleSave);
      window.removeEventListener("beforeunload", handleSave);
    };
  }, [location.key]);

  useLayoutEffect(() => {
    if (navigationType === "POP") {
      restorePosition(location.key);
      return;
    }

    window.scrollTo(0, 0);
  }, [location.key, navigationType]);

  return null;
}

export default ScrollManager;