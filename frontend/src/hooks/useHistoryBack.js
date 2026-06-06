import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useHistoryBack = () => {
  const location = useLocation();

  useEffect(() => {
    const state = window.history.state;
    // Determine if this is the first page in the current session.
    const isFirstPage = !state || state.idx === 0;

    if (isFirstPage) {
      // If we are on the first page, and we haven't already pushed the barrier
      if (!state || !state.isExitBarrier) {
        // Clone React Router's state metadata (key, usr, etc.) and add our exit barrier flag.
        // This ensures compatibility and prevents React Router from losing track of routes.
        const stateCopy = state ? { ...state, isExitBarrier: true } : { idx: 0, isExitBarrier: true };
        window.history.pushState(stateCopy, '', window.location.href);
      }
    }

    const handlePopState = (event) => {
      const currentState = event.state;

      // If we popped back to the original first state (which does not have isExitBarrier)
      const isOriginalFirstState = !currentState || (currentState.idx === 0 && !currentState.isExitBarrier);

      if (isOriginalFirstState) {
        const confirmExit = window.confirm("Do you want to leave this page?");
        if (confirmExit) {
          // Allow exit by going back to the browser's previous site
          window.history.go(-1);
        } else {
          // Restore the barrier state to trap future back actions, keeping React Router state intact
          const stateCopy = currentState ? { ...currentState, isExitBarrier: true } : { idx: 0, isExitBarrier: true };
          window.history.pushState(stateCopy, '', window.location.href);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location]);
};

export default useHistoryBack;
