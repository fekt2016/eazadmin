import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQueryClient, useQueries, useMutation } from "@tanstack/react-query";
import adminUserApi from '../../shared/services/adminUserApi';
import styled from "styled-components";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaStore,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt,
  FaIdCard,
  FaBuilding,
  FaMobileAlt,
  FaWallet,
  FaUndo,
  FaLock,
  FaExclamationTriangle,
  FaEye,
} from "react-icons/fa";
import { useGetSellerBalance, useResetSellerBalance, useResetLockedBalance } from '../../shared/hooks/useSellerBalance';
import { getUserFriendlyErrorMessage } from '../../shared/utils/helpers';
import normalizeError from '../../shared/utils/normalizeError';
import useSellerAdmin, { usePayoutVerificationDetails, useGetSellerById } from '../../shared/hooks/useSellerAdmin';
import adminSellerApi from '../../shared/services/adminSellerApi';
import PayoutVerificationModal from '../../shared/components/Modal/payoutVerificationModal';
import { PATHS } from '../../routes/routhPath';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { toast } from 'react-toastify';

/**
 * Normalizes seller data from any admin API response structure
 * Handles multiple response shapes:
 * - handleFactory.getOne: { status: 'success', data: { data: {...} } }
 * - Custom endpoints: { status: 'success', data: { seller: {...} } }
 * - Direct data: { data: {...} } or {...}
 */
const normalizeSellerResponse = (response) => {
  if (!response) return null;

  // Axios wraps response in .data, so response is the axios response object
  // response.data = actual API response
  const apiResponse = response?.data || response;

  // handleFactory.getOne structure: { status: 'success', data: { data: {...} } }
  if (apiResponse?.data?.data && apiResponse.data.data._id) {
    return apiResponse.data.data;
  }

  // Custom endpoint structure: { status: 'success', data: { seller: {...} } }
  if (apiResponse?.data?.seller && apiResponse.data.seller._id) {
    return apiResponse.data.seller;
  }

  // Direct data structure: { status: 'success', data: {...} }
  if (apiResponse?.data && apiResponse.data._id) {
    return apiResponse.data;
  }

  // Already normalized or direct object: {...}
  if (apiResponse?._id) {
    return apiResponse;
  }

  return null;
};

const SellerDetailPage = () => {
  const { id: sellerId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showResetLockedModal, setShowResetLockedModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null); // 'bank' | 'mtn_momo' | 'vodafone_cash' | 'airtel_tigo_money' | null
  const [selectedPaymentMethodRecord, setSelectedPaymentMethodRecord] = useState(null); // The actual PaymentMethod record object
  const [resetBalance, setResetBalance] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetLockedReason, setResetLockedReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingDocument, setProcessingDocument] = useState(null); // Track which document is being processed

  const { data: sellerResponse, isLoading, error, refetch: refetchSeller } = useGetSellerById(sellerId);
  const { data: balanceData, isLoading: isBalanceLoading } = useGetSellerBalance(sellerId);
  const { 
    data: payoutVerificationData, 
    refetch: refetchPayoutVerification,
    isLoading: isPayoutVerificationLoading,
    error: payoutVerificationError,
  } = usePayoutVerificationDetails(sellerId);
  const { approveVerification, rejectVerification, approvePayout, rejectPayout, updateStatus } = useSellerAdmin();
  const resetBalanceMutation = useResetSellerBalance();
  const resetLockedBalanceMutation = useResetLockedBalance();

  // Reactivate seller (set active: true) — for sellers who previously deleted their account
  const reactivateSellerMutation = useMutation({
    mutationFn: () => adminSellerApi.reactivateSeller(sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "seller", sellerId, "details"]);
      queryClient.invalidateQueries(["admin", "sellers"]);
      toast.success("Seller reactivated. They can log in and use their account again.");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to reactivate seller.");
    },
  });

  // Admin document verification mutation (shared for all documents)
  // CACHE UPDATE STRATEGY:
  // - Backend response is authoritative (includes computed fields)
  // - NO optimistic updates: UI waits for backend confirmation
  // - Cache updated only from API response
  // - UI re-renders from updated cache (buttons hide automatically)
  const updateDocumentStatus = useMutation({
    mutationFn: ({ sellerId: targetSellerId, documentType, status }) =>
      adminSellerApi.updateDocumentStatus(targetSellerId, documentType, status),
    // CACHE UPDATE: Update React Query cache with backend response
    // WHY BACKEND RESPONSE IS AUTHORITATIVE:
    // - Backend has updated database and computed derived fields
    // - Response includes: status, isVerified, isProcessed, shouldShowButtons
    // - UI must reflect database state, not frontend assumptions
    // WHY NO OPTIMISTIC UPDATES:
    // - Prevents UI showing incorrect state if API fails
    // - Ensures buttons hide only when backend confirms verification
    // - State persists correctly after page refresh
    onSuccess: async (response, variables) => {
      const { documentType, status } = variables;
      
      // Extract verification documents and seller status from backend response
      // Backend response includes computed fields (isVerified, isProcessed, shouldShowButtons)
      // Also includes updated verificationStatus and onboardingStage if all documents are verified
      const responseSeller = response?.data?.data?.seller;
      const responseVerificationDocuments = responseSeller?.verificationDocuments;
      const responseVerificationStatus = responseSeller?.verificationStatus;
      const responseOnboardingStage = responseSeller?.onboardingStage;
      const responseVerifiedBy = responseSeller?.verifiedBy;
      const responseVerifiedAt = responseSeller?.verifiedAt;
      const responseVerification = responseSeller?.verification;
      
      if (!responseVerificationDocuments) {
        console.error('[updateDocumentStatus onSuccess] ❌ No verificationDocuments in response');
        return;
      }
      
      // CRITICAL: Validate backend response before updating cache
      const confirmedStatus = responseVerificationDocuments[documentType]?.status;
      const confirmedDoc = responseVerificationDocuments[documentType];
      
      if (confirmedStatus !== status) {
        console.error('[updateDocumentStatus onSuccess] ❌ Status mismatch in response!', {
          expected: status,
          actual: confirmedStatus,
          documentType,
        });
        return; // Don't update cache if response is invalid
      }
      
      if (!confirmedDoc) {
        console.error('[updateDocumentStatus onSuccess] ❌ Document not found in response!', {
          documentType,
          responseVerificationDocuments,
        });
        return;
      }
      
      console.log('[updateDocumentStatus onSuccess] ✅ Response validated:', {
        documentType,
        status: confirmedStatus,
        isVerified: confirmedDoc.isVerified,
        isProcessed: confirmedDoc.isProcessed,
        shouldShowButtons: confirmedDoc.shouldShowButtons,
      });
      
      // CRITICAL FIX: Update cache using a more robust approach
      // Ensure we preserve the exact structure and trigger React Query to recognize the change
      queryClient.setQueryData(["admin", "seller", sellerId, "details"], (oldData) => {
        if (!oldData) {
          console.warn('[updateDocumentStatus onSuccess] No oldData found in cache');
          return oldData;
        }
        
        // Deep clone to ensure React Query detects the change
        // Update cache using structure detection - preserve exact structure
        // Path 1: handleFactory.getOne structure: oldData.data.data.data
        if (oldData?.data?.data?.data && oldData.data.data.data._id) {
          // CRITICAL: Use backend response as the complete source of truth
          // Merge with old data only to preserve other seller fields
          const updated = {
            ...oldData,
            data: {
              ...oldData.data,
              data: {
                ...oldData.data.data,
                data: {
                  ...oldData.data.data.data,
                  // CRITICAL: Use backend response directly - it's the complete, authoritative state
                  // This ensures all computed fields (isVerified, isProcessed, shouldShowButtons) are preserved
                  verificationDocuments: responseVerificationDocuments
                }
              }
            }
          };
          
          // Verify the update includes computed fields
          const verifyNormalized = normalizeSellerResponse(updated);
          const verifyDoc = verifyNormalized?.verificationDocuments?.[documentType];
          
          if (verifyDoc?.status !== status) {
            console.error('[updateDocumentStatus onSuccess] ❌ Cache update failed (path 1): Status mismatch!', {
              expected: status,
              actual: verifyDoc?.status,
            });
          } else {
            console.log('[updateDocumentStatus onSuccess] ✅ Cache updated (path 1):', {
              documentType,
              status: verifyDoc?.status,
              isVerified: verifyDoc?.isVerified,
              isProcessed: verifyDoc?.isProcessed,
              shouldShowButtons: verifyDoc?.shouldShowButtons,
            });
          }
          
          return updated;
        }
        
        // Path 2: Direct seller at oldData.data.data
        if (oldData?.data?.data && oldData.data.data._id && !oldData.data.data.data) {
          // CRITICAL: Use backend response as the complete source of truth
          const updated = {
            ...oldData,
            data: {
              ...oldData.data,
              data: {
                ...oldData.data.data,
                // CRITICAL: Use backend response directly - it's the complete, authoritative state
                verificationDocuments: responseVerificationDocuments,
                // Include updated verificationStatus and onboardingStage if provided
                ...(responseVerificationStatus !== undefined && { verificationStatus: responseVerificationStatus }),
                ...(responseOnboardingStage !== undefined && { onboardingStage: responseOnboardingStage }),
                ...(responseVerifiedBy !== undefined && { verifiedBy: responseVerifiedBy }),
                ...(responseVerifiedAt !== undefined && { verifiedAt: responseVerifiedAt }),
                ...(responseVerification && { verification: { ...oldData.data.data.verification, ...responseVerification } }),
              }
            }
          };
          
          const verifyNormalized = normalizeSellerResponse(updated);
          const verifyDoc = verifyNormalized?.verificationDocuments?.[documentType];
          
          if (verifyDoc?.status !== status) {
            console.error('[updateDocumentStatus onSuccess] ❌ Cache update failed (path 2): Status mismatch!', {
              expected: status,
              actual: verifyDoc?.status,
            });
          } else {
            console.log('[updateDocumentStatus onSuccess] ✅ Cache updated (path 2):', {
              documentType,
              status: verifyDoc?.status,
              isVerified: verifyDoc?.isVerified,
              isProcessed: verifyDoc?.isProcessed,
              shouldShowButtons: verifyDoc?.shouldShowButtons,
            });
          }
          
          return updated;
        }
        
        // Path 3: Fallback - rebuild structure preserving other seller data
        const normalized = normalizeSellerResponse(oldData);
        if (normalized) {
          // CRITICAL: Use backend response as the complete source of truth
          const updated = {
            ...oldData,
            data: {
              ...oldData.data,
              data: {
                ...normalized,
                // CRITICAL: Use backend response directly - it's the complete, authoritative state
                verificationDocuments: responseVerificationDocuments,
                // Include updated verificationStatus and onboardingStage if provided
                ...(responseVerificationStatus !== undefined && { verificationStatus: responseVerificationStatus }),
                ...(responseOnboardingStage !== undefined && { onboardingStage: responseOnboardingStage }),
                ...(responseVerifiedBy !== undefined && { verifiedBy: responseVerifiedBy }),
                ...(responseVerifiedAt !== undefined && { verifiedAt: responseVerifiedAt }),
                ...(responseVerification && { verification: { ...normalized.verification, ...responseVerification } }),
              }
            }
          };
          
          const verifyNormalized = normalizeSellerResponse(updated);
          const verifyDoc = verifyNormalized?.verificationDocuments?.[documentType];
          
          if (verifyDoc?.status !== status) {
            console.error('[updateDocumentStatus onSuccess] ❌ Cache update failed (path 3): Status mismatch!', {
              expected: status,
              actual: verifyDoc?.status,
            });
          } else {
            console.log('[updateDocumentStatus onSuccess] ✅ Cache updated (path 3):', {
              documentType,
              status: verifyDoc?.status,
              isVerified: verifyDoc?.isVerified,
              isProcessed: verifyDoc?.isProcessed,
              shouldShowButtons: verifyDoc?.shouldShowButtons,
            });
          }
          
          return updated;
        }
        
        // Last resort: return oldData if structure is unrecognized
        console.warn('[updateDocumentStatus onSuccess] ⚠️ Unrecognized cache structure, returning oldData');
        return oldData;
      });
      
      // CRITICAL: Force React Query to recognize the cache update
      // Use a small delay to ensure cache update completes before verification
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify cache update: Check that computed fields are present
      const finalCache = queryClient.getQueryData(["admin", "seller", sellerId, "details"]);
      const finalSeller = normalizeSellerResponse(finalCache);
      const finalDoc = finalSeller?.verificationDocuments?.[documentType];
      
      console.log('[updateDocumentStatus onSuccess] 🎯 Final cache verification:', {
        documentType,
        expectedStatus: status,
        actualStatus: finalDoc?.status,
        isVerified: finalDoc?.isVerified,
        isProcessed: finalDoc?.isProcessed,
        shouldShowButtons: finalDoc?.shouldShowButtons,
        matches: finalDoc?.status === status,
      });
      
      if (finalDoc?.status !== status) {
        console.error('[updateDocumentStatus onSuccess] ❌ CRITICAL: Status mismatch after cache update!', {
          expected: status,
          actual: finalDoc?.status,
        });
        // CRITICAL FIX: If cache update failed, refetch from backend
        // This ensures UI eventually reflects correct state
        console.warn('[updateDocumentStatus onSuccess] ⚠️ Refetching seller details to correct cache state');
        queryClient.invalidateQueries(["admin", "seller", sellerId, "details"]);
      }
      
      // Clear processing state: buttons can be re-enabled
      setProcessingDocument(null);
      
      // Invalidate sellers list: refresh list view (doesn't affect current seller details)
      queryClient.invalidateQueries(["admin", "sellers"]);
      
      // IMPORTANT: Do NOT invalidate current seller details query unless cache update failed
      // Cache update is authoritative - refetch would overwrite backend response
    },
    // ERROR HANDLING: Revert state on API failure
    // WHY INVALIDATE CACHE:
    // - API call failed, database was not updated
    // - Cache may contain stale data
    // - Refetch ensures UI matches database state
    onError: (error) => {
      // Clear processing state: allow user to retry
      setProcessingDocument(null);
      
      // Log error for debugging
      console.error('[updateDocumentStatus onError] API call failed:', {
        error,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        isTimeout: error?.isTimeout,
      });
      
      // Invalidate cache: refetch from backend to ensure UI matches database
      queryClient.invalidateQueries(["admin", "seller", sellerId, "details"]);
      
      // Show user-friendly error message
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to update document status. Please try again.';
      toast.error(errorMessage);
    },
  });

  /**
   * DOCUMENT VERIFICATION ACTION: Update document status via backend
   * 
   * ARCHITECTURE:
   * - NO optimistic updates: UI waits for backend confirmation
   * - Backend response is authoritative: cache updated only from API response
   * - UI re-renders from updated cache: buttons hide automatically when shouldShowButtons becomes false
   * 
   * SAFETY CHECKS:
   * - Prevents duplicate submissions (processingDocument state)
   * - Blocks actions on already-processed documents
   * - Disables buttons during request (shouldDisableDocumentButtons)
   * 
   * FLOW:
   * 1. Validate document state (using normalized data)
   * 2. Set processing state (disables buttons)
   * 3. Call backend API
   * 4. onSuccess: Update cache with backend response (includes computed fields)
   * 5. UI re-renders: buttons visibility derived from updated cache
   */
  const handleDocumentStatusUpdate = async (documentType, status) => {
    if (!sellerId) return;
    
    // SAFETY: Prevent duplicate submissions
    if (processingDocument || updateDocumentStatus.isPending) {
      toast.warning('Please wait for the current operation to complete');
      return;
    }

    // SAFETY: Validate document state using normalized data
    const document = seller?.verificationDocuments?.[documentType];
    if (document) {
      const docInfo = getDocumentInfo(document);
      
      // Block if already processed (verified or rejected)
      if (isDocumentProcessed(docInfo)) {
        toast.warning('This document has already been processed');
        return;
      }
      
      // Block if already verified (redundant check, but explicit)
      if (isDocumentVerified(docInfo)) {
        toast.warning('This document is already verified');
        return;
      }
    }

    // Set processing state: buttons will be disabled during request
    setProcessingDocument(documentType);

    try {
      console.log('[handleDocumentStatusUpdate] Calling API with:', { sellerId, documentType, status });
      
      // CRITICAL: Wait for backend response - NO optimistic updates
      // Backend response includes computed fields (isVerified, isProcessed, shouldShowButtons)
      const response = await updateDocumentStatus.mutateAsync({ sellerId, documentType, status });

      console.log('[handleDocumentStatusUpdate] ✅ API call successful:', {
        response,
        responseData: response?.data,
        verificationDocuments: response?.data?.data?.seller?.verificationDocuments,
        updatedDocument: response?.data?.data?.seller?.verificationDocuments?.[documentType],
      });

      const label =
        documentType === 'businessCert'
          ? 'Business certificate'
          : documentType === 'idProof'
          ? 'ID proof'
          : 'Address proof';
      const action = status === 'verified' ? 'verified' : 'rejected';

      toast.success(`${label} ${action} successfully`);
      // Processing state cleared in onSuccess callback
    } catch (error) {
      // Processing state cleared in onError callback
      console.error('[handleDocumentStatusUpdate] Error:', error);
      toast.error(
        error?.response?.data?.message ||
          getUserFriendlyErrorMessage(error) ||
          'Failed to update document status'
      );
    }
  };

  // Normalize all seller data sources
  const sellerCore = normalizeSellerResponse(sellerResponse);
  const sellerBalanceData = normalizeSellerResponse(balanceData);
  
  // IMPORTANT: Don't normalize payoutVerificationData - we need the raw structure to access paymentMethodRecords
  // The backend returns: { status: 'success', data: { seller: { paymentMethodRecords: [...] } } }
  const sellerPayoutData = normalizeSellerResponse(payoutVerificationData);

  // Extract payment method records from payout verification data
  // Axios response structure: 
  // - payoutVerificationData = axios response object { data: {...}, status: 200, ... }
  // - payoutVerificationData.data = API response body { status: 'success', data: { seller: {...} } }
  // - payoutVerificationData.data.data.seller.paymentMethodRecords = the records array
  const paymentMethodRecords = useMemo(() => {
    let records = [];
    
    if (payoutVerificationData) {
      // Try all possible paths
      const apiResponse = payoutVerificationData.data || payoutVerificationData;
      
      // Path 1: payoutVerificationData.data.data.seller.paymentMethodRecords (most likely)
      if (apiResponse?.data?.seller?.paymentMethodRecords) {
        records = apiResponse.data.seller.paymentMethodRecords;
      }
      // Path 2: payoutVerificationData.data.seller.paymentMethodRecords
      else if (apiResponse?.seller?.paymentMethodRecords) {
        records = apiResponse.seller.paymentMethodRecords;
      }
      // Path 3: Direct paymentMethodRecords
      else if (apiResponse?.paymentMethodRecords) {
        records = apiResponse.paymentMethodRecords;
      }
      // Path 4: Check normalized data
      else if (sellerPayoutData?.paymentMethodRecords) {
        records = sellerPayoutData.paymentMethodRecords;
      }
    }
    
    return Array.isArray(records) ? records : [];
  }, [payoutVerificationData, sellerPayoutData]);

  // CRITICAL: Get payment methods from payout verification data (most up-to-date)
  // This ensures payment methods added by seller are visible for approval
  // Use useMemo to get payment methods from the right source
  const paymentMethods = useMemo(() => {
    // Try multiple paths to get paymentMethods from payout verification endpoint
    const apiResponse = payoutVerificationData?.data || payoutVerificationData;
    
    // Path 1: payoutVerificationData.data.data.seller.paymentMethods
    const fromPayout1 = apiResponse?.data?.seller?.paymentMethods;
    // Path 2: payoutVerificationData.data.seller.paymentMethods
    const fromPayout2 = apiResponse?.seller?.paymentMethods;
    
    const fromPayout = fromPayout1 || fromPayout2;
    
    if (fromPayout && (fromPayout.bankAccount || fromPayout.mobileMoney)) {
      return fromPayout;
    }
    // Fallback to merged seller payment methods
    const fallback = sellerPayoutData?.paymentMethods || sellerCore?.paymentMethods || null;
    return fallback;
  }, [payoutVerificationData, sellerPayoutData, sellerCore]);

  // Determine if any payment method is verified (either from seller.profile paymentMethods or individual paymentMethodRecords)
  const hasVerifiedPaymentMethod = useMemo(() => {
    let hasVerified = false;

    // Check profile-level payment methods (bank & mobile money)
    if (paymentMethods?.bankAccount?.payoutStatus === 'verified') {
      hasVerified = true;
    }
    if (paymentMethods?.mobileMoney?.payoutStatus === 'verified') {
      hasVerified = true;
    }

    // Check individual payment method records fetched from payout verification details
    if (Array.isArray(paymentMethodRecords)) {
      const anyVerifiedRecord = paymentMethodRecords.some(
        (pm) => pm?.verificationStatus === 'verified'
      );
      if (anyVerifiedRecord) {
        hasVerified = true;
      }
    }

    return hasVerified;
  }, [paymentMethods, paymentMethodRecords]);

  // Compute a reliable seller-level payout status that reflects verified payment methods
  const derivedPayoutStatus = useMemo(() => {
    // Prefer explicit status from payout endpoint, then core seller
    const backendStatus = sellerPayoutData?.payoutStatus ?? sellerCore?.payoutStatus;

    // If backend explicitly says verified or rejected, trust it
    if (backendStatus === 'verified' || backendStatus === 'rejected') {
      return backendStatus;
    }

    // If any payment method is verified, treat seller payout as verified
    if (hasVerifiedPaymentMethod) {
      return 'verified';
    }

    // Fall back to whatever backend gave us (pending/undefined) or 'pending'
    return backendStatus || 'pending';
  }, [sellerPayoutData, sellerCore, hasVerifiedPaymentMethod]);

  // NOTE: We now display paymentMethodRecords directly (all of them individually)
  // No need to convert to seller.paymentMethods format since we show each record separately

  // Merge seller data predictably - single source of truth
  const seller = useMemo(() => sellerCore
    ? {
        ...sellerCore,

        // Merge balance fields from balance endpoint
        ...(sellerBalanceData && {
          balance: sellerBalanceData.balance ?? sellerCore.balance,
          withdrawableBalance: sellerBalanceData.withdrawableBalance ?? sellerCore.withdrawableBalance,
          lockedBalance: sellerBalanceData.lockedBalance ?? sellerCore.lockedBalance,
          pendingBalance: sellerBalanceData.pendingBalance ?? sellerCore.pendingBalance,
          totalRevenue: sellerBalanceData.totalRevenue ?? sellerCore.totalRevenue,
          totalWithdrawn: sellerBalanceData.totalWithdrawn ?? sellerCore.totalWithdrawn,
          balanceBreakdown: sellerBalanceData.balanceBreakdown ?? sellerCore.balanceBreakdown,
          balanceResets: sellerBalanceData.balanceResets ?? sellerCore.balanceResets,
          fundLocks: sellerBalanceData.fundLocks ?? sellerCore.fundLocks,
          fundUnlocks: sellerBalanceData.fundUnlocks ?? sellerCore.fundUnlocks,
          lastBalanceResetAt: sellerBalanceData.lastBalanceResetAt ?? sellerCore.lastBalanceResetAt,
          lastBalanceResetBy: sellerBalanceData.lastBalanceResetBy ?? sellerCore.lastBalanceResetBy,
          lockedAt: sellerBalanceData.lockedAt ?? sellerCore.lockedAt,
          lockedBalanceResets: sellerBalanceData.lockedBalanceResets ?? sellerCore.lockedBalanceResets,
          lockedBy: sellerBalanceData.lockedBy ?? sellerCore.lockedBy,
          lockedReason: sellerBalanceData.lockedReason ?? sellerCore.lockedReason,
        }),

        // Merge payout fields from payout verification endpoint
        ...(sellerPayoutData && {
          // Use derived payout status so that once at least one payment method
          // is approved, the seller-level payout status is shown as verified.
          payoutStatus: derivedPayoutStatus,
          payoutVerifiedAt: sellerPayoutData.payoutVerifiedAt ?? sellerCore.payoutVerifiedAt,
          payoutVerifiedBy: sellerPayoutData.payoutVerifiedBy ?? sellerCore.payoutVerifiedBy,
          payoutRejectionReason: sellerPayoutData.payoutRejectionReason ?? sellerCore.payoutRejectionReason,
          payoutVerificationHistory: sellerPayoutData.payoutVerificationHistory ?? sellerCore.payoutVerificationHistory,
        }),
        
        // CRITICAL: Merge paymentMethods from payout verification endpoint
        // This ensures payment methods added by seller are visible for approval
        // Use the paymentMethods computed above (from useMemo)
        paymentMethods: paymentMethods,
      }
    : null, [sellerCore, sellerBalanceData, sellerPayoutData, paymentMethods, derivedPayoutStatus]);

  // Collect all unique admin IDs that verified payment methods (after seller is defined)
  const adminIds = useMemo(() => {
    const ids = new Set();
    paymentMethodRecords?.forEach(pm => {
      if (pm.verifiedBy) ids.add(pm.verifiedBy);
    });
    if (seller?.verifiedBy) ids.add(seller.verifiedBy);
    if (seller?.payoutVerifiedBy) ids.add(seller.payoutVerifiedBy);
    return Array.from(ids);
  }, [paymentMethodRecords, seller]);

  // Fetch admin details for all verifiedBy IDs (non-blocking, with timeout)
  // Only fetch if seller is loaded and we have admin IDs
  const adminQueries = useQueries({
    queries: adminIds.length > 0 ? adminIds.map(adminId => ({
      queryKey: ["admin", "user", adminId],
      queryFn: async () => {
        try {
          // Try admin endpoint first with shorter timeout
          const adminPromise = adminUserApi.getAdminDetails(adminId);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Admin fetch timeout')), 3000)
          );
          const response = await Promise.race([adminPromise, timeoutPromise]);
          return response;
        } catch (error) {
          // Fallback to user endpoint with shorter timeout
          try {
            const userPromise = adminUserApi.getUserDetails(adminId);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('User fetch timeout')), 3000)
            );
            const response = await Promise.race([userPromise, timeoutPromise]);
            return response;
          } catch (userError) {
            // Silently fail - admin name is not critical
            return null;
          }
        }
      },
      enabled: !!adminId && !!seller && !isLoading, // Only fetch if seller is loaded and not loading
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false, // Don't retry - admin names are not critical
      refetchOnWindowFocus: false, // Don't refetch on focus
    })) : []
  });

  // Create a map of admin ID to admin name
  const adminNamesMap = useMemo(() => {
    const map = {};
    adminQueries.forEach((query, index) => {
      if (query.data) {
        // Handle different response structures
        // Backend returns: { status: 'success', data: { data: admin } } or { status: 'success', data: admin }
        const admin = query.data?.data?.data || query.data?.data || query.data;
        const adminId = adminIds[index];
        
        if (adminId && admin) {
          // Try multiple fields for admin name
          const adminName = admin?.name || admin?.fullName || admin?.username || admin?.email || null;
          if (adminName) {
            map[adminId] = adminName;
            console.log('[SellerDetailPage] Found admin name:', { adminId, name: adminName });
          } else {
            console.warn('[SellerDetailPage] Admin name not found for ID:', adminId, 'Admin data:', admin);
          }
        }
      } else if (query.isLoading) {
        // Still loading
        const adminId = adminIds[index];
        console.log(`[AdminNamesMap] Still loading admin ${adminId}`);
      } else if (query.error) {
        // Error loading
        const adminId = adminIds[index];
        console.warn('[SellerDetailPage] Error fetching admin:', adminId, query.error);
      }
    });
    
    console.log('[SellerDetailPage] Final admin names map:', map);
    console.log('[SellerDetailPage] Admin IDs collected:', adminIds);
    return map;
  }, [adminQueries, adminIds]);

  
  // Check if seller has all required documents
  const hasAllRequiredDocuments = () => {
    if (!seller) return false;
    const docs = seller.verificationDocuments || {};
    
    const hasBusinessCert = docs.businessCert && 
      (typeof docs.businessCert === 'string' || (docs.businessCert && docs.businessCert.url));
    const hasIdProof = docs.idProof && 
      (typeof docs.idProof === 'string' || (docs.idProof && docs.idProof.url));
    const hasAddressProof = docs.addresProof && 
      (typeof docs.addresProof === 'string' || (docs.addresProof && docs.addresProof.url));
    
    return hasBusinessCert && hasIdProof && hasAddressProof;
  };

  const getMissingDocuments = () => {
    if (!seller) return [];
    const missing = [];
    const docs = seller.verificationDocuments || {};
    
    if (!docs.businessCert || (typeof docs.businessCert !== 'string' && (!docs.businessCert || !docs.businessCert.url))) {
      missing.push('Business Certificate');
    }
    if (!docs.idProof || (typeof docs.idProof !== 'string' && (!docs.idProof || !docs.idProof.url))) {
      missing.push('ID Proof');
    }
    if (!docs.addresProof || (typeof docs.addresProof !== 'string' && (!docs.addresProof || !docs.addresProof.url))) {
      missing.push('Address Proof');
    }
    
    return missing;
  };

  /**
   * NORMALIZATION: Single source of truth for document data transformation
   * 
   * WHY: Backend is authoritative. This function:
   * - Handles legacy formats (string URLs)
   * - Trusts backend-computed fields when available
   * - Provides fallback computation for backward compatibility
   * - Ensures all consumers receive a predictable, normalized shape
   * 
   * IMPORTANT: All downstream code should use normalized data from this function.
   * Never access raw document fields directly.
   * 
   * CRITICAL: Once a document is verified, its status is immutable in the UI.
   * This function ensures verified status cannot be overwritten by stale data.
   */
  const getDocumentInfo = (document) => {
    // Empty state: no document exists
    if (!document) {
      return { 
        url: null, 
        status: null, 
        verifiedBy: null, 
        verifiedAt: null,
        isVerified: false,
        isProcessed: false,
        shouldShowButtons: false,
      };
    }
    
    // Legacy format: document stored as URL string
    // Backward compatibility for old data
    if (typeof document === 'string') {
      return { 
        url: document, 
        status: 'pending', 
        verifiedBy: null, 
        verifiedAt: null,
        isVerified: false,
        isProcessed: false,
        shouldShowButtons: true, // Has URL, status is pending
      };
    }
    
    // Modern format: document object with status and metadata
    // CRITICAL: Read status directly from document - this is the single source of truth
    const status = document.status || 'pending';
    
    // TRUST BACKEND: If backend computed these fields, use them
    // Fallback computation is ONLY for backward compatibility
    // CRITICAL: Once verified, these fields should never revert to false
    const isVerified = document.isVerified !== undefined 
      ? document.isVerified 
      : status === 'verified';
    
    const isProcessed = document.isProcessed !== undefined
      ? document.isProcessed
      : status === 'verified' || status === 'rejected';
    
    // CRITICAL: Buttons should only show if status is pending AND document has URL
    // Once verified/rejected, shouldShowButtons must be false
    const shouldShowButtons = document.shouldShowButtons !== undefined
      ? document.shouldShowButtons
      : status === 'pending' && !!document.url;
    
    // DEFENSIVE: Ensure verified documents never show buttons
    // This prevents stale data from causing buttons to reappear
    const finalShouldShowButtons = (status === 'verified' || status === 'rejected') 
      ? false 
      : shouldShowButtons;
    
    return {
      url: document.url || null,
      status: status, // CRITICAL: This is the single source of truth
      verifiedBy: document.verifiedBy || null,
      verifiedAt: document.verifiedAt || null,
      // Computed fields: backend-provided or fallback
      isVerified,
      isProcessed,
      shouldShowButtons: finalShouldShowButtons, // Defensive check ensures buttons stay hidden
    };
  };

  /**
   * VERIFICATION STATE: Check if document has been processed
   * 
   * WHY: Uses normalized data from getDocumentInfo.
   * Never checks raw document status directly.
   */
  const isDocumentProcessed = (documentInfo) => {
    if (!documentInfo) return false;
    // Trust normalized isProcessed field (computed in getDocumentInfo)
    return documentInfo.isProcessed === true;
  };

  /**
   * VERIFICATION STATE: Check if document is verified
   * 
   * WHY: Uses normalized data from getDocumentInfo.
   * Never checks raw document status directly.
   */
  const isDocumentVerified = (documentInfo) => {
    if (!documentInfo) return false;
    // Trust normalized isVerified field (computed in getDocumentInfo)
    return documentInfo.isVerified === true;
  };

  /**
   * BUTTON VISIBILITY: Determine if Verify/Reject buttons should be shown
   * 
   * BUSINESS RULES (immutable):
   * Buttons appear ONLY when ALL conditions are true:
   * 1. Document exists and has a URL
   * 2. Status is 'pending' (not verified/rejected)
   * 3. Backend allows actions (shouldShowButtons === true)
   * 
   * WHY NO OPTIMISTIC UPDATES:
   * - Backend is single source of truth
   * - UI reflects database state only
   * - Buttons hide automatically when backend sets shouldShowButtons: false
   * 
   * IMPORTANT: This function trusts normalized data from getDocumentInfo.
   * All conditions are derived from backend-computed fields.
   */
  const shouldShowDocumentButtons = (documentInfo, documentType) => {
    // Guard: Document must exist
    if (!documentInfo) return false;
    
    // Guard: Document must have a URL (can't verify without document)
    if (!documentInfo.url) return false;
    
    // BUSINESS RULE: Use normalized shouldShowButtons field
    // This field is computed by backend or getDocumentInfo fallback
    // It encodes: status === 'pending' && has URL
    return documentInfo.shouldShowButtons === true;
  };

  /**
   * BUTTON STATE: Check if buttons should be disabled
   * 
   * WHY: Prevents duplicate submissions during API calls
   * - Disables buttons when mutation is pending
   * - Disables buttons for specific document being processed
   */
  const shouldDisableDocumentButtons = (documentType) => {
    return updateDocumentStatus.isPending || processingDocument === documentType;
  };

  const handleApproveVerification = async () => {
    if (!hasAllRequiredDocuments()) {
      const missingDocs = getMissingDocuments();
      toast.error(`Cannot approve seller verification. Missing required documents: ${missingDocs.join(', ')}`);
      return;
    }

    if (!seller.verification?.emailVerified) {
      toast.error('Cannot approve seller verification. Email must be verified first.');
      return;
    }

    try {
      await approveVerification.mutateAsync(seller._id);
      toast.success('Seller verification approved successfully');
      queryClient.invalidateQueries(["admin", "user", sellerId]);
      queryClient.invalidateQueries(["admin", "sellers"]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve seller verification');
    }
  };

  const handleRejectVerification = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await rejectVerification.mutateAsync({
        sellerId: seller._id,
        reason: rejectionReason.trim(),
      });
      toast.success('Seller verification rejected');
      setShowRejectModal(false);
      setRejectionReason("");
      queryClient.invalidateQueries(["admin", "user", sellerId]);
      queryClient.invalidateQueries(["admin", "sellers"]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject seller verification');
    }
  };

  if (isLoading || isBalanceLoading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  if (error) {
    console.error('❌ [SellerDetailPage] Error loading seller:', error);
    const isTimeout = error?.isTimeout || error?.status === 408 || error?.message?.toLowerCase?.().includes('timeout');
    const errorMessage = isTimeout
      ? 'Request timed out. The server may be slow or your connection is unstable. Please try again.'
      : (error?.response?.data?.message || error?.message || 'Unable to load seller details');
    return (
      <Container>
        <ErrorState>
          <FaExclamationTriangle style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }} />
          <h2>Error Loading Seller</h2>
          <p>{errorMessage}</p>
          <p style={{ fontSize: '0.9rem', color: '#8d99ae', marginTop: '0.5rem' }}>
            Error details: {JSON.stringify({ isTimeout: error?.isTimeout, status: error?.status, message: error?.message }, null, 2)}
          </p>
          <ErrorActions>
            <RetryButton onClick={() => refetchSeller()} disabled={isLoading}>
              Try again
            </RetryButton>
            <BackButton onClick={() => navigate(`/dashboard/${PATHS.USERS}`)}>
              <FaArrowLeft /> Back to Users
            </BackButton>
          </ErrorActions>
        </ErrorState>
      </Container>
    );
  }

  if (!seller) {
    console.error('❌ [SellerDetailPage] Seller is null/undefined after extraction');
    console.error('   sellerResponse:', sellerResponse);
    console.error('   sellerResponse?.data:', sellerResponse?.data);
    console.error('   sellerResponse?.data?.seller:', sellerResponse?.data?.seller);
    return (
      <Container>
        <ErrorState>
          <FaExclamationTriangle style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }} />
          <h2>Seller Not Found</h2>
          <p>The seller you're looking for doesn't exist.</p>
          <p style={{ fontSize: '0.9rem', color: '#8d99ae', marginTop: '0.5rem' }}>
            Response structure: {JSON.stringify(sellerResponse, null, 2)}
          </p>
          <BackButton onClick={() => navigate(`/dashboard/${PATHS.USERS}`)}>
            <FaArrowLeft /> Back to Users
          </BackButton>
        </ErrorState>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={() => navigate(`/dashboard/${PATHS.USERS}`)}>
        <FaArrowLeft /> Back to Users
      </BackButton>

      <PageHeader>
        <HeaderLeft>
          <PageTitle>{seller.shopName}</PageTitle>
          <PageSubtitle>{seller.email}</PageSubtitle>
        </HeaderLeft>
        <HeaderRight>
          {seller.active === false && (
            <ActionButton
              $variant="success"
              onClick={() => reactivateSellerMutation.mutate()}
              disabled={reactivateSellerMutation.isPending}
            >
              <FaUndo />
              {reactivateSellerMutation.isPending ? "Reactivating…" : "Reactivate this seller"}
            </ActionButton>
          )}
        </HeaderRight>
      </PageHeader>

      <ContentGrid>
        {/* Basic Information */}
        <InfoCard>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardBody>
            <InfoRow>
              <InfoLabel>
                <FaUser /> Name
              </InfoLabel>
              <InfoValue>{seller.name}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>
                <FaStore /> Shop Name
              </InfoLabel>
              <InfoValue>{seller.shopName || 'N/A'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>
                <FaEnvelope /> Email
              </InfoLabel>
              <InfoValue>{seller.email}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>
                <FaPhone /> Phone
              </InfoLabel>
              <InfoValue>{seller.phone || 'N/A'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>
                <FaCalendarAlt /> Registration Date
              </InfoLabel>
              <InfoValue>
                {new Date(seller.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Business status</InfoLabel>
              <InfoValue style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <StatusBadge $status={seller.status || 'pending'}>
                  {seller.status === 'active' ? <FaCheckCircle /> : <FaTimesCircle />}
                  {seller.status || 'pending'}
                </StatusBadge>
                {seller.status !== 'active' && (
                  <ActionButton
                    $variant="success"
                    onClick={async () => {
                      try {
                        await reactivateSellerMutation.mutateAsync();
                        await updateStatus.mutateAsync({ sellerId, status: 'active' });
                        queryClient.invalidateQueries(['admin', 'seller', sellerId, 'details']);
                        queryClient.invalidateQueries(['admin', 'sellers']);
                        toast.success('Seller status and account set to active.');
                      } catch (err) {
                        toast.error(err?.response?.data?.message || 'Failed to set active.');
                      }
                    }}
                    disabled={updateStatus.isPending || reactivateSellerMutation.isPending}
                  >
                    {updateStatus.isPending || reactivateSellerMutation.isPending ? 'Updating…' : 'Set status to active'}
                  </ActionButton>
                )}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Account</InfoLabel>
              <InfoValue style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {seller.active === false ? (
                  <>
                    <StatusBadge $status="inactive">Inactive (deactivated)</StatusBadge>
                    <ActionButton
                      $variant="success"
                      onClick={() => reactivateSellerMutation.mutate()}
                      disabled={reactivateSellerMutation.isPending}
                    >
                      <FaUndo />
                      {reactivateSellerMutation.isPending ? 'Reactivating…' : 'Reactivate this seller'}
                    </ActionButton>
                  </>
                ) : (
                  <StatusBadge $status="active">Active</StatusBadge>
                )}
              </InfoValue>
            </InfoRow>
          </CardBody>
        </InfoCard>

        {/* Verification Status */}
        <InfoCard>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
          </CardHeader>
          <CardBody>
            {(() => {
              // Compute identity fully verified: all 3 documents + email + phone verified
              const businessCertInfo = getDocumentInfo(seller.verificationDocuments?.businessCert);
              const idProofInfo = getDocumentInfo(seller.verificationDocuments?.idProof);
              const addressProofInfo = getDocumentInfo(seller.verificationDocuments?.addresProof);
              const allDocsVerified =
                businessCertInfo.isVerified && idProofInfo.isVerified && addressProofInfo.isVerified;
              const isPhoneVerified =
                seller.phone != null && String(seller.phone).trim() !== '';
              const isIdentityFullyVerified =
                allDocsVerified &&
                Boolean(seller.verification?.emailVerified) &&
                isPhoneVerified;
              return (
                <>
                  <InfoRow>
                    <InfoLabel>Overall verification</InfoLabel>
                    <StatusBadge
                      $status={
                        seller.verificationStatus === 'rejected'
                          ? 'rejected'
                          : isIdentityFullyVerified || seller.verificationStatus === 'verified'
                            ? 'verified'
                            : 'pending'
                      }
                    >
                      {seller.verificationStatus === 'rejected' && <FaTimesCircle />}
                      {(isIdentityFullyVerified || seller.verificationStatus === 'verified') && seller.verificationStatus !== 'rejected' && <FaCheckCircle />}
                      {!isIdentityFullyVerified && seller.verificationStatus !== 'verified' && seller.verificationStatus !== 'rejected' && <FaExclamationTriangle />}
                      {seller.verificationStatus === 'rejected'
                        ? 'REJECTED'
                        : isIdentityFullyVerified || seller.verificationStatus === 'verified'
                          ? 'VERIFIED'
                          : 'PENDING'}
                    </StatusBadge>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Fully verified (identity & contact)</InfoLabel>
                    <StatusBadge $status={isIdentityFullyVerified ? 'verified' : 'pending'}>
                      {isIdentityFullyVerified ? (
                        <>
                          <FaCheckCircle /> Verified
                        </>
                      ) : (
                        <>
                          <FaExclamationTriangle /> Pending
                        </>
                      )}
                    </StatusBadge>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Onboarding Stage</InfoLabel>
                    <InfoValue>{seller.onboardingStage || 'N/A'}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Email Verified</InfoLabel>
                    <StatusBadge $status={seller.verification?.emailVerified ? 'verified' : 'pending'}>
                      {seller.verification?.emailVerified ? (
                        <>
                          <FaCheckCircle /> Verified
                        </>
                      ) : (
                        <>
                          <FaTimesCircle /> Not Verified
                        </>
                      )}
                    </StatusBadge>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Phone Verified</InfoLabel>
                    <StatusBadge $status={isPhoneVerified ? 'verified' : 'pending'}>
                      {isPhoneVerified ? (
                        <>
                          <FaCheckCircle /> Verified
                        </>
                      ) : (
                        <>
                          <FaTimesCircle /> Not Verified
                        </>
                      )}
                    </StatusBadge>
                  </InfoRow>
                </>
              );
            })()}
            {seller.verifiedAt && (
              <InfoRow>
                <InfoLabel>Verified At</InfoLabel>
                <InfoValue>
                  {new Date(seller.verifiedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </InfoValue>
              </InfoRow>
            )}
            {seller.verifiedBy && (
              <InfoRow>
                <InfoLabel>Verified By</InfoLabel>
                <InfoValue>{adminNamesMap[seller.verifiedBy] || `Admin ${seller.verifiedBy}`}</InfoValue>
              </InfoRow>
            )}
          </CardBody>
        </InfoCard>

        {/* Verification Documents */}
        <InfoCard>
          <CardHeader>
            <CardTitle>Verification Documents</CardTitle>
          </CardHeader>
          <CardBody>
            {(() => {
              // CRITICAL: Read directly from seller.verificationDocuments[documentType].status
              // This is the SINGLE SOURCE OF TRUTH
              const businessCert = getDocumentInfo(seller.verificationDocuments?.businessCert);
              const idProof = getDocumentInfo(seller.verificationDocuments?.idProof);
              const addressProof = getDocumentInfo(seller.verificationDocuments?.addresProof);

              // DEBUG: Log normalized document state for verification
              // This helps verify that:
              // - Normalization is working correctly
              // - Backend-computed fields are present
              // - Button visibility logic is correct
              // IMPORTANT: rawDocument is for debugging only - never use as source of truth
              console.log('[Document Status Debug]', {
                businessCert: { 
                  status: businessCert.status,
                  isVerified: businessCert.isVerified, // From normalized data
                  isProcessed: businessCert.isProcessed, // From normalized data
                  shouldShowButtons: businessCert.shouldShowButtons, // From normalized data
                  url: businessCert.url,
                  rawDocument: seller.verificationDocuments?.businessCert // Debug only
                },
                idProof: { 
                  status: idProof.status,
                  isVerified: idProof.isVerified,
                  isProcessed: idProof.isProcessed,
                  shouldShowButtons: idProof.shouldShowButtons,
                  url: idProof.url,
                  rawDocument: seller.verificationDocuments?.idProof // Debug only
                },
                addressProof: { 
                  status: addressProof.status,
                  isVerified: addressProof.isVerified,
                  isProcessed: addressProof.isProcessed,
                  shouldShowButtons: addressProof.shouldShowButtons,
                  url: addressProof.url,
                  rawDocument: seller.verificationDocuments?.addresProof // Debug only
                },
                rawDocs: seller.verificationDocuments, // Debug only - never use as source of truth
                sellerId: seller?._id,
              });

              return (
                <>
                  <DocumentItem key={`businessCert-${businessCert.status}-${seller?._id}`}>
                    <DocumentIcon>
                      <FaFileAlt />
                    </DocumentIcon>
                    <DocumentInfo>
                      <DocumentName>Business Certificate</DocumentName>
                      <DocumentStatus $status={businessCert.status}>
                        {businessCert.status === 'verified' && <FaCheckCircle />}
                        {businessCert.status === 'rejected' && <FaTimesCircle />}
                        {businessCert.status ? businessCert.status.toUpperCase() : 'PENDING'}
                        {businessCert.verifiedBy && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                            (by {adminNamesMap[businessCert.verifiedBy] || `Admin ${businessCert.verifiedBy}`})
                          </span>
                        )}
                      </DocumentStatus>
                    </DocumentInfo>
                    <DocumentActionsRow>
                      {businessCert.url && (
                        <DocumentLink href={businessCert.url} target="_blank">
                          <FaEye /> View
                        </DocumentLink>
                      )}
                      {shouldShowDocumentButtons(businessCert, 'businessCert') && (
                        <SmallActionGroup>
                          <SmallActionButton
                            $variant="success"
                            onClick={() => handleDocumentStatusUpdate('businessCert', 'verified')}
                            disabled={shouldDisableDocumentButtons('businessCert')}
                          >
                            <FaCheckCircle /> Verify
                          </SmallActionButton>
                          <SmallActionButton
                            $variant="danger"
                            onClick={() => handleDocumentStatusUpdate('businessCert', 'rejected')}
                            disabled={shouldDisableDocumentButtons('businessCert')}
                          >
                            <FaTimesCircle /> Reject
                          </SmallActionButton>
                        </SmallActionGroup>
                      )}
                    </DocumentActionsRow>
                  </DocumentItem>

                  <DocumentItem key={`idProof-${idProof.status}-${seller?._id}`}>
                    <DocumentIcon>
                      <FaIdCard />
                    </DocumentIcon>
                    <DocumentInfo>
                      <DocumentName>ID Proof</DocumentName>
                      <DocumentStatus $status={idProof.status}>
                        {idProof.status === 'verified' && <FaCheckCircle />}
                        {idProof.status === 'rejected' && <FaTimesCircle />}
                        {idProof.status ? idProof.status.toUpperCase() : 'PENDING'}
                        {idProof.verifiedBy && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                            (by {adminNamesMap[idProof.verifiedBy] || `Admin ${idProof.verifiedBy}`})
                          </span>
                        )}
                      </DocumentStatus>
                    </DocumentInfo>
                    <DocumentActionsRow>
                      {idProof.url && (
                        <DocumentLink href={idProof.url} target="_blank">
                          <FaEye /> View
                        </DocumentLink>
                      )}
                      {shouldShowDocumentButtons(idProof, 'idProof') && (
                        <SmallActionGroup>
                          <SmallActionButton
                            $variant="success"
                            onClick={() => handleDocumentStatusUpdate('idProof', 'verified')}
                            disabled={shouldDisableDocumentButtons('idProof')}
                          >
                            <FaCheckCircle /> Verify
                          </SmallActionButton>
                          <SmallActionButton
                            $variant="danger"
                            onClick={() => handleDocumentStatusUpdate('idProof', 'rejected')}
                            disabled={shouldDisableDocumentButtons('idProof')}
                          >
                            <FaTimesCircle /> Reject
                          </SmallActionButton>
                        </SmallActionGroup>
                      )}
                    </DocumentActionsRow>
                  </DocumentItem>

                  <DocumentItem key={`addressProof-${addressProof.status}-${seller?._id}`}>
                    <DocumentIcon>
                      <FaFileAlt />
                    </DocumentIcon>
                    <DocumentInfo>
                      <DocumentName>Address Proof</DocumentName>
                      <DocumentStatus $status={addressProof.status}>
                        {addressProof.status === 'verified' && <FaCheckCircle />}
                        {addressProof.status === 'rejected' && <FaTimesCircle />}
                        {addressProof.status ? addressProof.status.toUpperCase() : 'PENDING'}
                        {addressProof.verifiedBy && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                            (by {adminNamesMap[addressProof.verifiedBy] || `Admin ${addressProof.verifiedBy}`})
                          </span>
                        )}
                      </DocumentStatus>
                    </DocumentInfo>
                    <DocumentActionsRow>
                      {addressProof.url && (
                        <DocumentLink href={addressProof.url} target="_blank">
                          <FaEye /> View
                        </DocumentLink>
                      )}
                      {shouldShowDocumentButtons(addressProof, 'addresProof') && (
                        <SmallActionGroup>
                          <SmallActionButton
                            $variant="success"
                            onClick={() => handleDocumentStatusUpdate('addresProof', 'verified')}
                            disabled={shouldDisableDocumentButtons('addresProof')}
                          >
                            <FaCheckCircle /> Verify
                          </SmallActionButton>
                          <SmallActionButton
                            $variant="danger"
                            onClick={() => handleDocumentStatusUpdate('addresProof', 'rejected')}
                            disabled={shouldDisableDocumentButtons('addresProof')}
                          >
                            <FaTimesCircle /> Reject
                          </SmallActionButton>
                        </SmallActionGroup>
                      )}
                    </DocumentActionsRow>
                  </DocumentItem>

                  {!hasAllRequiredDocuments() && (
                    <WarningBox>
                      <FaExclamationTriangle />
                      <div>
                        <strong>Missing Documents:</strong> {getMissingDocuments().join(', ')}
                      </div>
                    </WarningBox>
                  )}
                </>
              );
            })()}
          </CardBody>
        </InfoCard>

        {/* Balance Information */}
        <InfoCard>
          <CardHeader>
            <CardTitle>Balance Information</CardTitle>
          </CardHeader>
          <CardBody>
            {isBalanceLoading ? (
              <LoadingText>Loading balance...</LoadingText>
            ) : (
              <>
                <BalanceRow>
                  <BalanceLabel>Total Balance</BalanceLabel>
                  <BalanceValue>GH₵{seller?.balance?.toFixed(2) || '0.00'}</BalanceValue>
                </BalanceRow>
                <BalanceRow>
                  <BalanceLabel>Withdrawable Balance</BalanceLabel>
                  <BalanceValue>GH₵{seller?.withdrawableBalance?.toFixed(2) || '0.00'}</BalanceValue>
                </BalanceRow>
                <BalanceRow>
                  <BalanceLabel>Locked Balance</BalanceLabel>
                  <BalanceValue>GH₵{seller?.lockedBalance?.toFixed(2) || '0.00'}</BalanceValue>
                </BalanceRow>
                <BalanceRow>
                  <BalanceLabel>Pending Balance</BalanceLabel>
                  <BalanceValue>GH₵{seller?.pendingBalance?.toFixed(2) || '0.00'}</BalanceValue>
                </BalanceRow>
                <BalanceRow>
                  <BalanceLabel>Total Withdrawn</BalanceLabel>
                  <BalanceValue>GH₵{seller?.totalWithdrawn?.toFixed(2) || '0.00'}</BalanceValue>
                </BalanceRow>
                <BalanceRow>
                  <BalanceLabel>Total Revenue</BalanceLabel>
                  <BalanceValue>GH₵{seller?.totalRevenue?.toFixed(2) || '0.00'}</BalanceValue>
                </BalanceRow>

                {/* Balance Breakdown */}
                {seller?.balanceBreakdown && (
                  <>
                    <Divider style={{ margin: '1.5rem 0' }} />
                    <SectionTitle>Balance Breakdown</SectionTitle>
                    <BalanceRow>
                      <BalanceLabel>Total</BalanceLabel>
                      <BalanceValue>GH₵{seller.balanceBreakdown.total?.toFixed(2) || '0.00'}</BalanceValue>
                    </BalanceRow>
                    <BalanceRow>
                      <BalanceLabel>Available</BalanceLabel>
                      <BalanceValue>GH₵{seller.balanceBreakdown.available?.toFixed(2) || '0.00'}</BalanceValue>
                    </BalanceRow>
                    <BalanceRow>
                      <BalanceLabel>Dispute Locked</BalanceLabel>
                      <BalanceValue>GH₵{seller.balanceBreakdown.disputeLocked?.toFixed(2) || '0.00'}</BalanceValue>
                    </BalanceRow>
                    <BalanceRow>
                      <BalanceLabel>Pending Withdrawals</BalanceLabel>
                      <BalanceValue>GH₵{seller.balanceBreakdown.pendingWithdrawals?.toFixed(2) || '0.00'}</BalanceValue>
                    </BalanceRow>
                    <BalanceRow>
                      <BalanceLabel>Sum</BalanceLabel>
                      <BalanceValue>GH₵{seller.balanceBreakdown.sum?.toFixed(2) || '0.00'}</BalanceValue>
                    </BalanceRow>
                  </>
                )}

                {/* Locked Balance Details */}
                {seller?.lockedBalance > 0 && (
                  <>
                    <Divider style={{ margin: '1.5rem 0' }} />
                    <SectionTitle>Locked Balance Details</SectionTitle>
                    {seller.lockedAt && (
                      <InfoRow>
                        <InfoLabel>Locked At</InfoLabel>
                        <InfoValue>
                          {new Date(seller.lockedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </InfoValue>
                      </InfoRow>
                    )}
                    {seller.lockedBy && (
                      <InfoRow>
                        <InfoLabel>Locked By</InfoLabel>
                        <InfoValue>Admin ID: {seller.lockedBy}</InfoValue>
                      </InfoRow>
                    )}
                    {seller.lockedReason && (
                      <InfoRow>
                        <InfoLabel>Lock Reason</InfoLabel>
                        <InfoValue>{seller.lockedReason}</InfoValue>
                      </InfoRow>
                    )}
                  </>
                )}

                {/* Last Balance Reset */}
                {seller?.lastBalanceResetAt && (
                  <>
                    <Divider style={{ margin: '1.5rem 0' }} />
                    <SectionTitle>Last Balance Reset</SectionTitle>
                    <InfoRow>
                      <InfoLabel>Reset At</InfoLabel>
                      <InfoValue>
                        {new Date(seller.lastBalanceResetAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </InfoValue>
                    </InfoRow>
                    {seller.lastBalanceResetBy && (
                      <InfoRow>
                        <InfoLabel>Reset By</InfoLabel>
                        <InfoValue>Admin ID: {seller.lastBalanceResetBy}</InfoValue>
                      </InfoRow>
                    )}
                  </>
                )}

                {/* Balance Resets History */}
                {seller?.balanceResets && seller.balanceResets.length > 0 && (
                  <>
                    <Divider style={{ margin: '1.5rem 0' }} />
                    <SectionTitle>Balance Resets History ({seller.balanceResets.length})</SectionTitle>
                    {seller.balanceResets.slice(0, 5).map((reset, index) => (
                      <InfoRow key={index}>
                        <InfoLabel>
                          {new Date(reset.timestamp || reset.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </InfoLabel>
                        <InfoValue>
                          GH₵{reset.oldBalance?.toFixed(2) || '0.00'} → GH₵{reset.newBalance?.toFixed(2) || '0.00'}
                          {reset.reason && <span style={{ color: '#8d99ae', fontSize: '0.9rem', display: 'block', marginTop: '0.25rem' }}>{reset.reason}</span>}
                        </InfoValue>
                      </InfoRow>
                    ))}
                  </>
                )}

                {/* Fund Locks */}
                {seller?.fundLocks && seller.fundLocks.length > 0 && (
                  <>
                    <Divider style={{ margin: '1.5rem 0' }} />
                    <SectionTitle>Fund Locks ({seller.fundLocks.length})</SectionTitle>
                    {seller.fundLocks.slice(0, 5).map((lock, index) => (
                      <InfoRow key={index}>
                        <InfoLabel>
                          {new Date(lock.timestamp || lock.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </InfoLabel>
                        <InfoValue>
                          GH₵{lock.amount?.toFixed(2) || '0.00'}
                          {lock.reason && <span style={{ color: '#8d99ae', fontSize: '0.9rem', display: 'block', marginTop: '0.25rem' }}>{lock.reason}</span>}
                        </InfoValue>
                      </InfoRow>
                    ))}
                  </>
                )}

                {/* Fund Unlocks */}
                {seller?.fundUnlocks && seller.fundUnlocks.length > 0 && (
                  <>
                    <Divider style={{ margin: '1.5rem 0' }} />
                    <SectionTitle>Fund Unlocks ({seller.fundUnlocks.length})</SectionTitle>
                    {seller.fundUnlocks.slice(0, 5).map((unlock, index) => (
                      <InfoRow key={index}>
                        <InfoLabel>
                          {new Date(unlock.timestamp || unlock.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </InfoLabel>
                        <InfoValue>
                          GH₵{unlock.amount?.toFixed(2) || '0.00'}
                          {unlock.reason && <span style={{ color: '#8d99ae', fontSize: '0.9rem', display: 'block', marginTop: '0.25rem' }}>{unlock.reason}</span>}
                        </InfoValue>
                      </InfoRow>
                    ))}
                  </>
                )}

                {/* Locked Balance Resets */}
                {seller?.lockedBalanceResets && seller.lockedBalanceResets.length > 0 && (
                  <>
                    <Divider style={{ margin: '1.5rem 0' }} />
                    <SectionTitle>Locked Balance Resets ({seller.lockedBalanceResets.length})</SectionTitle>
                    {seller.lockedBalanceResets.slice(0, 5).map((reset, index) => (
                      <InfoRow key={index}>
                        <InfoLabel>
                          {new Date(reset.timestamp || reset.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </InfoLabel>
                        <InfoValue>
                          GH₵{reset.oldBalance?.toFixed(2) || '0.00'} → GH₵{reset.newBalance?.toFixed(2) || '0.00'}
                          {reset.reason && <span style={{ color: '#8d99ae', fontSize: '0.9rem', display: 'block', marginTop: '0.25rem' }}>{reset.reason}</span>}
                        </InfoValue>
                      </InfoRow>
                    ))}
                  </>
                )}
              </>
            )}
          </CardBody>
        </InfoCard>

        {/* Payment Methods (Payout Verification) - Where admin sees bank/MoMo added by seller */}
        <InfoCard>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
              <CardTitle>Payment Methods (Payout Verification)</CardTitle>
              <ActionButton 
                variant="info" 
                onClick={() => {
                  refetchPayoutVerification();
                  queryClient.invalidateQueries(["admin", "seller", sellerId, "payout-verification"]);
                  toast.info('Refreshing payment methods...');
                }}
                disabled={isPayoutVerificationLoading}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                <FaUndo style={{ marginRight: '0.5rem' }} /> {isPayoutVerificationLoading ? 'Loading…' : 'Refresh'}
              </ActionButton>
            </div>
          </CardHeader>
          <CardBody>
            {/* Debug: Log payment methods availability */}
            {/* Only show seller.paymentMethods if they have actual data (not just empty objects) */}
            {paymentMethods?.bankAccount && 
             (paymentMethods.bankAccount.accountName || paymentMethods.bankAccount.accountNumber || paymentMethods.bankAccount.bankName) && (
              <PaymentMethodCard>
                <PaymentMethodIcon>
                  <FaBuilding />
                </PaymentMethodIcon>
                <PaymentMethodInfo>
                  <PaymentMethodHeader>
                    <PaymentMethodTitle>Bank Account (Seller Profile)</PaymentMethodTitle>
                    <PaymentMethodStatusBadge $status={paymentMethods.bankAccount.payoutStatus || 'pending'}>
                      {paymentMethods.bankAccount.payoutStatus === 'verified' && <FaCheckCircle />}
                      {paymentMethods.bankAccount.payoutStatus === 'rejected' && <FaTimesCircle />}
                      {(paymentMethods.bankAccount.payoutStatus === 'pending' || !paymentMethods.bankAccount.payoutStatus) && <FaWallet />}
                      {paymentMethods.bankAccount.payoutStatus === 'verified' ? 'VERIFIED' : (paymentMethods.bankAccount.payoutStatus ? paymentMethods.bankAccount.payoutStatus.toUpperCase() : 'PENDING')}
                    </PaymentMethodStatusBadge>
                  </PaymentMethodHeader>
                  <PaymentMethodDetails>
                    <PaymentMethodDetail>
                      <strong>Account Name:</strong> {paymentMethods.bankAccount.accountName || 'Not provided'}
                    </PaymentMethodDetail>
                    <PaymentMethodDetail>
                      <strong>Account Number:</strong> {paymentMethods.bankAccount.accountNumber || 'Not provided'}
                    </PaymentMethodDetail>
                    <PaymentMethodDetail>
                      <strong>Bank:</strong> {paymentMethods.bankAccount.bankName || 'Not provided'}
                    </PaymentMethodDetail>
                    {paymentMethods.bankAccount.branch && (
                      <PaymentMethodDetail>
                        <strong>Branch:</strong> {paymentMethods.bankAccount.branch}
                      </PaymentMethodDetail>
                    )}
                  </PaymentMethodDetails>
                  {(paymentMethods.bankAccount.payoutStatus === 'pending' || !paymentMethods.bankAccount.payoutStatus || paymentMethods.bankAccount.payoutStatus === 'rejected') && (
                    <PaymentMethodActions>
                      <ActionButton 
                        variant="success" 
                        onClick={() => {
                          setSelectedPaymentMethod('bank');
                          setShowPayoutModal(true);
                        }}
                        style={{ marginTop: '1rem' }}
                      >
                        <FaWallet /> {paymentMethods.bankAccount.payoutStatus === 'rejected' ? 'Re-verify' : 'Verify'} Payout
                      </ActionButton>
                    </PaymentMethodActions>
                  )}
                </PaymentMethodInfo>
              </PaymentMethodCard>
            )}

            {paymentMethods?.mobileMoney && 
             (paymentMethods.mobileMoney.accountName || paymentMethods.mobileMoney.phone || paymentMethods.mobileMoney.network) && (
              <PaymentMethodCard>
                <PaymentMethodIcon>
                  <FaMobileAlt />
                </PaymentMethodIcon>
                <PaymentMethodInfo>
                  <PaymentMethodHeader>
                    <PaymentMethodTitle>
                      Mobile Money ({paymentMethods.mobileMoney.network || 'Unknown'}) - Seller Profile
                    </PaymentMethodTitle>
                    <PaymentMethodStatusBadge $status={paymentMethods.mobileMoney.payoutStatus || 'pending'}>
                      {paymentMethods.mobileMoney.payoutStatus === 'verified' && <FaCheckCircle />}
                      {paymentMethods.mobileMoney.payoutStatus === 'rejected' && <FaTimesCircle />}
                      {(paymentMethods.mobileMoney.payoutStatus === 'pending' || !paymentMethods.mobileMoney.payoutStatus) && <FaWallet />}
                      {paymentMethods.mobileMoney.payoutStatus === 'verified' ? 'VERIFIED' : (paymentMethods.mobileMoney.payoutStatus ? paymentMethods.mobileMoney.payoutStatus.toUpperCase() : 'PENDING')}
                    </PaymentMethodStatusBadge>
                  </PaymentMethodHeader>
                  <PaymentMethodDetails>
                    <PaymentMethodDetail>
                      <strong>Account Name:</strong> {paymentMethods.mobileMoney.accountName || 'Not provided'}
                    </PaymentMethodDetail>
                    <PaymentMethodDetail>
                      <strong>Phone Number:</strong> {paymentMethods.mobileMoney.phone || 'Not provided'}
                    </PaymentMethodDetail>
                    <PaymentMethodDetail>
                      <strong>Network:</strong> {paymentMethods.mobileMoney.network || 'Not provided'}
                    </PaymentMethodDetail>
                  </PaymentMethodDetails>
                  {(paymentMethods.mobileMoney.payoutStatus === 'pending' || !paymentMethods.mobileMoney.payoutStatus || paymentMethods.mobileMoney.payoutStatus === 'rejected') && (
                    <PaymentMethodActions>
                      <ActionButton 
                        variant="success" 
                        onClick={() => {
                          const network = paymentMethods.mobileMoney.network;
                          const paymentMethodType = network === 'MTN' ? 'mtn_momo' :
                                                   network === 'Vodafone' || network === 'vodafone' ? 'vodafone_cash' :
                                                   'airtel_tigo_money';
                          setSelectedPaymentMethod(paymentMethodType);
                          setShowPayoutModal(true);
                        }}
                        style={{ marginTop: '1rem' }}
                      >
                        <FaWallet /> {paymentMethods.mobileMoney.payoutStatus === 'rejected' ? 'Re-verify' : 'Verify'} Payout
                      </ActionButton>
                    </PaymentMethodActions>
                  )}
                </PaymentMethodInfo>
              </PaymentMethodCard>
            )}

            {/* Show ALL PaymentMethod Records individually */}
            {(() => {
              const hasRecords = paymentMethodRecords && Array.isArray(paymentMethodRecords) && paymentMethodRecords.length > 0;
              
              // If we have records, show them
              if (hasRecords) {
              return (
                <>
                  {((paymentMethods?.bankAccount && (paymentMethods.bankAccount.accountName || paymentMethods.bankAccount.accountNumber || paymentMethods.bankAccount.bankName)) ||
                    (paymentMethods?.mobileMoney && (paymentMethods.mobileMoney.accountName || paymentMethods.mobileMoney.phone || paymentMethods.mobileMoney.network))) && (
                    <Divider style={{ margin: '2rem 0 1rem 0' }} />
                  )}
                  <div style={{ marginBottom: '1.5rem' }}>
                    {isPayoutVerificationLoading && (
                      <InfoText style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>
                        Loading payment information…
                      </InfoText>
                    )}
                    {payoutVerificationError && (() => {
                      const { title, message, canRetry } = normalizeError(
                        payoutVerificationError,
                        {
                          fallbackTitle: "Unable to load payment details",
                          fallbackMessage: "Please try again. If the problem continues, contact support.",
                          defaultCanRetry: true,
                        }
                      );
                      return (
                        <InfoText style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.5rem' }}>
                          <strong>{title}.</strong>{' '}
                          <span>{message}</span>
                          {canRetry && (
                            <button 
                              onClick={() => refetchPayoutVerification()} 
                              style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
                            >
                              Retry
                            </button>
                          )}
                        </InfoText>
                      );
                    })()}
                    <InfoText style={{ fontSize: '0.95rem', color: '#64748b' }}>
                      <strong>Payment Method Records ({paymentMethodRecords.length}):</strong>{' '}
                      These are payment methods added by the seller through the payment method system. Each one needs individual verification.
                    </InfoText>
                  </div>
                    {paymentMethodRecords.map((pm, index) => {
                      return (
                  <PaymentMethodCard key={pm._id || index} style={{ marginBottom: '1.5rem' }}>
                    <PaymentMethodIcon>
                      {pm.type === 'bank_transfer' ? <FaBuilding /> : <FaMobileAlt />}
                    </PaymentMethodIcon>
                    <PaymentMethodInfo>
                      <PaymentMethodHeader>
                        <PaymentMethodTitle>
                          {pm.type === 'bank_transfer' ? 'Bank Account' : `Mobile Money (${pm.provider || 'Unknown'})`}
                          {pm.isDefault && (
                            <DefaultBadge style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Default</DefaultBadge>
                          )}
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal' }}>
                            (#{index + 1})
                          </span>
                        </PaymentMethodTitle>
                        <PaymentMethodStatusBadge $status={pm.verificationStatus || 'pending'}>
                          {pm.verificationStatus === 'verified' && <FaCheckCircle />}
                          {pm.verificationStatus === 'rejected' && <FaTimesCircle />}
                          {(pm.verificationStatus === 'pending' || !pm.verificationStatus) && <FaWallet />}
                          {pm.verificationStatus === 'verified' ? 'VERIFIED' : (pm.verificationStatus ? pm.verificationStatus.toUpperCase() : 'PENDING')}
                        </PaymentMethodStatusBadge>
                      </PaymentMethodHeader>
                      <PaymentMethodDetails>
                        {pm.type === 'bank_transfer' ? (
                          <>
                            <PaymentMethodDetail>
                              <strong>Account Name:</strong> {pm.accountName || pm.name || 'Not provided'}
                            </PaymentMethodDetail>
                            <PaymentMethodDetail>
                              <strong>Account Number:</strong> {pm.accountNumber || 'Not provided'}
                            </PaymentMethodDetail>
                            <PaymentMethodDetail>
                              <strong>Bank:</strong> {pm.bankName || 'Not provided'}
                            </PaymentMethodDetail>
                            {pm.branch && (
                              <PaymentMethodDetail>
                                <strong>Branch:</strong> {pm.branch}
                              </PaymentMethodDetail>
                            )}
                          </>
                        ) : (
                          <>
                            <PaymentMethodDetail>
                              <strong>Account Name:</strong> {pm.accountName || pm.name || 'Not provided'}
                            </PaymentMethodDetail>
                            <PaymentMethodDetail>
                              <strong>Phone Number:</strong> {pm.mobileNumber || 'Not provided'}
                            </PaymentMethodDetail>
                            <PaymentMethodDetail>
                              <strong>Network:</strong> {pm.provider || 'Not provided'}
                            </PaymentMethodDetail>
                          </>
                        )}
                        {/* Verified At and Verified By are now shown together in a special section when verified */}
                        {pm.verificationStatus !== 'verified' && pm.verifiedAt && (
                          <PaymentMethodDetail>
                            <strong>Verified At:</strong> {new Date(pm.verifiedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </PaymentMethodDetail>
                        )}
                        {pm.verificationStatus !== 'verified' && pm.verifiedBy && (
                          <PaymentMethodDetail>
                            <strong>Verified By:</strong> {adminNamesMap[pm.verifiedBy] || `Admin ${pm.verifiedBy}`}
                          </PaymentMethodDetail>
                        )}
                      </PaymentMethodDetails>
                      {pm.rejectionReason && pm.verificationStatus === 'rejected' && (
                        <RejectionBox style={{ marginTop: '1rem', padding: '0.75rem' }}>
                          <FaExclamationTriangle style={{ marginRight: '0.5rem' }} />
                          <div>
                            <strong>Rejection Reason:</strong>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{pm.rejectionReason}</p>
                          </div>
                        </RejectionBox>
                      )}
                      {/* Show Verified By if verified, otherwise show Verify Button */}
                      {pm.verificationStatus === 'verified' && pm.verifiedBy ? (
                        <PaymentMethodDetail style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem' }}>
                          <strong>Verified By:</strong> {adminNamesMap[pm.verifiedBy] || `Admin ${pm.verifiedBy}`}
                          {pm.verifiedAt && (
                            <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                              on {new Date(pm.verifiedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </PaymentMethodDetail>
                      ) : (pm.verificationStatus === 'pending' || !pm.verificationStatus || pm.verificationStatus === 'rejected') ? (
                        <PaymentMethodActions>
                          <ActionButton 
                            variant="success" 
                            onClick={() => {
                              // Determine payment method type for approval
                              let paymentMethodType;
                              if (pm.type === 'bank_transfer') {
                                paymentMethodType = 'bank';
                              } else if (pm.type === 'mobile_money') {
                                paymentMethodType = pm.provider === 'MTN' ? 'mtn_momo' :
                                                   pm.provider === 'Vodafone' ? 'vodafone_cash' :
                                                   'airtel_tigo_money';
                              }
                              // Store both the type and the actual record
                              setSelectedPaymentMethod(paymentMethodType);
                              setSelectedPaymentMethodRecord(pm); // Pass the actual PaymentMethod record
                              setShowPayoutModal(true);
                            }}
                            style={{ marginTop: '1rem' }}
                          >
                            <FaWallet /> {pm.verificationStatus === 'rejected' ? 'Re-verify' : 'Verify'} Payout
                          </ActionButton>
                        </PaymentMethodActions>
                      ) : null}
                    </PaymentMethodInfo>
                  </PaymentMethodCard>
                    );
                  })}
                  </>
                );
              }
              
              // If no paymentMethodRecords AND no seller profile payment methods, show empty state
              if (!paymentMethods?.bankAccount && !paymentMethods?.mobileMoney) {
                return (
                  <EmptyState>
                    <FaWallet style={{ fontSize: '3rem', color: '#8d99ae', marginBottom: '1rem' }} />
                    <EmptyStateTitle>No Payment Methods Added</EmptyStateTitle>
                    <EmptyStateText>
                      This seller has not added any payment methods yet. They need to add a bank account or mobile money in the seller app (Finance → Payment Methods) before payout verification can be completed.
                    </EmptyStateText>
                    <EmptyStateText style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#64748b' }}>
                      If the seller just added payment info, click <strong>Refresh</strong> above to load it.
                    </EmptyStateText>
                  </EmptyState>
                );
              }
              
              // If seller profile payment methods exist but no records, return null (don't show empty state)
              return null;
            })()}
          </CardBody>
        </InfoCard>
      </ContentGrid>

      {/* Action Buttons */}
      <ActionSection>
        <ActionButton $variant="warning" onClick={() => setShowResetModal(true)}>
          <FaUndo /> Reset Balance
        </ActionButton>
        {seller?.lockedBalance > 0 && (
          <ActionButton $variant="info" onClick={() => setShowResetLockedModal(true)}>
            <FaLock /> Reset Locked Balance
          </ActionButton>
        )}
      </ActionSection>

      {/* Modals */}
      {showPayoutModal && (
        <PayoutVerificationModal
          seller={{
            ...seller,
            // CRITICAL: Ensure paymentMethods are passed to modal
            // Use paymentMethods from useMemo (prefers payout verification data)
            paymentMethods: paymentMethods || seller?.paymentMethods,
          }}
          paymentMethodType={selectedPaymentMethod}
          paymentMethodRecord={selectedPaymentMethodRecord} // Pass the actual PaymentMethod record
          onClose={async () => {
            setShowPayoutModal(false);
            setSelectedPaymentMethod(null);
            setSelectedPaymentMethodRecord(null); // Clear the selected record
            
            // Wait a moment for backend transaction to commit
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Invalidate and refetch to get updated status
            await queryClient.invalidateQueries(["admin", "seller", sellerId, "payout-verification"]);
            await queryClient.invalidateQueries(["admin", "seller", sellerId]);
            // Force immediate refetch
            await queryClient.refetchQueries(["admin", "seller", sellerId, "payout-verification"]);
            await queryClient.refetchQueries(["admin", "seller", sellerId]);
            // Also manually refetch
            refetchPayoutVerification();
          }}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <ModalOverlay onClick={() => setShowRejectModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Reject Seller Verification</h3>
              <CloseButton onClick={() => setShowRejectModal(false)}>&times;</CloseButton>
            </ModalHeader>
            <ModalBody>
              <p><strong>Seller:</strong> {seller.shopName || seller.name}</p>
              <p><strong>Email:</strong> {seller.email}</p>
              <label style={{ display: 'block', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejecting seller verification..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                required
              />
            </ModalBody>
            <ModalFooter>
              <ActionButton
                variant="danger"
                onClick={handleRejectVerification}
                disabled={rejectVerification.isPending || !rejectionReason.trim()}
              >
                {rejectVerification.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}>
                Cancel
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Reset Balance Modal */}
      {showResetModal && (
        <ModalOverlay onClick={() => setShowResetModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Reset Seller Balance</h3>
              <CloseButton onClick={() => setShowResetModal(false)}>&times;</CloseButton>
            </ModalHeader>
            <ModalBody>
              <ResetInfo>
                <p><strong>Current Balance:</strong> GH₵{seller?.balance?.toFixed(2) || '0.00'}</p>
                <p><strong>Locked Balance:</strong> GH₵{seller?.lockedBalance?.toFixed(2) || '0.00'}</p>
                <p><strong>Pending Balance:</strong> GH₵{seller?.pendingBalance?.toFixed(2) || '0.00'}</p>
              </ResetInfo>
              <ResetFormGroup>
                <ResetLabel>New Balance (GH₵):</ResetLabel>
                <ResetInput
                  type="number"
                  step="0.01"
                  min="0"
                  value={resetBalance}
                  onChange={(e) => setResetBalance(e.target.value)}
                  placeholder="0.00"
                />
              </ResetFormGroup>
              <ResetFormGroup>
                <ResetLabel>Reason (Optional):</ResetLabel>
                <ResetTextarea
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Enter reason for resetting balance..."
                  rows="3"
                />
              </ResetFormGroup>
            </ModalBody>
            <ModalFooter>
              <ActionButton
                variant="warning"
                onClick={async () => {
                  try {
                    await resetBalanceMutation.mutateAsync({
                      sellerId: seller._id,
                      newBalance: parseFloat(resetBalance),
                      reason: resetReason || undefined,
                    });
                    toast.success('Balance reset successfully');
                    setShowResetModal(false);
                    setResetBalance("");
                    setResetReason("");
                    queryClient.invalidateQueries(["admin", "user", sellerId]);
                    queryClient.invalidateQueries(["seller", "balance", sellerId]);
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to reset balance');
                  }
                }}
                disabled={resetBalanceMutation.isPending || !resetBalance}
              >
                {resetBalanceMutation.isPending ? 'Resetting...' : 'Confirm Reset'}
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => {
                setShowResetModal(false);
                setResetBalance("");
                setResetReason("");
              }}>
                Cancel
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Reset Locked Balance Modal */}
      {showResetLockedModal && (
        <ModalOverlay onClick={() => setShowResetLockedModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Reset Locked Balance</h3>
              <CloseButton onClick={() => setShowResetLockedModal(false)}>&times;</CloseButton>
            </ModalHeader>
            <ModalBody>
              <ResetInfo>
                <p><strong>Current Locked Balance:</strong> GH₵{seller?.lockedBalance?.toFixed(2) || '0.00'}</p>
              </ResetInfo>
              <ResetFormGroup>
                <ResetLabel>Reason (Optional):</ResetLabel>
                <ResetTextarea
                  value={resetLockedReason}
                  onChange={(e) => setResetLockedReason(e.target.value)}
                  placeholder="Enter reason for resetting locked balance..."
                  rows="3"
                />
              </ResetFormGroup>
            </ModalBody>
            <ModalFooter>
              <ActionButton
                variant="info"
                onClick={async () => {
                  try {
                    await resetLockedBalanceMutation.mutateAsync({
                      sellerId: seller._id,
                      reason: resetLockedReason || undefined,
                    });
                    toast.success('Locked balance reset successfully');
                    setShowResetLockedModal(false);
                    setResetLockedReason("");
                    queryClient.invalidateQueries(["admin", "user", sellerId]);
                    queryClient.invalidateQueries(["seller", "balance", sellerId]);
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to reset locked balance');
                  }
                }}
                disabled={resetLockedBalanceMutation.isPending}
                style={{ background: '#17a2b8' }}
              >
                {resetLockedBalanceMutation.isPending ? 'Resetting...' : 'Confirm Reset'}
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => {
                setShowResetLockedModal(false);
                setResetLockedReason("");
              }}>
                Cancel
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default SellerDetailPage;

// Styled Components
const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background: #f8f9fa;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  color: #495057;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    border-color: #4361ee;
    color: #4361ee;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const HeaderLeft = styled.div``;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #2b2d42;
  margin: 0 0 0.5rem 0;
`;

const PageSubtitle = styled.p`
  font-size: 1rem;
  color: #8d99ae;
  margin: 0;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 1rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const InfoCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2b2d42;
  margin: 0;
`;

const CardBody = styled.div`
  padding: 1.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f1f3f5;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #495057;
  font-size: 0.9rem;
`;

const InfoValue = styled.div`
  font-weight: 600;
  color: #2b2d42;
  text-align: right;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${({ $status }) =>
    $status === 'verified' || $status === 'active'
      ? '#d1fae5'
      : $status === 'rejected' || $status === 'inactive'
      ? '#fee2e2'
      : '#fef3c7'};
  color: ${({ $status }) =>
    $status === 'verified' || $status === 'active'
      ? '#10b981'
      : $status === 'rejected' || $status === 'inactive'
      ? '#ef4444'
      : '#f59e0b'};
`;

const DocumentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DocumentIcon = styled.div`
  font-size: 1.5rem;
  color: #4361ee;
`;

const DocumentInfo = styled.div`
  flex: 1;
`;

const DocumentName = styled.div`
  font-weight: 600;
  color: #2b2d42;
  margin-bottom: 0.25rem;
`;

const DocumentStatus = styled.div`
  font-size: 0.875rem;
  color: ${({ $status }) =>
    $status === 'verified'
      ? '#10b981'
      : $status === 'rejected'
      ? '#ef4444'
      : '#f59e0b'};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const DocumentActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
`;

const DocumentLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #4361ee;
  color: white;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: #3a56d4;
  }
`;

const SmallActionGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const SmallActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: ${({ $variant }) =>
    $variant === 'success'
      ? '#10b981'
      : $variant === 'danger'
      ? '#ef4444'
      : '#e5e7eb'};
  color: ${({ $variant }) =>
    $variant === 'success' || $variant === 'danger' ? '#ffffff' : '#111827'};

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    font-size: 0.85rem;
  }
`;

const WarningBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  margin-top: 1rem;
  color: #92400e;

  strong {
    display: block;
    margin-bottom: 0.25rem;
  }
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f3f5;

  &:last-child {
    border-bottom: none;
  }
`;

const BalanceLabel = styled.div`
  font-weight: 500;
  color: #495057;
  font-size: 0.9rem;
`;

const BalanceValue = styled.div`
  font-weight: 700;
  color: #2b2d42;
  font-size: 1.1rem;
`;

const RejectionBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #fee2e2;
  border-left: 4px solid #dc3545;
  border-radius: 8px;
  margin-top: 1rem;
  color: #721c24;

  strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
  }
`;

const PaymentMethodCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 1rem;
  transition: all 0.2s;

  &:hover {
    border-color: #4361ee;
    box-shadow: 0 2px 8px rgba(67, 97, 238, 0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const PaymentMethodIcon = styled.div`
  font-size: 2rem;
  color: #4361ee;
  flex-shrink: 0;
`;

const PaymentMethodInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PaymentMethodHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const PaymentMethodTitle = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
  color: #2b2d42;
`;

const PaymentMethodStatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ $status }) => 
    $status === 'verified' ? '#10b98120' :
    $status === 'rejected' ? '#ef444420' :
    '#f59e0b20'
  };
  color: ${({ $status }) => 
    $status === 'verified' ? '#10b981' :
    $status === 'rejected' ? '#ef4444' :
    '#f59e0b'
  };
  border: 1px solid ${({ $status }) => 
    $status === 'verified' ? '#10b98140' :
    $status === 'rejected' ? '#ef444440' :
    '#f59e0b40'
  };
`;

const PaymentMethodDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
`;

const PaymentMethodDetail = styled.div`
  font-size: 0.9rem;
  color: #495057;
  line-height: 1.5;

  strong {
    color: #2b2d42;
    margin-right: 0.5rem;
    font-weight: 600;
  }
`;

const PaymentMethodActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2b2d42;
  margin: 0 0 0.5rem 0;
`;

const EmptyStateText = styled.p`
  font-size: 0.95rem;
  color: #6c757d;
  margin: 0;
  max-width: 500px;
  line-height: 1.6;
`;

const Divider = styled.div`
  margin: 1.5rem 0;
  border-top: 1px solid #e9ecef;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #2b2d42;
  margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const DefaultBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #4361ee;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
`;

const ActionSection = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $variant }) =>
    $variant === "success"
      ? "#10b981"
      : $variant === "danger"
      ? "#ef4444"
      : $variant === "warning"
      ? "#f59e0b"
      : $variant === "info"
      ? "#17a2b8"
      : "#6c757d"};
  color: white;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1.5rem;
`;

const RetryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #4f46e5;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #4338ca;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  h2 {
    color: #2b2d42;
    margin-bottom: 1rem;
  }

  p {
    color: #8d99ae;
    margin-bottom: 2rem;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 2rem;
  color: #8d99ae;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #2b2d42;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #8d99ae;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: #f5f7fb;
    color: #4361ee;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const ResetInfo = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;

  p {
    margin: 0.5rem 0;
    color: #495057;
  }
`;

const ResetFormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const ResetLabel = styled.label`
  display: block;
  font-weight: 600;
  color: #2b2d42;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const ResetInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;

  &:focus {
    border-color: #4361ee;
    outline: none;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
  }
`;

const ResetTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;

  &:focus {
    border-color: #4361ee;
    outline: none;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
  }
`;

