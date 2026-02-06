import { useState, useEffect } from 'react';

const MEDIA_QUERY = '(max-width: 768px)';

export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(MEDIA_QUERY).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQueryList = window.matchMedia(MEDIA_QUERY);
        const handleChange = (e) => setIsMobile(e.matches);

        // Modern browsers
        if (mediaQueryList.addEventListener) {
            mediaQueryList.addEventListener('change', handleChange);
            return () => mediaQueryList.removeEventListener('change', handleChange);
        } else {
            // Fallback for older browsers
            mediaQueryList.addListener(handleChange);
            return () => mediaQueryList.removeListener(handleChange);
        }
    }, []);

    return isMobile;
};
