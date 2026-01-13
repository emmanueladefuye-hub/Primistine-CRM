import { useRef, useEffect, useCallback } from 'react';

export function useAutoScroll(threshold = 50, scrollSpeed = 10) {
    const containerRef = useRef(null);
    const scrollIntervalRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const container = containerRef.current;
        if (!container) return;

        const { top, bottom } = container.getBoundingClientRect();
        const clientY = e.clientY;

        // Clear existing interval to prevent compounding
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }

        // Check proximity to edges
        const distToTop = clientY - top;
        const distToBottom = bottom - clientY;

        if (distToTop < threshold && distToTop >= 0) {
            // Scroll Up
            scrollIntervalRef.current = setInterval(() => {
                container.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
            }, 16); // ~60fps
        } else if (distToBottom < threshold && distToBottom >= 0) {
            // Scroll Down
            scrollIntervalRef.current = setInterval(() => {
                container.scrollBy({ top: scrollSpeed, behavior: 'auto' });
            }, 16);
        }
    }, [threshold, scrollSpeed]);

    const handleMouseLeave = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }
        };
    }, []);

    return { containerRef, handleMouseMove, handleMouseLeave };
}
