import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * A lightweight virtualization component.
 * Ideal for lists with hundreds of items.
 */
export default function VirtualList({ items, renderItem, itemHeight = 100, buffer = 5, className = "" }) {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        const handleScroll = (e) => {
            setScrollTop(e.target.scrollTop);
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            setContainerHeight(container.offsetHeight);

            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    setContainerHeight(entry.contentRect.height);
                }
            });
            resizeObserver.observe(container);

            return () => {
                container.removeEventListener('scroll', handleScroll);
                resizeObserver.disconnect();
            };
        }
    }, []);

    const { startIndex, visibleItems } = useMemo(() => {
        const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
        const end = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer);

        return {
            startIndex: start,
            visibleItems: items.slice(start, end)
        };
    }, [scrollTop, containerHeight, items, itemHeight, buffer]);

    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    return (
        <div
            ref={containerRef}
            className={`overflow-y-auto relative ${className}`}
            style={{ height: '100%' }}
        >
            <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${offsetY}px)`
                    }}
                >
                    {visibleItems.map((item, index) => renderItem(item, startIndex + index))}
                </div>
            </div>
        </div>
    );
}
