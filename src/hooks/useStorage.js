import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'expense_tracker_v1';

const INITIAL_STATE = {
    profiles: [
        { id: 'owner', name: 'Eu', isOwner: true },
        { id: 'wife', name: 'Esposa', isOwner: false }
    ],
    transactions: [],
    bills: [],
    cards: [
        { id: 'nubank', name: 'Nubank', closingDay: 1, dueDay: 7 },
        { id: 'itau', name: 'Itaú', closingDay: 10, dueDay: 17 }
    ]
};

export function useStorage() {
    const [data, setData] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return INITIAL_STATE;
            const parsed = JSON.parse(saved);

            // Allow merging but sanitize arrays to prevent "null" crashes
            return {
                ...INITIAL_STATE,
                ...parsed,
                transactions: Array.isArray(parsed.transactions) ? parsed.transactions.filter(t => t) : INITIAL_STATE.transactions,
                cards: Array.isArray(parsed.cards) ? parsed.cards.filter(c => c) : INITIAL_STATE.cards
            };
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            // If error, recover with initial state to prevent white screen
            return INITIAL_STATE;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [data]);

    const addProfile = (name) => {
        const newProfile = { id: uuidv4(), name };
        setData(prev => ({
            ...prev,
            profiles: [...prev.profiles, newProfile]
        }));
    };

    const removeProfile = (id) => {
        if (id === 'owner') return; // Cannot delete self
        setData(prev => ({
            ...prev,
            profiles: prev.profiles.filter(p => p.id !== id)
        }));
    };

    const addTransaction = (transaction) => {
        // transaction: { amount, description, date, card, split: [{ profileId, amount }] }
        const newTx = { ...transaction, id: uuidv4(), createdAt: new Date().toISOString() };
        setData(prev => ({
            ...prev,
            transactions: [newTx, ...prev.transactions]
        }));
    };

    const updateTransaction = (id, updatedFields) => {
        setData(prev => ({
            ...prev,
            transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updatedFields } : t)
        }));
    };

    const deleteTransaction = (id) => {
        setData(prev => ({
            ...prev,
            transactions: prev.transactions.filter(t => t.id !== id)
        }));
    };

    const addBill = (bill) => {
        // bill: { name, amount, dueDate, originalFile (name only for now), isPaid }
        const newBill = { ...bill, id: uuidv4(), isPaid: false };
        setData(prev => ({
            ...prev,
            bills: [newBill, ...prev.bills]
        }));
    };

    const toggleBillPaid = (id) => {
        setData(prev => ({
            ...prev,
            bills: prev.bills.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b)
        }));
    };

    const addCard = (card) => {
        const newCard = { ...card, id: uuidv4() };
        setData(prev => ({
            ...prev,
            cards: [...(prev.cards || []), newCard]
        }));
    };

    const updateCard = (id, updatedFields) => {
        setData(prev => ({
            ...prev,
            cards: prev.cards.map(c => c.id === id ? { ...c, ...updatedFields } : c)
        }));
    };

    const removeCard = (id) => {
        setData(prev => ({
            ...prev,
            cards: prev.cards.filter(c => c.id !== id)
        }));
    };

    return {
        profiles: Array.isArray(data.profiles) ? data.profiles : [],
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        bills: Array.isArray(data.bills) ? data.bills : [],
        cards: Array.isArray(data.cards) ? data.cards : [],
        addProfile,
        removeProfile,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBill,
        toggleBillPaid,
        addCard,
        updateCard,
        removeCard
    };
}
