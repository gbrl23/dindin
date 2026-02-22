import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTransactions } from '../../../hooks/useTransactions';
import { useProfiles } from '../../../hooks/useProfiles';
import { useCards } from '../../../hooks/useCards';
import { useGroups } from '../../../hooks/useGroups';
import { useCategories } from '../../../hooks/useCategories';
import { useGoals } from '../../../hooks/useGoals';
import { getTodayLocal, formatLocalDate, getInvoiceMonth } from '../../../utils/dateUtils';
import { validateAll, validateAmount, validateDescription, validateDate } from '../../../utils/validation';

export function useTransactionForm({ onSaveSuccess, initialData = null, initialType = 'expense' } = {}) {
    const { user } = useAuth();
    const { profiles } = useProfiles();
    const { cards } = useCards();
    const { groups, getGroupMembers } = useGroups();
    const { categories } = useCategories();
    const { goals } = useGoals();
    const { addTransactionsBulk, updateTransaction, updateTransactionSeries } = useTransactions();

    // --- Basic State ---
    const [type, setType] = useState(initialData?.type || initialType);
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData?.date || getTodayLocal());
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialData?.category_id || '');
    const [selectedGoalId, setSelectedGoalId] = useState(initialData?.goal_id || '');
    const [cardId, setCardId] = useState(initialData?.card_id || '');
    const [payerId, setPayerId] = useState(initialData?.payer_id || '');

    // --- Advanced Features ---
    const [isRecurring, setIsRecurring] = useState(false);
    const [installments, setInstallments] = useState(1);
    const [isGroupTransaction, setIsGroupTransaction] = useState(!!initialData?.group_id);
    const [selectedGroupId, setSelectedGroupId] = useState(initialData?.group_id || '');
    const [splitMode, setSplitMode] = useState('equal');
    const [selectedProfiles, setSelectedProfiles] = useState([]);
    const [customShares, setCustomShares] = useState({});

    // --- Technical State ---
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [competenceDate, setCompetenceDate] = useState(getTodayLocal());
    const [isCompetenceManual, setIsCompetenceManual] = useState(false);
    const [placeholder, setPlaceholder] = useState('Ex: Mercado...');

    const transactionPlaceholders = {
        expense: ['Mercado', 'Combustível', 'Restaurante', 'Farmácia', 'Assinatura Netflix', 'Academia', 'Shopping'],
        income: ['Salário', 'Dividendos', 'Freela', 'Venda de Produto', 'Reembolso', 'Bônus'],
        bill: ['Luz', 'Água', 'Internet', 'Aluguel', 'Condomínio', 'Seguro', 'IPTU'],
        investment: ['CBD', 'Tesouro Direto', 'Ações', 'Bitcoin', 'Fundos Imobiliários', 'Previdência'],
    };

    // --- Valor Mask Logic ---
    const formatCurrencyMask = (value) => {
        const cleanValue = value.replace(/\D/g, '');
        if (!cleanValue) return '0,00';
        const numberValue = parseInt(cleanValue, 10) / 100;
        return numberValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const handleAmountChange = (e) => {
        const formatted = formatCurrencyMask(e.target.value);
        setAmount(formatted);
    };

    // --- Helpers ---
    const pad = (n) => String(n).padStart(2, '0');

    const addMonthsToDate = (dateStr, monthsToAdd) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        let newMonth = m + monthsToAdd;
        let newYear = y;
        while (newMonth > 12) { newMonth -= 12; newYear++; }
        while (newMonth < 1) { newMonth += 12; newYear--; }
        return `${newYear}-${pad(newMonth)}-${pad(d)}`;
    };

    // --- Initialization ---
    useEffect(() => {
        if (user && profiles.length > 0 && !payerId) {
            const myProfile = profiles.find(p => p.user_id === user.id);
            if (myProfile) setPayerId(myProfile.id);
        }
    }, [user, profiles, payerId]);

    // Initial load for editing series info
    useEffect(() => {
        if (initialData?.series_id) {
            const installmentMatch = initialData.description.match(/\((\d+)\/(\d+)\)/);
            if (installmentMatch) {
                setIsRecurring(false);
                setInstallments(parseInt(installmentMatch[2]));
            } else {
                setIsRecurring(true);
                setInstallments(1);
            }
        }
    }, [initialData]);

    // Load profiles/members
    useEffect(() => {
        let isCancelled = false;

        async function initProfiles() {
            // Get current user profile from profiles list for fallback
            const myProfile = profiles.find(p => p.user_id === user?.id);
            const myDefaultProfile = myProfile ? { ...myProfile, isSelected: true, isOwner: true } : null;

            if (selectedGroupId) {
                const members = await getGroupMembers(selectedGroupId);
                if (isCancelled) return;

                if (members && members.length > 0) {
                    const groupMembersMapped = members.map(m => ({
                        ...m,
                        isSelected: true,
                        isOwner: m.user_id === user?.id
                    }));

                    // Add ghost profiles created by the user so they can be selected in the group split
                    const myGhostProfiles = profiles.filter(p => !p.user_id && p.created_by === myDefaultProfile?.id).map(p => ({
                        ...p,
                        isSelected: false,
                        isOwner: false
                    }));

                    setSelectedProfiles([...groupMembersMapped, ...myGhostProfiles]);

                    const meInGroup = members.find(m => m.user_id === user?.id);
                    if (meInGroup) setPayerId(meInGroup.id);
                } else if (myDefaultProfile) {
                    setSelectedProfiles([myDefaultProfile]);
                    setPayerId(myDefaultProfile.id);
                }
            } else if (profiles.length > 0) {
                setSelectedProfiles(profiles.map(p => ({
                    ...p,
                    isSelected: p.user_id === user?.id,
                    isOwner: p.user_id === user?.id
                })));

                if (myProfile) setPayerId(myProfile.id);
            }
        }

        initProfiles();
        return () => { isCancelled = true; };
    }, [selectedGroupId, user?.id, profiles, getGroupMembers]);

    // Competence Logic
    useEffect(() => {
        if (isCompetenceManual || !user || profiles.length === 0 || !date) return;
        const myProfile = profiles.find(p => p.user_id === user.id);
        const startDay = myProfile?.financial_start_day || 1;

        const [year, month, day] = date.split('-').map(Number);
        let targetMonth = month;
        let targetYear = year;

        if (startDay > 1 && day >= startDay) {
            targetMonth++;
            if (targetMonth > 12) { targetMonth = 1; targetYear++; }
        }
        setCompetenceDate(`${targetYear}-${pad(targetMonth)}-01`);
    }, [date, user, profiles, isCompetenceManual]);

    // Update placeholder based on type
    useEffect(() => {
        const list = transactionPlaceholders[type] || transactionPlaceholders.expense;
        const random = list[Math.floor(Math.random() * list.length)];
        setPlaceholder(`Ex: ${random}...`);
    }, [type]);

    // --- Submission ---
    const save = async (editScope = 'single') => {
        const validation = validateAll({
            amount: validateAmount(amount),
            description: validateDescription(description),
            date: validateDate(date)
        });

        setErrors(validation.errors);
        setTouched({ amount: true, description: true, date: true });

        if (!validation.valid) return false;

        try {
            setIsSaving(true);
            const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
            const numInstallments = isRecurring ? 12 : (type === 'expense' ? installments : 1);
            const installmentAmount = (type === 'expense' && !isRecurring && numInstallments > 1)
                ? (numericAmount / numInstallments)
                : numericAmount;

            const generateUUID = () => {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    return crypto.randomUUID();
                }
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            };

            const seriesId = (numInstallments > 1 || isRecurring) ? (initialData?.series_id || generateUUID()) : null;
            const batch = [];

            for (let i = 0; i < numInstallments; i++) {
                const txDate = addMonthsToDate(date, i);
                // Invoice Date Calculation
                let invoiceDate = null;
                if (type === 'expense' && cardId) {
                    const selectedCard = cards.find(c => c.id === cardId);
                    if (selectedCard?.closing_day) {
                        invoiceDate = getInvoiceMonth(txDate, selectedCard.closing_day);
                    }
                }

                // Shares Logic
                let shares = [];
                if (isGroupTransaction) {
                    const activeParticipants = selectedProfiles.filter(p => p.isSelected);
                    if (activeParticipants.length > 0) {
                        if (splitMode === 'custom') {
                            shares = activeParticipants.map(p => ({
                                profile_id: p.id,
                                share_amount: (parseFloat(customShares[p.id]?.replace(',', '.') || '0')) / (isRecurring ? 1 : numInstallments),
                                paid: p.id === payerId
                            }));
                        } else {
                            const equalShare = installmentAmount / activeParticipants.length;
                            shares = activeParticipants.map(p => ({
                                profile_id: p.id,
                                share_amount: equalShare,
                                paid: p.id === payerId
                            }));
                        }
                    }
                }

                const categoryObj = categories.find(c => c.id === selectedCategoryId);
                const categoryName = categoryObj ? categoryObj.name : (type === 'bill' ? 'Conta' : 'Geral');

                batch.push({
                    amount: installmentAmount,
                    description: description + (numInstallments > 1 && !isRecurring ? ` (${i + 1}/${numInstallments})` : ''),
                    date: txDate,
                    invoice_date: invoiceDate,
                    payer_id: payerId,
                    card_id: type === 'expense' ? cardId : null,
                    category: categoryName,
                    category_id: selectedCategoryId || null,
                    type,
                    shares,
                    series_id: seriesId,
                    group_id: isGroupTransaction ? selectedGroupId : null,
                    goal_id: type === 'investment' ? selectedGoalId : null,
                    competence_date: addMonthsToDate(competenceDate, i)
                });
            }

            if (initialData?.id) {
                if (initialData.series_id && editScope === 'series') {
                    await updateTransactionSeries(initialData.series_id, initialData.id, batch[0], 'series');
                } else {
                    await updateTransaction(initialData.id, batch[0]);
                }
            } else {
                await addTransactionsBulk(batch);
            }

            if (onSaveSuccess) onSaveSuccess();
            return true;
        } catch (err) {
            console.error('Error saving transaction:', err);
            alert('Erro ao salvar: ' + err.message);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        // State
        type, setType,
        amount, setAmount, handleAmountChange,
        description, setDescription,
        date, setDate,
        selectedCategoryId, setSelectedCategoryId,
        selectedGoalId, setSelectedGoalId,
        cardId, setCardId,
        payerId, setPayerId,
        isRecurring, setIsRecurring,
        installments, setInstallments,
        isGroupTransaction, setIsGroupTransaction,
        selectedGroupId, setSelectedGroupId,
        splitMode, setSplitMode,
        selectedProfiles, setSelectedProfiles,
        customShares, setCustomShares,
        competenceDate, setCompetenceDate,
        isCompetenceManual, setIsCompetenceManual,
        placeholder,

        // UI Helpers/State
        isSaving,
        errors,
        touched,
        setTouched,

        // Actions
        save
    };
}
