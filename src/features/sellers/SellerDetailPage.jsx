import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import useSellerAdmin, { usePayoutVerificationDetails, useGetSellerById } from '../../shared/hooks/useSellerAdmin';
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
  const [resetBalance, setResetBalance] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetLockedReason, setResetLockedReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: sellerResponse, isLoading, error } = useGetSellerById(sellerId);
  const { data: balanceData, isLoading: isBalanceLoading } = useGetSellerBalance(sellerId);
  const { data: payoutVerificationData } = usePayoutVerificationDetails(sellerId);
  const { approveVerification, rejectVerification, approvePayout, rejectPayout } = useSellerAdmin();
  const resetBalanceMutation = useResetSellerBalance();
  const resetLockedBalanceMutation = useResetLockedBalance();

  // Normalize all seller data sources
  const sellerCore = normalizeSellerResponse(sellerResponse);
  const sellerBalanceData = normalizeSellerResponse(balanceData);
  const sellerPayoutData = normalizeSellerResponse(payoutVerificationData);

  // Extract payment method records from payout verification data
  const paymentMethodRecords = payoutVerificationData?.data?.seller?.paymentMethodRecords || [];

  // Merge seller data predictably - single source of truth
  const seller = sellerCore
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
          payoutStatus: sellerPayoutData.payoutStatus ?? sellerCore.payoutStatus,
          payoutVerifiedAt: sellerPayoutData.payoutVerifiedAt ?? sellerCore.payoutVerifiedAt,
          payoutVerifiedBy: sellerPayoutData.payoutVerifiedBy ?? sellerCore.payoutVerifiedBy,
          payoutRejectionReason: sellerPayoutData.payoutRejectionReason ?? sellerCore.payoutRejectionReason,
          payoutVerificationHistory: sellerPayoutData.payoutVerificationHistory ?? sellerCore.payoutVerificationHistory,
        }),
      }
    : null;

  // Development-only debug logging
  if (process.env.NODE_ENV === 'development' && seller) {
    console.debug('[AdminSellerDetail] Normalized seller:', seller);
  }
  
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

  const getDocumentInfo = (document) => {
    if (!document) return { url: null, status: null };
    if (typeof document === 'string') {
      return { url: document, status: 'pending' };
    }
    return { url: document.url || null, status: document.status || 'pending' };
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
    return (
      <Container>
        <ErrorState>
          <FaExclamationTriangle style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }} />
          <h2>Error Loading Seller</h2>
          <p>{error?.response?.data?.message || error?.message || 'Unable to load seller details'}</p>
          <p style={{ fontSize: '0.9rem', color: '#8d99ae', marginTop: '0.5rem' }}>
            Error details: {JSON.stringify(error, null, 2)}
          </p>
          <BackButton onClick={() => navigate(`/dashboard/${PATHS.USERS}`)}>
            <FaArrowLeft /> Back to Users
          </BackButton>
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
          {/* Header actions can be added here if needed */}
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
              <InfoLabel>Status</InfoLabel>
              <StatusBadge $status={seller.status || 'active'}>
                {seller.status === 'active' ? <FaCheckCircle /> : <FaTimesCircle />}
                {seller.status || 'active'}
              </StatusBadge>
            </InfoRow>
          </CardBody>
        </InfoCard>

        {/* Verification Status */}
        <InfoCard>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
          </CardHeader>
          <CardBody>
            <InfoRow>
              <InfoLabel>Document Verification</InfoLabel>
              <StatusBadge $status={seller.verificationStatus || 'pending'}>
                {seller.verificationStatus === 'verified' && <FaCheckCircle />}
                {seller.verificationStatus === 'rejected' && <FaTimesCircle />}
                {(seller.verificationStatus === 'pending' || !seller.verificationStatus) && <FaExclamationTriangle />}
                {seller.verificationStatus ? seller.verificationStatus.toUpperCase() : 'PENDING'}
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
                <InfoValue>Admin ID: {seller.verifiedBy}</InfoValue>
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
              const businessCert = getDocumentInfo(seller.verificationDocuments?.businessCert);
              const idProof = getDocumentInfo(seller.verificationDocuments?.idProof);
              const addressProof = getDocumentInfo(seller.verificationDocuments?.addresProof);

              return (
                <>
                  <DocumentItem>
                    <DocumentIcon>
                      <FaFileAlt />
                    </DocumentIcon>
                    <DocumentInfo>
                      <DocumentName>Business Certificate</DocumentName>
                      <DocumentStatus $status={businessCert.status}>
                        {businessCert.status === 'verified' && <FaCheckCircle />}
                        {businessCert.status === 'rejected' && <FaTimesCircle />}
                        {businessCert.status || 'pending'}
                      </DocumentStatus>
                    </DocumentInfo>
                    {businessCert.url && (
                      <DocumentLink href={businessCert.url} target="_blank">
                        <FaEye /> View
                      </DocumentLink>
                    )}
                  </DocumentItem>

                  <DocumentItem>
                    <DocumentIcon>
                      <FaIdCard />
                    </DocumentIcon>
                    <DocumentInfo>
                      <DocumentName>ID Proof</DocumentName>
                      <DocumentStatus $status={idProof.status}>
                        {idProof.status === 'verified' && <FaCheckCircle />}
                        {idProof.status === 'rejected' && <FaTimesCircle />}
                        {idProof.status || 'pending'}
                      </DocumentStatus>
                    </DocumentInfo>
                    {idProof.url && (
                      <DocumentLink href={idProof.url} target="_blank">
                        <FaEye /> View
                      </DocumentLink>
                    )}
                  </DocumentItem>

                  <DocumentItem>
                    <DocumentIcon>
                      <FaFileAlt />
                    </DocumentIcon>
                    <DocumentInfo>
                      <DocumentName>Address Proof</DocumentName>
                      <DocumentStatus $status={addressProof.status}>
                        {addressProof.status === 'verified' && <FaCheckCircle />}
                        {addressProof.status === 'rejected' && <FaTimesCircle />}
                        {addressProof.status || 'pending'}
                      </DocumentStatus>
                    </DocumentInfo>
                    {addressProof.url && (
                      <DocumentLink href={addressProof.url} target="_blank">
                        <FaEye /> View
                      </DocumentLink>
                    )}
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

        {/* Payout Information */}
        <InfoCard>
          <CardHeader>
            <CardTitle>Payout Information</CardTitle>
          </CardHeader>
          <CardBody>
            <InfoRow>
              <InfoLabel>Payout Status</InfoLabel>
              <StatusBadge $status={seller.payoutStatus || 'pending'}>
                {seller.payoutStatus === 'verified' && <FaCheckCircle />}
                {seller.payoutStatus === 'rejected' && <FaTimesCircle />}
                {(seller.payoutStatus === 'pending' || !seller.payoutStatus) && <FaWallet />}
                {seller.payoutStatus ? seller.payoutStatus.toUpperCase() : 'PENDING'}
              </StatusBadge>
            </InfoRow>
            {seller.payoutRejectionReason && (
              <RejectionBox>
                <FaExclamationTriangle />
                <div>
                  <strong>Rejection Reason:</strong>
                  <p>{seller.payoutRejectionReason}</p>
                </div>
              </RejectionBox>
            )}
            {seller.payoutVerifiedAt && (
              <InfoRow>
                <InfoLabel>Verified At</InfoLabel>
                <InfoValue>
                  {new Date(seller.payoutVerifiedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </InfoValue>
              </InfoRow>
            )}
            {seller.payoutVerifiedBy && (
              <InfoRow>
                <InfoLabel>Verified By</InfoLabel>
                <InfoValue>Admin ID: {seller.payoutVerifiedBy}</InfoValue>
              </InfoRow>
            )}
          </CardBody>
        </InfoCard>

        {/* Payment Methods */}
        <InfoCard>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardBody>
            {seller.paymentMethods?.bankAccount || seller.paymentMethods?.mobileMoney ? (
              <>
                {seller.paymentMethods?.bankAccount && (
                  <PaymentMethodCard>
                    <PaymentMethodIcon>
                      <FaBuilding />
                    </PaymentMethodIcon>
                    <PaymentMethodInfo>
                      <PaymentMethodHeader>
                        <PaymentMethodTitle>Bank Account</PaymentMethodTitle>
                        <PaymentMethodStatusBadge $status={seller.paymentMethods.bankAccount.payoutStatus || 'pending'}>
                          {seller.paymentMethods.bankAccount.payoutStatus === 'verified' && <FaCheckCircle />}
                          {seller.paymentMethods.bankAccount.payoutStatus === 'rejected' && <FaTimesCircle />}
                          {(seller.paymentMethods.bankAccount.payoutStatus === 'pending' || !seller.paymentMethods.bankAccount.payoutStatus) && <FaWallet />}
                          {seller.paymentMethods.bankAccount.payoutStatus ? seller.paymentMethods.bankAccount.payoutStatus.toUpperCase() : 'PENDING'}
                        </PaymentMethodStatusBadge>
                      </PaymentMethodHeader>
                      <PaymentMethodDetails>
                        <PaymentMethodDetail>
                          <strong>Account Name:</strong> {seller.paymentMethods.bankAccount.accountName || 'N/A'}
                        </PaymentMethodDetail>
                        <PaymentMethodDetail>
                          <strong>Account Number:</strong> {seller.paymentMethods.bankAccount.accountNumber || 'N/A'}
                        </PaymentMethodDetail>
                        <PaymentMethodDetail>
                          <strong>Bank:</strong> {seller.paymentMethods.bankAccount.bankName || 'N/A'}
                        </PaymentMethodDetail>
                        {seller.paymentMethods.bankAccount.branch && (
                          <PaymentMethodDetail>
                            <strong>Branch:</strong> {seller.paymentMethods.bankAccount.branch}
                          </PaymentMethodDetail>
                        )}
                        {seller.paymentMethods.bankAccount.bankCode && (
                          <PaymentMethodDetail>
                            <strong>Bank Code:</strong> {seller.paymentMethods.bankAccount.bankCode}
                          </PaymentMethodDetail>
                        )}
                      </PaymentMethodDetails>
                      {seller.paymentMethods.bankAccount.payoutRejectionReason && seller.paymentMethods.bankAccount.payoutStatus === 'rejected' && (
                        <RejectionBox style={{ marginTop: '1rem', padding: '0.75rem' }}>
                          <FaExclamationTriangle style={{ marginRight: '0.5rem' }} />
                          <div>
                            <strong>Rejection Reason:</strong>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{seller.paymentMethods.bankAccount.payoutRejectionReason}</p>
                          </div>
                        </RejectionBox>
                      )}
                      {/* Verify Button for Bank Account */}
                      {(seller.paymentMethods.bankAccount.payoutStatus === 'pending' || !seller.paymentMethods.bankAccount.payoutStatus || seller.paymentMethods.bankAccount.payoutStatus === 'rejected') && (
                        <PaymentMethodActions>
                          <ActionButton 
                            variant="success" 
                            onClick={() => {
                              setSelectedPaymentMethod('bank');
                              setShowPayoutModal(true);
                            }}
                            style={{ marginTop: '1rem' }}
                          >
                            <FaWallet /> {seller.paymentMethods.bankAccount.payoutStatus === 'rejected' ? 'Re-verify' : 'Verify'} Payout
                          </ActionButton>
                        </PaymentMethodActions>
                      )}
                    </PaymentMethodInfo>
                  </PaymentMethodCard>
                )}
                {seller.paymentMethods?.mobileMoney && (
                  <PaymentMethodCard>
                    <PaymentMethodIcon>
                      <FaMobileAlt />
                    </PaymentMethodIcon>
                    <PaymentMethodInfo>
                      <PaymentMethodHeader>
                        <PaymentMethodTitle>
                          Mobile Money ({seller.paymentMethods.mobileMoney.network || 'Unknown'})
                        </PaymentMethodTitle>
                        <PaymentMethodStatusBadge $status={seller.paymentMethods.mobileMoney.payoutStatus || 'pending'}>
                          {seller.paymentMethods.mobileMoney.payoutStatus === 'verified' && <FaCheckCircle />}
                          {seller.paymentMethods.mobileMoney.payoutStatus === 'rejected' && <FaTimesCircle />}
                          {(seller.paymentMethods.mobileMoney.payoutStatus === 'pending' || !seller.paymentMethods.mobileMoney.payoutStatus) && <FaWallet />}
                          {seller.paymentMethods.mobileMoney.payoutStatus ? seller.paymentMethods.mobileMoney.payoutStatus.toUpperCase() : 'PENDING'}
                        </PaymentMethodStatusBadge>
                      </PaymentMethodHeader>
                      <PaymentMethodDetails>
                        <PaymentMethodDetail>
                          <strong>Account Name:</strong> {seller.paymentMethods.mobileMoney.accountName || 'N/A'}
                        </PaymentMethodDetail>
                        <PaymentMethodDetail>
                          <strong>Phone Number:</strong> {seller.paymentMethods.mobileMoney.phone || 'N/A'}
                        </PaymentMethodDetail>
                        <PaymentMethodDetail>
                          <strong>Network:</strong> {seller.paymentMethods.mobileMoney.network || 'N/A'}
                        </PaymentMethodDetail>
                      </PaymentMethodDetails>
                      {seller.paymentMethods.mobileMoney.payoutRejectionReason && seller.paymentMethods.mobileMoney.payoutStatus === 'rejected' && (
                        <RejectionBox style={{ marginTop: '1rem', padding: '0.75rem' }}>
                          <FaExclamationTriangle style={{ marginRight: '0.5rem' }} />
                          <div>
                            <strong>Rejection Reason:</strong>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{seller.paymentMethods.mobileMoney.payoutRejectionReason}</p>
                          </div>
                        </RejectionBox>
                      )}
                      {/* Verify Button for Mobile Money */}
                      {(seller.paymentMethods.mobileMoney.payoutStatus === 'pending' || !seller.paymentMethods.mobileMoney.payoutStatus || seller.paymentMethods.mobileMoney.payoutStatus === 'rejected') && (
                        <PaymentMethodActions>
                          <ActionButton 
                            variant="success" 
                            onClick={() => {
                              // Determine mobile money type based on network
                              const network = seller.paymentMethods.mobileMoney.network;
                              const paymentMethodType = network === 'MTN' ? 'mtn_momo' :
                                                       network === 'Vodafone' || network === 'vodafone' ? 'vodafone_cash' :
                                                       'airtel_tigo_money';
                              setSelectedPaymentMethod(paymentMethodType);
                              setShowPayoutModal(true);
                            }}
                            style={{ marginTop: '1rem' }}
                          >
                            <FaWallet /> {seller.paymentMethods.mobileMoney.payoutStatus === 'rejected' ? 'Re-verify' : 'Verify'} Payout
                          </ActionButton>
                        </PaymentMethodActions>
                      )}
                    </PaymentMethodInfo>
                  </PaymentMethodCard>
                )}
              </>
            ) : (
              <EmptyState>
                <FaWallet style={{ fontSize: '3rem', color: '#8d99ae', marginBottom: '1rem' }} />
                <EmptyStateTitle>No Payment Methods Added</EmptyStateTitle>
                <EmptyStateText>
                  This seller has not added any payment methods yet. They need to add a bank account or mobile money details before payout verification can be completed.
                </EmptyStateText>
              </EmptyState>
            )}
            
            {/* PaymentMethod Records (Separate Model) */}
            {paymentMethodRecords && paymentMethodRecords.length > 0 && (
              <>
                <Divider />
                <SectionTitle>Payment Method Records</SectionTitle>
                <InfoText>
                  These are separate PaymentMethod records linked to the seller's User account. They also need verification before payouts can be processed.
                </InfoText>
                {paymentMethodRecords.map((pm, index) => (
                  <PaymentMethodCard key={pm._id || index}>
                    <PaymentMethodIcon>
                      {pm.type === 'bank_transfer' ? <FaBuilding /> : <FaMobileAlt />}
                    </PaymentMethodIcon>
                    <PaymentMethodInfo>
                      <PaymentMethodHeader>
                        <PaymentMethodTitle>
                          {pm.type === 'bank_transfer' ? 'Bank Account' : `Mobile Money (${pm.provider || 'Unknown'})`}
                          {pm.isDefault && (
                            <DefaultBadge>Default</DefaultBadge>
                          )}
                        </PaymentMethodTitle>
                        <PaymentMethodStatusBadge $status={pm.verificationStatus || 'pending'}>
                          {pm.verificationStatus === 'verified' && <FaCheckCircle />}
                          {pm.verificationStatus === 'rejected' && <FaTimesCircle />}
                          {(pm.verificationStatus === 'pending' || !pm.verificationStatus) && <FaWallet />}
                          {pm.verificationStatus ? pm.verificationStatus.toUpperCase() : 'PENDING'}
                        </PaymentMethodStatusBadge>
                      </PaymentMethodHeader>
                      <PaymentMethodDetails>
                        {pm.type === 'bank_transfer' ? (
                          <>
                            {pm.accountName && (
                              <PaymentMethodDetail>
                                <strong>Account Name:</strong> {pm.accountName}
                              </PaymentMethodDetail>
                            )}
                            {pm.accountNumber && (
                              <PaymentMethodDetail>
                                <strong>Account Number:</strong> {pm.accountNumber}
                              </PaymentMethodDetail>
                            )}
                            {pm.bankName && (
                              <PaymentMethodDetail>
                                <strong>Bank:</strong> {pm.bankName}
                              </PaymentMethodDetail>
                            )}
                            {pm.branch && (
                              <PaymentMethodDetail>
                                <strong>Branch:</strong> {pm.branch}
                              </PaymentMethodDetail>
                            )}
                          </>
                        ) : (
                          <>
                            {pm.name && (
                              <PaymentMethodDetail>
                                <strong>Name:</strong> {pm.name}
                              </PaymentMethodDetail>
                            )}
                            {pm.mobileNumber && (
                              <PaymentMethodDetail>
                                <strong>Phone Number:</strong> {pm.mobileNumber}
                              </PaymentMethodDetail>
                            )}
                            {pm.provider && (
                              <PaymentMethodDetail>
                                <strong>Network:</strong> {pm.provider}
                              </PaymentMethodDetail>
                            )}
                          </>
                        )}
                        {pm.verifiedAt && (
                          <PaymentMethodDetail>
                            <strong>Verified At:</strong> {new Date(pm.verifiedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </PaymentMethodDetail>
                        )}
                        {pm.verifiedBy && (
                          <PaymentMethodDetail>
                            <strong>Verified By:</strong> Admin ID: {pm.verifiedBy}
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
                    </PaymentMethodInfo>
                  </PaymentMethodCard>
                ))}
              </>
            )}
          </CardBody>
        </InfoCard>
      </ContentGrid>

      {/* Action Buttons */}
      <ActionSection>
        {(seller.verificationStatus === 'pending' || !seller.verificationStatus || seller.verificationStatus === 'rejected') &&
         (seller.onboardingStage !== 'verified') && (
          <>
            <ActionButton
              variant="success"
              onClick={handleApproveVerification}
              disabled={approveVerification.isPending || !hasAllRequiredDocuments() || !seller.verification?.emailVerified}
              title={!hasAllRequiredDocuments() ? `Missing documents: ${getMissingDocuments().join(', ')}` : !seller.verification?.emailVerified ? 'Email must be verified' : ''}
            >
              <FaCheckCircle /> Approve Verification
            </ActionButton>
            <ActionButton variant="danger" onClick={() => setShowRejectModal(true)}>
              <FaTimesCircle /> Reject Verification
            </ActionButton>
          </>
        )}
        <ActionButton variant="warning" onClick={() => setShowResetModal(true)}>
          <FaUndo /> Reset Balance
        </ActionButton>
        {seller?.lockedBalance > 0 && (
          <ActionButton variant="info" onClick={() => setShowResetLockedModal(true)}>
            <FaLock /> Reset Locked Balance
          </ActionButton>
        )}
      </ActionSection>

      {/* Modals */}
      {showPayoutModal && (
        <PayoutVerificationModal
          seller={seller}
          paymentMethodType={selectedPaymentMethod}
          onClose={() => {
            setShowPayoutModal(false);
            setSelectedPaymentMethod(null);
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
              <ActionButton variant="secondary" onClick={() => {
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
              <ActionButton variant="secondary" onClick={() => {
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
              <ActionButton variant="secondary" onClick={() => {
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
  background: ${({ variant }) =>
    variant === "success"
      ? "#10b981"
      : variant === "danger"
      ? "#ef4444"
      : variant === "warning"
      ? "#f59e0b"
      : variant === "info"
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

