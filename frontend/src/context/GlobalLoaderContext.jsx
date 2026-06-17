import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const GlobalLoaderContext = createContext({
  isLoading: false,
  showLoader: () => {},
  hideLoader: () => {},
});

export const useGlobalLoader = () => useContext(GlobalLoaderContext);

export const GlobalLoaderProvider = ({ children }) => {
  const [activeRequestIds, setActiveRequestIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const timeoutsRef = useRef(new Map());

  const showLoader = useCallback((id) => {
    setActiveRequestIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // Safety timeout: automatically remove the request from the loading set after 10 seconds.
    // This prevents any network hang, cancel, or uncaught error from locking the loader on the screen.
    const timer = setTimeout(() => {
      hideLoader(id);
    }, 10000);
    
    // Clear any existing timer for this ID if it was already active
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id));
    }
    timeoutsRef.current.set(id, timer);
  }, []);

  const hideLoader = useCallback((id) => {
    setActiveRequestIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    const timer = timeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(id);
    }
  }, []);

  // Update isLoading with a 300ms debounce when showing (to avoid flashing for fast requests)
  useEffect(() => {
    let timer;
    if (activeRequestIds.size > 0) {
      timer = setTimeout(() => {
        setIsLoading(true);
      }, 300);
    } else {
      setIsLoading(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeRequestIds]);

  useEffect(() => {
    const handleShow = (e) => {
      const id = e.detail?.id || 'default';
      showLoader(id);
    };
    const handleHide = (e) => {
      const id = e.detail?.id || 'default';
      hideLoader(id);
    };

    window.addEventListener('show-global-loader', handleShow);
    window.addEventListener('hide-global-loader', handleHide);

    // Legacy fallback support for standard CustomEvents or basic Events
    const handleLegacyShow = () => showLoader('legacy-' + Math.random().toString(36).substring(2));
    const handleLegacyHide = () => {
      setActiveRequestIds((prev) => {
        const next = new Set(prev);
        // Find and delete the first legacy/default active request
        for (const id of next) {
          if (id.startsWith('legacy-') || id === 'default') {
            next.delete(id);
            break;
          }
        }
        return next;
      });
    };
    
    window.addEventListener('show-global-loader-legacy', handleLegacyShow);
    window.addEventListener('hide-global-loader-legacy', handleLegacyHide);

    return () => {
      window.removeEventListener('show-global-loader', handleShow);
      window.removeEventListener('hide-global-loader', handleHide);
      window.removeEventListener('show-global-loader-legacy', handleLegacyShow);
      window.removeEventListener('hide-global-loader-legacy', handleLegacyHide);
      
      // Clean up all timeouts on unmount
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current.clear();
    };
  }, [showLoader, hideLoader]);

  // Expose backward compatible handlers
  const showLoaderLegacy = useCallback(() => {
    const id = 'legacy-' + Math.random().toString(36).substring(2);
    showLoader(id);
  }, [showLoader]);

  const hideLoaderLegacy = useCallback(() => {
    setActiveRequestIds((prev) => {
      const next = new Set(prev);
      for (const id of next) {
        if (id.startsWith('legacy-') || id === 'default') {
          next.delete(id);
          break;
        }
      }
      return next;
    });
  }, []);

  return (
    <GlobalLoaderContext.Provider
      value={{
        isLoading,
        showLoader: showLoaderLegacy,
        hideLoader: hideLoaderLegacy,
      }}
    >
      {children}
    </GlobalLoaderContext.Provider>
  );
};
