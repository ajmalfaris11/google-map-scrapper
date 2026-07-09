"use client";

import { Maximize, Minimize } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export function FullScreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIsFullscreen(!!document.fullscreenElement);
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        toast.error("Failed to enter full screen mode");
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <button
      onClick={toggleFullScreen}
      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-bg-tertiary transition-colors"
      title="Toggle full screen"
    >
      {isFullscreen ? (
        <Minimize className="h-5 w-5 text-text-secondary hover:text-text-primary" />
      ) : (
        <Maximize className="h-5 w-5 text-text-secondary hover:text-text-primary" />
      )}
      <span className="sr-only">Toggle full screen</span>
    </button>
  );
}
