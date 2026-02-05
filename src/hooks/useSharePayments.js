import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useSharePayments() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all payments for a specific share (transaction_id + profile_id)
    const fetchPaymentsForShare = useCallback(async (transactionId, profileId) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('share_payments')
                .select('*')
                .eq('transaction_id', transactionId)
                .eq('profile_id', profileId)
                .order('payment_date', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error fetching payments:', err);
            setError(err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Get total paid for a share
    const getTotalPaid = useCallback(async (transactionId, profileId) => {
        try {
            const payments = await fetchPaymentsForShare(transactionId, profileId);
            return payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        } catch (err) {
            console.error('Error calculating total paid:', err);
            return 0;
        }
    }, [fetchPaymentsForShare]);

    // Add a new payment
    const addPayment = async (transactionId, profileId, amount, paymentDate, notes = null) => {
        if (!user) throw new Error('User not authenticated');

        try {
            setLoading(true);
            setError(null);

            // Get the profile ID of the current user
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profileData) throw new Error('Profile not found');

            const paymentData = {
                transaction_id: transactionId,
                profile_id: profileId,
                amount: parseFloat(amount),
                payment_date: paymentDate,
                notes: notes,
                created_by: profileData.id
            };

            console.log('Inserting payment with data:', paymentData);

            const { data, error } = await supabase
                .from('share_payments')
                .insert([paymentData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error adding payment:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Update an existing payment
    const updatePayment = async (paymentId, amount, paymentDate, notes = null) => {
        try {
            setLoading(true);
            setError(null);

            const paymentData = {
                amount: parseFloat(amount),
                payment_date: paymentDate,
                notes: notes
            };

            const { data, error } = await supabase
                .from('share_payments')
                .update(paymentData)
                .eq('id', paymentId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error updating payment:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Remove a payment
    const removePayment = async (paymentId) => {
        try {
            setLoading(true);
            setError(null);

            const { error } = await supabase
                .from('share_payments')
                .delete()
                .eq('id', paymentId);

            if (error) throw error;
        } catch (err) {
            console.error('Error removing payment:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        fetchPaymentsForShare,
        getTotalPaid,
        addPayment,
        updatePayment,
        removePayment
    };
}
