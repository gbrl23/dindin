import { useCardsContext } from '../contexts/CardsContext';

// Simple wrapper to maintain API compatibility
export function useCards() {
    return useCardsContext();
}
