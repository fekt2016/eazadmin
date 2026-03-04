import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
    getAllShippingCharges,
    getShippingChargeByOrder,
    getShippingChargesSummary,
    getShippingRate,
    updateShippingRate,
    settleShippingCharge,
} from '../services/shippingApi';

export const useGetShippingCharges = (params = {}) => {
    return useQuery({
        queryKey: ['shipping', 'charges', params],
        queryFn: () => getAllShippingCharges(params),
        staleTime: 1000 * 60 * 2, // 2 minutes
        keepPreviousData: true,
    });
};

export const useGetShippingChargeByOrder = (orderId) => {
    return useQuery({
        queryKey: ['shipping', 'charges', 'order', orderId],
        queryFn: () => getShippingChargeByOrder(orderId),
        enabled: !!orderId,
    });
};

export const useGetShippingChargesSummary = (params = {}) => {
    return useQuery({
        queryKey: ['shipping', 'summary', params],
        queryFn: () => getShippingChargesSummary(params),
        staleTime: 1000 * 60 * 1, // 1 minute
    });
};

export const useGetShippingRate = () => {
    return useQuery({
        queryKey: ['shipping', 'rate'],
        queryFn: getShippingRate,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useUpdateShippingRate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => updateShippingRate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shipping', 'rate'] });
            toast.success('Shipping rate updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update shipping rate');
        },
    });
};

export const useSettleShippingCharge = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => settleShippingCharge(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shipping', 'charges'] });
            queryClient.invalidateQueries({ queryKey: ['shipping', 'summary'] });
            toast.success('Dispatcher payout marked as settled');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to settle shipping charge');
        },
    });
};
