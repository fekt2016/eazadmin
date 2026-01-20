import { useState } from "react";
import styled from "styled-components";
import useSellerAdmin from '../../hooks/useSellerAdmin';
import { FaCheckCircle, FaTimesCircle, FaBuilding, FaMobileAlt, FaWallet, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-toastify";

const PayoutVerificationModal = ({ seller, paymentMethodType: propPaymentMethodType, onClose }) => {
  const { approvePayout, rejectPayout } = useSellerAdmin();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!seller) {
    return null;
  }

  // Determine payment method type - use prop if provided, otherwise auto-detect
  const getPaymentMethodType = () => {
    // If payment method type is provided as prop, use it
    if (propPaymentMethodType) {
      return propPaymentMethodType;
    }
    
    // Otherwise, auto-detect from seller's payment methods
    if (seller.paymentMethods?.bankAccount) {
      return 'bank';
    } else if (seller.paymentMethods?.mobileMoney) {
      const network = seller.paymentMethods.mobileMoney.network;
      if (network === 'MTN') return 'mtn_momo';
      if (network === 'Vodafone' || network === 'vodafone') return 'vodafone_cash';
      return 'airtel_tigo_money';
    }
    return null;
  };

  const paymentMethodType = getPaymentMethodType();
  
  // Get payment details based on the selected payment method type
  const getPaymentDetails = () => {
    if (paymentMethodType === 'bank') {
      return seller.paymentMethods?.bankAccount;
    } else if (['mtn_momo', 'vodafone_cash', 'airtel_tigo_money'].includes(paymentMethodType)) {
      return seller.paymentMethods?.mobileMoney;
    }
    return null;
  };

  const paymentDetails = getPaymentDetails();

  // Get payment method display name
  const getPaymentMethodDisplayName = () => {
    if (paymentMethodType === 'bank') {
      return 'Bank Account';
    } else if (paymentMethodType === 'mtn_momo') {
      return 'MTN Mobile Money';
    } else if (paymentMethodType === 'vodafone_cash') {
      return 'Vodafone Cash';
    } else if (paymentMethodType === 'airtel_tigo_money') {
      return 'AirtelTigo Money';
    }
    return 'Payment Method';
  };

  const paymentMethodDisplayName = getPaymentMethodDisplayName();

  const handleApprove = async () => {
    if (!paymentMethodType) {
      toast.error('No payment method found');
      return;
    }

    try {
      await approvePayout.mutateAsync({
        sellerId: seller._id,
        paymentMethod: paymentMethodType,
      });
      toast.success('Payout verification approved successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve payout verification');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await rejectPayout.mutateAsync({
        sellerId: seller._id,
        reason: rejectionReason.trim(),
      });
      toast.success('Payout verification rejected');
      setShowRejectModal(false);
      setRejectionReason("");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject payout verification');
    }
  };

  return (
    <>
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <HeaderTitle>
              {paymentMethodType === 'bank' ? (
                <FaBuilding style={{ marginRight: '0.5rem', color: '#007bff' }} />
              ) : (
                <FaMobileAlt style={{ marginRight: '0.5rem', color: '#28a745' }} />
              )}
              Verify {paymentMethodDisplayName}
            </HeaderTitle>
            <CloseButton onClick={onClose}>&times;</CloseButton>
          </ModalHeader>

          <ModalBody>
            {/* Seller Info */}
            <InfoSection>
              <InfoLabel>Seller Information</InfoLabel>
              <InfoValue>
                <strong>{seller.shopName || seller.name}</strong>
                <span style={{ color: '#8d99ae', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                  {seller.email}
                </span>
              </InfoValue>
            </InfoSection>

            {/* Current Status - Show per-payment-method payout status */}
            {(() => {
              let currentStatus = 'pending';
              let rejectionReason = null;
              let verifiedAt = null;
              
              if (paymentMethodType === 'bank' && seller.paymentMethods?.bankAccount) {
                currentStatus = seller.paymentMethods.bankAccount.payoutStatus || 'pending';
                rejectionReason = seller.paymentMethods.bankAccount.payoutRejectionReason;
                verifiedAt = seller.paymentMethods.bankAccount.payoutVerifiedAt;
              } else if (['mtn_momo', 'vodafone_cash', 'airtel_tigo_money'].includes(paymentMethodType) && seller.paymentMethods?.mobileMoney) {
                currentStatus = seller.paymentMethods.mobileMoney.payoutStatus || 'pending';
                rejectionReason = seller.paymentMethods.mobileMoney.payoutRejectionReason;
                verifiedAt = seller.paymentMethods.mobileMoney.payoutVerifiedAt;
              }

              if (currentStatus === 'verified' || currentStatus === 'rejected') {
                return (
                  <InfoSection>
                    <InfoLabel>Verification Status</InfoLabel>
                    <StatusBadge $status={currentStatus}>
                      {currentStatus === 'verified' && <FaCheckCircle style={{ marginRight: '0.5rem' }} />}
                      {currentStatus === 'rejected' && <FaTimesCircle style={{ marginRight: '0.5rem' }} />}
                      {currentStatus.toUpperCase()}
                    </StatusBadge>
                    {rejectionReason && currentStatus === 'rejected' && (
                      <RejectionBox>
                        <FaExclamationTriangle style={{ marginRight: '0.5rem', color: '#dc3545' }} />
                        <div>
                          <strong>Previous Rejection Reason:</strong>
                          <p>{rejectionReason}</p>
                        </div>
                      </RejectionBox>
                    )}
                    {verifiedAt && currentStatus === 'verified' && (
                      <VerifiedDate>
                        Verified on: {new Date(verifiedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </VerifiedDate>
                    )}
                  </InfoSection>
                );
              }
              return null;
            })()}

            {/* Payment Method Details - Dynamic based on selected payment method */}
            {paymentDetails ? (
              <InfoSection>
                <InfoLabel>
                  {paymentMethodType === 'bank' ? 'Bank Account' : 'Mobile Money'} Details
                </InfoLabel>
                {paymentMethodType === 'bank' && seller.paymentMethods?.bankAccount ? (
                  <PaymentMethodCard>
                    <FaBuilding style={{ fontSize: '2rem', color: '#007bff', marginRight: '1rem', flexShrink: 0 }} />
                    <PaymentMethodInfo>
                      <PaymentMethodTitle>Bank Account Verification</PaymentMethodTitle>
                      <PaymentMethodDetail>
                        <strong>Account Name:</strong> {seller.paymentMethods.bankAccount.accountName || 'N/A'}
                      </PaymentMethodDetail>
                      <PaymentMethodDetail>
                        <strong>Account Number:</strong> {seller.paymentMethods.bankAccount.accountNumber || 'N/A'}
                      </PaymentMethodDetail>
                      <PaymentMethodDetail>
                        <strong>Bank Name:</strong> {seller.paymentMethods.bankAccount.bankName || 'N/A'}
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
                      {/* Name Match Check */}
                      <NameMatchCheck>
                        <FaCheckCircle style={{ color: '#10b981', marginRight: '0.5rem' }} />
                        <span>
                          <strong>Seller Name:</strong> {seller.name || seller.shopName || 'N/A'}
                        </span>
                        {seller.paymentMethods.bankAccount.accountName && (
                          <span style={{ marginLeft: '1rem' }}>
                            <strong>Account Name:</strong> {seller.paymentMethods.bankAccount.accountName}
                          </span>
                        )}
                      </NameMatchCheck>
                    </PaymentMethodInfo>
                  </PaymentMethodCard>
                ) : ['mtn_momo', 'vodafone_cash', 'airtel_tigo_money'].includes(paymentMethodType) && seller.paymentMethods?.mobileMoney ? (
                  <PaymentMethodCard>
                    <FaMobileAlt style={{ fontSize: '2rem', color: '#28a745', marginRight: '1rem', flexShrink: 0 }} />
                    <PaymentMethodInfo>
                      <PaymentMethodTitle>
                        Mobile Money Verification ({seller.paymentMethods.mobileMoney.network || 'Unknown'})
                      </PaymentMethodTitle>
                      <PaymentMethodDetail>
                        <strong>Account Name:</strong> {seller.paymentMethods.mobileMoney.accountName || 'N/A'}
                      </PaymentMethodDetail>
                      <PaymentMethodDetail>
                        <strong>Phone Number:</strong> {seller.paymentMethods.mobileMoney.phone || 'N/A'}
                      </PaymentMethodDetail>
                      <PaymentMethodDetail>
                        <strong>Network:</strong> {seller.paymentMethods.mobileMoney.network || 'N/A'}
                      </PaymentMethodDetail>
                      {/* Name Match Check */}
                      <NameMatchCheck>
                        <FaCheckCircle style={{ color: '#10b981', marginRight: '0.5rem' }} />
                        <span>
                          <strong>Seller Name:</strong> {seller.name || seller.shopName || 'N/A'}
                        </span>
                        {seller.paymentMethods.mobileMoney.accountName && (
                          <span style={{ marginLeft: '1rem' }}>
                            <strong>Account Name:</strong> {seller.paymentMethods.mobileMoney.accountName}
                          </span>
                        )}
                      </NameMatchCheck>
                    </PaymentMethodInfo>
                  </PaymentMethodCard>
                ) : null}
              </InfoSection>
            ) : (
              <InfoSection>
                <WarningBox>
                  <FaExclamationTriangle style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
                  <div>
                    <strong>No Payment Method Found</strong>
                    <p>The selected payment method ({paymentMethodDisplayName}) is not available for this seller.</p>
                  </div>
                </WarningBox>
              </InfoSection>
            )}

            {/* Security Checks Info */}
            {paymentDetails && (seller.payoutStatus === 'pending' || !seller.payoutStatus || seller.payoutStatus === 'rejected') && (
              <InfoSection>
                <SecurityInfoBox>
                  <InfoLabel style={{ marginBottom: '0.5rem' }}>Security Checks</InfoLabel>
                  <SecurityCheckItem>
                    <FaCheckCircle style={{ color: '#10b981', marginRight: '0.5rem' }} />
                    Name matching validation
                  </SecurityCheckItem>
                  <SecurityCheckItem>
                    <FaCheckCircle style={{ color: '#10b981', marginRight: '0.5rem' }} />
                    Account reuse prevention
                  </SecurityCheckItem>
                  <SecurityCheckItem>
                    <FaCheckCircle style={{ color: '#10b981', marginRight: '0.5rem' }} />
                    All actions are logged and auditable
                  </SecurityCheckItem>
                </SecurityInfoBox>
              </InfoSection>
            )}
          </ModalBody>

          <ModalFooter>
            {paymentDetails && (() => {
              // Get current payout status for this specific payment method
              let currentStatus = 'pending';
              if (paymentMethodType === 'bank' && seller.paymentMethods?.bankAccount) {
                currentStatus = seller.paymentMethods.bankAccount.payoutStatus || 'pending';
              } else if (['mtn_momo', 'vodafone_cash', 'airtel_tigo_money'].includes(paymentMethodType) && seller.paymentMethods?.mobileMoney) {
                currentStatus = seller.paymentMethods.mobileMoney.payoutStatus || 'pending';
              }

              if (currentStatus === 'pending' || currentStatus === 'rejected') {
                return (
                  <>
                    <ActionButton
                      variant="success"
                      onClick={handleApprove}
                      disabled={approvePayout.isPending}
                    >
                      <FaCheckCircle style={{ marginRight: '0.5rem' }} />
                      {approvePayout.isPending ? 'Approving...' : 'Approve Payout'}
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={() => setShowRejectModal(true)}
                      disabled={rejectPayout.isPending}
                    >
                      <FaTimesCircle style={{ marginRight: '0.5rem' }} />
                      Reject Payout
                    </ActionButton>
                  </>
                );
              } else if (currentStatus === 'verified') {
                return (
                  <InfoMessage>
                    <FaCheckCircle style={{ marginRight: '0.5rem', color: '#10b981' }} />
                    This payment method is already verified
                  </InfoMessage>
                );
              }
              return null;
            })()}
            <ActionButton variant="secondary" onClick={onClose}>
              Close
            </ActionButton>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>

      {/* Reject Modal */}
      {showRejectModal && (
        <ModalOverlay onClick={() => setShowRejectModal(false)} style={{ zIndex: 2000 }}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <ModalHeader>
              <HeaderTitle>
                {paymentMethodType === 'bank' ? (
                  <FaBuilding style={{ marginRight: '0.5rem', color: '#007bff' }} />
                ) : (
                  <FaMobileAlt style={{ marginRight: '0.5rem', color: '#28a745' }} />
                )}
                Reject {paymentMethodDisplayName} Verification
              </HeaderTitle>
              <CloseButton onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}>&times;</CloseButton>
            </ModalHeader>
            <ModalBody>
              <InfoSection>
                <InfoLabel>Seller</InfoLabel>
                <InfoValue>{seller.shopName || seller.name}</InfoValue>
              </InfoSection>
              <InfoSection>
                <InfoLabel>Payment Method</InfoLabel>
                <InfoValue>
                  {paymentMethodType === 'bank' ? (
                    <span>
                      <FaBuilding style={{ marginRight: '0.5rem', color: '#007bff' }} />
                      Bank Account: {seller.paymentMethods?.bankAccount?.accountNumber || 'N/A'}
                    </span>
                  ) : (
                    <span>
                      <FaMobileAlt style={{ marginRight: '0.5rem', color: '#28a745' }} />
                      {paymentMethodDisplayName}: {seller.paymentMethods?.mobileMoney?.phone || 'N/A'}
                    </span>
                  )}
                </InfoValue>
              </InfoSection>
              <InfoSection>
                <InfoLabel>Rejection Reason *</InfoLabel>
                <RejectionTextarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={`Enter reason for rejecting ${paymentMethodDisplayName.toLowerCase()} verification...`}
                  rows="5"
                />
              </InfoSection>
            </ModalBody>
            <ModalFooter>
              <ActionButton
                variant="danger"
                onClick={handleReject}
                disabled={rejectPayout.isPending || !rejectionReason.trim()}
              >
                {rejectPayout.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
              >
                Cancel
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default PayoutVerificationModal;

// Styled Components
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
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 1px solid #e9ecef;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  color: #2b2d42;
  display: flex;
  align-items: center;
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
  padding: 25px;
`;

const InfoSection = styled.div`
  margin-bottom: 25px;
`;

const InfoLabel = styled.div`
  font-weight: 600;
  color: #2b2d42;
  margin-bottom: 10px;
  font-size: 14px;
`;

const InfoValue = styled.div`
  color: #4a5568;
  font-size: 15px;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  background: ${({ $status }) =>
    $status === 'verified'
      ? '#d1fae5'
      : $status === 'rejected'
      ? '#fee2e2'
      : '#fef3c7'};
  color: ${({ $status }) =>
    $status === 'verified'
      ? '#10b981'
      : $status === 'rejected'
      ? '#ef4444'
      : '#f59e0b'};
`;

const RejectionBox = styled.div`
  display: flex;
  align-items: flex-start;
  background: #fee2e2;
  border-left: 4px solid #dc3545;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
  color: #721c24;

  strong {
    display: block;
    margin-bottom: 5px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

const VerifiedDate = styled.div`
  color: #666;
  font-size: 13px;
  margin-top: 10px;
  font-style: italic;
`;

const PaymentMethodCard = styled.div`
  display: flex;
  align-items: flex-start;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  margin-top: 10px;
`;

const PaymentMethodInfo = styled.div`
  flex: 1;
`;

const PaymentMethodTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: #2b2d42;
  margin-bottom: 12px;
`;

const PaymentMethodDetail = styled.div`
  margin-bottom: 8px;
  font-size: 14px;
  color: #4a5568;

  strong {
    color: #2b2d42;
    margin-right: 8px;
  }
`;

const WarningBox = styled.div`
  display: flex;
  align-items: flex-start;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 15px;
  border-radius: 8px;
  color: #92400e;

  strong {
    display: block;
    margin-bottom: 5px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

const SecurityInfoBox = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 20px;
  margin-top: 10px;
`;

const SecurityCheckItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #4a5568;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ModalFooter = styled.div`
  padding: 20px 25px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  background: ${({ variant }) =>
    variant === "success"
      ? "#10b981"
      : variant === "danger"
      ? "#ef4444"
      : variant === "secondary"
      ? "#6c757d"
      : "#4361ee"};
  color: white;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};

  &:hover:not(:disabled) {
    background: ${({ variant }) =>
      variant === "success"
        ? "#059669"
        : variant === "danger"
        ? "#dc2626"
        : variant === "secondary"
        ? "#5a6268"
        : "#3a56d4"};
    transform: translateY(-1px);
  }
`;

const InfoMessage = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  margin-right: auto;
`;

const RejectionTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;

  &:focus {
    border-color: #4361ee;
    outline: none;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
  }
`;

const NameMatchCheck = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #166534;

  strong {
    color: #15803d;
    margin-right: 0.5rem;
  }
`;

