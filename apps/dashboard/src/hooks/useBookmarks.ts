import { useState, useEffect } from 'react';

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Load initially
  useEffect(() => {
    try {
      const stored = localStorage.getItem('srapper_bookmarks');
      if (stored) {
        setBookmarkedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load bookmarks', e);
    }
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      let next;
      if (prev.includes(id)) {
        next = prev.filter((bookmarkId) => bookmarkId !== id);
      } else {
        next = [...prev, id];
      }
      
      // Delay side effects to keep state updater pure
      setTimeout(() => {
        localStorage.setItem('srapper_bookmarks', JSON.stringify(next));
        // Dispatch a custom event so other instances of the hook (like on the same page) can sync
        window.dispatchEvent(new Event('bookmarks_updated'));
      }, 0);
      
      return next;
    });
  };

  // Listen for changes from other components
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('srapper_bookmarks');
        if (stored) {
          setBookmarkedIds(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to parse bookmarks from event', e);
      }
    };

    window.addEventListener('bookmarks_updated', handleUpdate);
    return () => window.removeEventListener('bookmarks_updated', handleUpdate);
  }, []);

  return { bookmarkedIds, toggleBookmark };
}
