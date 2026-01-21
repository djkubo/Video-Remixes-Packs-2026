import { useEffect, useRef } from "react";
import { useDataLayer } from "./useDataLayer";

export const useEngagementTracking = () => {
  const { trackEvent } = useDataLayer();
  const scrollMilestones = useRef<Set<number>>(new Set());
  const startTime = useRef<number>(Date.now());
  const timeIntervals = useRef<number[]>([]);

  useEffect(() => {
    // Track page view
    trackEvent("page_view", {
      page_path: window.location.pathname,
      page_title: document.title,
      page_location: window.location.href,
    });

    // Scroll depth tracking
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      const milestones = [25, 50, 75, 100];
      
      milestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !scrollMilestones.current.has(milestone)) {
          scrollMilestones.current.add(milestone);
          trackEvent("scroll_depth", {
            percent: milestone,
            page_path: window.location.pathname,
          });
        }
      });
    };

    // Time on page tracking (every 30 seconds up to 5 minutes)
    const trackTimeOnPage = () => {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000);
      const timeThresholds = [30, 60, 120, 180, 300]; // seconds
      
      timeThresholds.forEach((threshold) => {
        if (timeOnPage >= threshold && !timeIntervals.current.includes(threshold)) {
          timeIntervals.current.push(threshold);
          trackEvent("time_on_page", {
            seconds: threshold,
            page_path: window.location.pathname,
          });
        }
      });
    };

    // Video tracking
    const trackVideoEvents = () => {
      const videos = document.querySelectorAll("video");
      
      videos.forEach((video, index) => {
        // Track video play
        video.addEventListener("play", () => {
          trackEvent("video_play", {
            video_index: index,
            video_src: video.currentSrc || "hero_video",
            page_path: window.location.pathname,
          });
        });

        // Track video pause
        video.addEventListener("pause", () => {
          if (!video.ended) {
            trackEvent("video_pause", {
              video_index: index,
              current_time: Math.round(video.currentTime),
              duration: Math.round(video.duration),
              percent_watched: Math.round((video.currentTime / video.duration) * 100),
            });
          }
        });

        // Track video complete (25%, 50%, 75%, 100%)
        const videoMilestones = new Set<number>();
        video.addEventListener("timeupdate", () => {
          const percent = Math.round((video.currentTime / video.duration) * 100);
          const milestones = [25, 50, 75, 100];
          
          milestones.forEach((milestone) => {
            if (percent >= milestone && !videoMilestones.has(milestone)) {
              videoMilestones.add(milestone);
              trackEvent("video_progress", {
                video_index: index,
                percent: milestone,
              });
            }
          });
        });
      });
    };

    // Set up event listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    const timeInterval = setInterval(trackTimeOnPage, 5000);
    
    // Track video events after a short delay to ensure DOM is ready
    setTimeout(trackVideoEvents, 1000);

    // Track exit intent (when user is about to leave)
    const handleBeforeUnload = () => {
      const totalTime = Math.round((Date.now() - startTime.current) / 1000);
      trackEvent("page_exit", {
        time_on_page: totalTime,
        max_scroll: Math.max(...Array.from(scrollMilestones.current), 0),
        page_path: window.location.pathname,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(timeInterval);
    };
  }, [trackEvent]);
};
