/**
 * Utility for haptic feedback (vibration) on mobile devices.
 */
export const hapticFeedback = (type = 'light') => {
    if (!('vibrate' in navigator)) return;

    switch (type) {
        case 'light':
            navigator.vibrate(15);
            break;
        case 'medium':
            navigator.vibrate(30);
            break;
        case 'heavy':
            navigator.vibrate(50);
            break;
        case 'success':
            navigator.vibrate([10, 30, 10]);
            break;
        case 'error':
            navigator.vibrate([50, 50, 50]);
            break;
        case 'warning':
            navigator.vibrate([30, 50, 30]);
            break;
        default:
            navigator.vibrate(20);
    }
};
