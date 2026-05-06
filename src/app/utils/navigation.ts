/**
 * Navigation utilities for hash-based MPA routing
 */

export const navigateTo = (path: string) => {
  window.location.hash = path;
};

export const getCurrentPage = () => {
  return window.location.hash.slice(1) || '/';
};

export const goBack = () => {
  window.history.back();
};

export const goForward = () => {
  window.history.forward();
};
