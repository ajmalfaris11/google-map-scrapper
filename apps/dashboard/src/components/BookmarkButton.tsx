"use client";

import { Bookmark } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";

export const BookmarkButton = ({ leadId }: { leadId: string }) => {
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const isBookmarked = bookmarkedIds.includes(leadId);

  return (
    <button 
      onClick={(e) => { 
        e.preventDefault(); 
        toggleBookmark(leadId);
      }}
      className={`shrink-0 p-1.5 rounded-full transition-all ${
        isBookmarked 
          ? 'text-[#0052ff] bg-[#0052ff]/10' 
          : 'text-gray-300 hover:text-[#0052ff] hover:bg-[#0052ff]/5'
      }`}
      title={isBookmarked ? "Remove bookmark" : "Bookmark this lead"}
    >
      <Bookmark size={18} className={isBookmarked ? 'fill-[#0052ff]' : ''} />
    </button>
  );
};
