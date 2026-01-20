import { useState } from "react";
import styled from "styled-components";
import useSellerAdmin from '../../hooks/useSellerAdmin';
import { useGetSellerBalance, useResetSellerBalance, useResetLockedBalance } from '../../hooks/useSellerBalance';
import { FaWallet, FaUndo, FaLock, FaCheckCircle, FaTimesCircle, FaBuilding, FaMobileAlt } from "react-icons/fa";
import { toast } from "react-toastify";

const SellerDetailsModal = ({ seller, onClose }) => {
  // Always call hooks at the top level - never conditionally
  const { updateStatus, approveVerification, rejectVerification, approvePayout, rejectPayout } = useSellerAdmin();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showResetLockedModal, setShowResetLockedModal] = useState(false);
  const [showRejectPayoutModal, setShowRejectPayoutModal] = useState(false);
  const [resetBalance, setResetBalance] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetLockedReason, setResetLockedReason] = useState("");
  const [payoutRejectionReason, setPayoutRejectionReason] = useState("");
  
  // Use seller?._id to safely get the ID, hook will handle undefined
  const { data: balanceData, isLoading: isBalanceLoading } = useGetSellerBalance(seller?._id);
  const resetBalanceMutation = useResetSellerBalance();
  const resetLockedBalanceMutation = useResetLockedBalance();
  
  // Early return after all hooks are called
  if (!seller) {
    return null;
  }
  
  const sellerBalance = balanceData?.data?.seller || balanceData?.data || seller;
  
  // Debug: Log balance data
  console.log('[SellerDetailsModal] Balance data:', balanceData);
  console.log('[SellerDetailsModal] Seller balance:', sellerBalance);
  console.log('[SellerDetailsModal] Locked balance:', sellerBalance?.lockedBalance || seller?.lockedBalance);

  // Check if seller has all required documents
  const hasAllRequiredDocuments = () => {
    const docs = seller.verificationDocuments || {};
    
    // Check business certificate
    const hasBusinessCert = docs.businessCert && 
      (typeof docs.businessCert === 'string' || (docs.businessCert && docs.businessCert.url));
    
    // Check ID proof
    const hasIdProof = docs.idProof && 
      (typeof docs.idProof === 'string' || (docs.idProof && docs.idProof.url));
    
    // Check address proof
    const hasAddressProof = docs.addresProof && 
      (typeof docs.addresProof === 'string' || (docs.addresProof && docs.addresProof.url));
    
    return hasBusinessCert && hasIdProof && hasAddressProof;
  };

  // Get missing documents list
  const getMissingDocuments = () => {
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

  // Handle seller verification approval (document verification)
  // This is called when admin approves seller after they've uploaded all required documents
  const handleApproveVerification = async () => {
    // Frontend validation: Check if all documents are uploaded
    if (!hasAllRequiredDocuments()) {
      const missingDocs = getMissingDocuments();
      toast.error(`Cannot approve seller verification. Missing required documents: ${missingDocs.join(', ')}`);
      return;
    }

    // Check if email is verified
    if (!seller.verification?.emailVerified) {
      toast.error('Cannot approve seller verification. Email must be verified first.');
      return;
    }

    try {
      await approveVerification.mutateAsync(seller._id);
      toast.success('Seller verification approved successfully');
      onClose();
    } catch (error) {
      console.error("Error approving verification:", error);
      toast.error(error.response?.data?.message || 'Failed to approve seller verification');
    }
  };

  // Handle seller verification rejection
  const handleRejectVerification = () => {
    // For now, show a message - you can add a reject modal similar to payout rejection
    toast.info('Please use the reject option from the action menu to provide a rejection reason');
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h3>{seller.shopName} Details</h3>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <DetailsSection>
          <DetailItem>
            <Label>Registration Date:</Label>
            <Value>{new Date(seller.createdAt).toLocaleDateString()}</Value>
          </DetailItem>

          <DetailItem>
            <Label>Verification Documents:</Label>
            <Documents>
              {seller.verificationDocuments?.businessCert ? (
                <DocumentLink
                  href={typeof seller.verificationDocuments.businessCert === 'string' 
                    ? seller.verificationDocuments.businessCert 
                    : seller.verificationDocuments.businessCert.url}
                  target="_blank"
                >
                  Business Certificate ✓
                </DocumentLink>
              ) : (
                <DocumentMissing>Business Certificate ✗ (Missing)</DocumentMissing>
              )}
              {seller.verificationDocuments?.idProof ? (
                <DocumentLink
                  href={typeof seller.verificationDocuments.idProof === 'string' 
                    ? seller.verificationDocuments.idProof 
                    : seller.verificationDocuments.idProof.url}
                  target="_blank"
                >
                  ID Proof ✓
                </DocumentLink>
              ) : (
                <DocumentMissing>ID Proof ✗ (Missing)</DocumentMissing>
              )}
              {seller.verificationDocuments?.addresProof ? (
                <DocumentLink
                  href={typeof seller.verificationDocuments.addresProof === 'string' 
                    ? seller.verificationDocuments.addresProof 
                    : seller.verificationDocuments.addresProof.url}
                  target="_blank"
                >
                  Address Proof ✓
                </DocumentLink>
              ) : (
                <DocumentMissing>Address Proof ✗ (Missing)</DocumentMissing>
              )}
            </Documents>
            {!hasAllRequiredDocuments() && (
              <DocumentWarning>
                ⚠️ All documents must be uploaded before approval
              </DocumentWarning>
            )}
          </DetailItem>

          <DetailItem>
            <Label>Contact Information:</Label>
            <Value>{seller.email}</Value>
            <Value>{seller.phone}</Value>
          </DetailItem>

          <DetailItem>
            <Label>Balance Information:</Label>
            {isBalanceLoading ? (
              <Value>Loading...</Value>
            ) : (
              <>
                <Value>
                  <BalanceRow>
                    <BalanceLabel>Total Balance:</BalanceLabel>
                    <BalanceValue>GH₵{sellerBalance?.balance?.toFixed(2) || '0.00'}</BalanceValue>
                  </BalanceRow>
                </Value>
                <Value>
                  <BalanceRow>
                    <BalanceLabel>Withdrawable:</BalanceLabel>
                    <BalanceValue>GH₵{sellerBalance?.withdrawableBalance?.toFixed(2) || '0.00'}</BalanceValue>
                  </BalanceRow>
                </Value>
                <Value>
                  <BalanceRow>
                    <BalanceLabel>Locked:</BalanceLabel>
                    <BalanceValue>GH₵{sellerBalance?.lockedBalance?.toFixed(2) || '0.00'}</BalanceValue>
                  </BalanceRow>
                </Value>
                <Value>
                  <BalanceRow>
                    <BalanceLabel>Pending:</BalanceLabel>
                    <BalanceValue>GH₵{sellerBalance?.pendingBalance?.toFixed(2) || '0.00'}</BalanceValue>
                  </BalanceRow>
                </Value>
              </>
            )}
          </DetailItem>

          {/* Payout Information */}
          <DetailItem>
            <Label>Payout Information:</Label>
            {seller.payoutStatus ? (
              <>
                <Value>
                  <PayoutStatusBadge $status={seller.payoutStatus}>
                    {seller.payoutStatus === 'verified' && <FaCheckCircle style={{ marginRight: '0.5rem' }} />}
                    {seller.payoutStatus === 'rejected' && <FaTimesCircle style={{ marginRight: '0.5rem' }} />}
                    {seller.payoutStatus === 'pending' && <FaWallet style={{ marginRight: '0.5rem' }} />}
                    Payout Status: {seller.payoutStatus.toUpperCase()}
                  </PayoutStatusBadge>
                </Value>
                {seller.payoutRejectionReason && (
                  <Value style={{ color: '#dc3545', marginTop: '0.5rem' }}>
                    <strong>Rejection Reason:</strong> {seller.payoutRejectionReason}
                  </Value>
                )}
                {seller.payoutVerifiedAt && (
                  <Value style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    Verified on: {new Date(seller.payoutVerifiedAt).toLocaleDateString()}
                  </Value>
                )}
              </>
            ) : (
              <Value style={{ color: '#999' }}>No payout information available</Value>
            )}
          </DetailItem>

          {/* Payment Methods */}
          {(seller.paymentMethods?.bankAccount || seller.paymentMethods?.mobileMoney) && (
            <DetailItem>
              <Label>Payment Methods:</Label>
              {seller.paymentMethods?.bankAccount && (
                <Value style={{ marginBottom: '0.5rem' }}>
                  <PaymentMethodCard>
                    <FaBuilding style={{ marginRight: '0.5rem', color: '#007bff' }} />
                    <div>
                      <strong>Bank Account</strong>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                        {seller.paymentMethods.bankAccount.accountName}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.25rem' }}>
                        {seller.paymentMethods.bankAccount.accountNumber} | {seller.paymentMethods.bankAccount.bankName}
                      </div>
                    </div>
                  </PaymentMethodCard>
                </Value>
              )}
              {seller.paymentMethods?.mobileMoney && (
                <Value>
                  <PaymentMethodCard>
                    <FaMobileAlt style={{ marginRight: '0.5rem', color: '#28a745' }} />
                    <div>
                      <strong>Mobile Money ({seller.paymentMethods.mobileMoney.network || 'Unknown'})</strong>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                        {seller.paymentMethods.mobileMoney.accountName || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.25rem' }}>
                        {seller.paymentMethods.mobileMoney.phone}
                      </div>
                    </div>
                  </PaymentMethodCard>
                </Value>
              )}
            </DetailItem>
          )}
        </DetailsSection>

        <ActionGroup>
          {/* Hide approve/reject buttons if seller is already verified */}
          {/* Show buttons only if seller is pending or rejected (not verified) */}
          {/* Seller Document Verification - Approve/Reject buttons */}
          {/* This approves the seller after they've uploaded all required documents (businessCert, idProof, addresProof) */}
          {/* Backend will check: email verified + all documents uploaded before approving */}
          {(seller.verificationStatus === 'pending' || !seller.verificationStatus || seller.verificationStatus === 'rejected') && 
           (seller.onboardingStage !== 'verified') && (
            <>
              <ActionButton
                variant="success"
                onClick={handleApproveVerification}
                disabled={approveVerification.isPending || !hasAllRequiredDocuments() || !seller.verification?.emailVerified}
                title={!hasAllRequiredDocuments() ? `Missing documents: ${getMissingDocuments().join(', ')}` : !seller.verification?.emailVerified ? 'Email must be verified' : ''}
              >
                <FaCheckCircle style={{ marginRight: '0.5rem' }} />
                {approveVerification.isPending ? 'Approving...' : 'Approve Verification'}
              </ActionButton>
              <ActionButton
                variant="danger"
                onClick={handleRejectVerification}
                disabled={rejectVerification.isPending}
              >
                <FaTimesCircle style={{ marginRight: '0.5rem' }} />
                Reject Verification
              </ActionButton>
            </>
          )}
          <ActionButton
            variant="warning"
            onClick={() => setShowResetModal(true)}
          >
            <FaUndo style={{ marginRight: '0.5rem' }} />
            Reset Balance
          </ActionButton>
          {(sellerBalance?.lockedBalance > 0 || seller?.lockedBalance > 0) && (
            <ActionButton
              variant="info"
              onClick={() => setShowResetLockedModal(true)}
              style={{ background: '#17a2b8', color: 'white' }}
            >
              <FaLock style={{ marginRight: '0.5rem' }} />
              Reset Locked Balance (GH₵{(sellerBalance?.lockedBalance || seller?.lockedBalance || 0).toFixed(2)})
            </ActionButton>
          )}
          
          {/* Payout Verification Actions */}
          {seller.payoutStatus === 'pending' && (seller.paymentMethods?.bankAccount || seller.paymentMethods?.mobileMoney) && (
            <>
              <ActionButton
                variant="success"
                onClick={async () => {
                  try {
                    // Determine payment method
                    const paymentMethod = seller.paymentMethods?.bankAccount 
                      ? 'bank' 
                      : seller.paymentMethods?.mobileMoney?.network === 'MTN' 
                        ? 'mtn_momo'
                        : seller.paymentMethods?.mobileMoney?.network === 'Vodafone'
                          ? 'vodafone_cash'
                          : 'airtel_tigo_money';
                    
                    await approvePayout.mutateAsync({
                      sellerId: seller._id,
                      paymentMethod,
                    });
                    toast.success('Payout verification approved successfully');
                    onClose();
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to approve payout verification');
                  }
                }}
                disabled={approvePayout.isPending}
              >
                <FaCheckCircle style={{ marginRight: '0.5rem' }} />
                {approvePayout.isPending ? 'Approving...' : 'Approve Payout'}
              </ActionButton>
              <ActionButton
                variant="danger"
                onClick={() => setShowRejectPayoutModal(true)}
                disabled={rejectPayout.isPending}
              >
                <FaTimesCircle style={{ marginRight: '0.5rem' }} />
                Reject Payout
              </ActionButton>
            </>
          )}
          
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
        </ActionGroup>

        {/* Reset Balance Modal */}
        {showResetModal && (
          <ResetBalanceModal>
            <ResetModalContent>
              <ResetModalHeader>
                <h3>Reset Seller Balance</h3>
                <CloseButton onClick={() => setShowResetModal(false)}>&times;</CloseButton>
              </ResetModalHeader>
              <ResetModalBody>
                <ResetInfo>
                  <p><strong>Current Balance:</strong> GH₵{sellerBalance?.balance?.toFixed(2) || '0.00'}</p>
                  <p><strong>Locked Balance:</strong> GH₵{sellerBalance?.lockedBalance?.toFixed(2) || '0.00'}</p>
                  <p><strong>Pending Balance:</strong> GH₵{sellerBalance?.pendingBalance?.toFixed(2) || '0.00'}</p>
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
              </ResetModalBody>
              <ResetModalActions>
                <ActionButton
                  variant="warning"
                  onClick={async () => {
                    if (!resetBalance || parseFloat(resetBalance) < 0) {
                      toast.error('Please enter a valid balance amount');
                      return;
                    }
                    try {
                      await resetBalanceMutation.mutateAsync({
                        sellerId: seller._id,
                        balance: parseFloat(resetBalance),
                        reason: resetReason || undefined,
                      });
                      setShowResetModal(false);
                      setResetBalance("");
                      setResetReason("");
                      onClose();
                    } catch (error) {
                      console.error('Error resetting balance:', error);
                    }
                  }}
                  disabled={resetBalanceMutation.isPending}
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
              </ResetModalActions>
            </ResetModalContent>
          </ResetBalanceModal>
        )}

        {/* Reject Payout Modal */}
        {showRejectPayoutModal && (
          <ResetBalanceModal>
            <ResetModalContent>
              <ResetModalHeader>
                <h3>Reject Payout Verification</h3>
                <CloseButton onClick={() => setShowRejectPayoutModal(false)}>&times;</CloseButton>
              </ResetModalHeader>
              <ResetModalBody>
                <ResetInfo>
                  <p><strong>Seller:</strong> {seller.shopName || seller.name}</p>
                  <p><strong>Current Status:</strong> {seller.payoutStatus || 'pending'}</p>
                  {seller.paymentMethods?.bankAccount && (
                    <p><strong>Payment Method:</strong> Bank Account - {seller.paymentMethods.bankAccount.accountNumber}</p>
                  )}
                  {seller.paymentMethods?.mobileMoney && (
                    <p><strong>Payment Method:</strong> Mobile Money ({seller.paymentMethods.mobileMoney.network}) - {seller.paymentMethods.mobileMoney.phone}</p>
                  )}
                </ResetInfo>
                <ResetFormGroup>
                  <ResetLabel>Rejection Reason *</ResetLabel>
                  <ResetTextarea
                    value={payoutRejectionReason}
                    onChange={(e) => setPayoutRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejecting payout verification..."
                    rows="4"
                    required
                  />
                </ResetFormGroup>
              </ResetModalBody>
              <ResetModalActions>
                <ActionButton
                  variant="danger"
                  onClick={async () => {
                    if (!payoutRejectionReason.trim()) {
                      toast.error('Please provide a reason for rejection');
                      return;
                    }
                    try {
                      await rejectPayout.mutateAsync({
                        sellerId: seller._id,
                        reason: payoutRejectionReason.trim(),
                      });
                      toast.success('Payout verification rejected');
                      setShowRejectPayoutModal(false);
                      setPayoutRejectionReason("");
                      onClose();
                    } catch (error) {
                      toast.error(error.response?.data?.message || 'Failed to reject payout verification');
                    }
                  }}
                  disabled={rejectPayout.isPending || !payoutRejectionReason.trim()}
                >
                  {rejectPayout.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </ActionButton>
                <ActionButton variant="secondary" onClick={() => {
                  setShowRejectPayoutModal(false);
                  setPayoutRejectionReason("");
                }}>
                  Cancel
                </ActionButton>
              </ResetModalActions>
            </ResetModalContent>
          </ResetBalanceModal>
        )}

        {/* Reset Locked Balance Modal */}
        {showResetLockedModal && (
          <ResetBalanceModal>
            <ResetModalContent>
              <ResetModalHeader>
                <h3>Reset Locked Balance</h3>
                <CloseButton onClick={() => setShowResetLockedModal(false)}>&times;</CloseButton>
              </ResetModalHeader>
              <ResetModalBody>
                <ResetInfo>
                  <p><strong>Current Balance:</strong> GH₵{sellerBalance?.balance?.toFixed(2) || '0.00'}</p>
                  <p><strong>Locked Balance:</strong> GH₵{sellerBalance?.lockedBalance?.toFixed(2) || '0.00'}</p>
                  <p><strong>New Balance After Reset:</strong> GH₵{((sellerBalance?.balance || 0) + (sellerBalance?.lockedBalance || 0)).toFixed(2)}</p>
                  <p style={{ color: '#dc3545', fontWeight: 'bold' }}>
                    ⚠️ This will return all locked funds (GH₵{sellerBalance?.lockedBalance?.toFixed(2) || '0.00'}) back to the seller's balance.
                  </p>
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
              </ResetModalBody>
              <ResetModalActions>
                <ActionButton
                  variant="info"
                  onClick={async () => {
                    try {
                      await resetLockedBalanceMutation.mutateAsync({
                        sellerId: seller._id,
                        reason: resetLockedReason || undefined,
                      });
                      setShowResetLockedModal(false);
                      setResetLockedReason("");
                      onClose();
                    } catch (error) {
                      console.error('Error resetting locked balance:', error);
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
              </ResetModalActions>
            </ResetModalContent>
          </ResetBalanceModal>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};
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
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
`;

const DetailsSection = styled.div`
  margin: 1.5rem 0;
`;

const DetailItem = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
`;

const Value = styled.div`
  color: #666;
  margin-bottom: 0.25rem;
`;

const Documents = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const DocumentLink = styled.a`
  color: #007bff;
  text-decoration: none;
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #e7f3ff;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  &:hover {
    text-decoration: underline;
    background: #d0e7ff;
  }
`;

const DocumentMissing = styled.span`
  color: #dc3545;
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #fff5f5;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const DocumentWarning = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  font-size: 0.875rem;
  font-weight: 500;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

// Define a simple ActionButton styled-component
const ActionButton = styled.button`
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ variant }) =>
    variant === "success"
      ? "#28a745"
      : variant === "danger"
      ? "#dc3545"
      : variant === "warning"
      ? "#ffc107"
      : "#6c757d"};
  color: ${({ variant }) => (variant === "warning" ? "#000" : "white")};
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  transition: background 0.2s;

  &:hover {
    background: ${({ variant }) =>
      variant === "success"
        ? "#218838"
        : variant === "danger"
        ? "#c82333"
        : variant === "warning"
        ? "#e0a800"
        : "#5a6268"};
  }
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const BalanceLabel = styled.span`
  font-weight: 500;
  color: #666;
`;

const BalanceValue = styled.span`
  font-weight: 600;
  color: #333;
`;

const ResetBalanceModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ResetModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
`;

const ResetModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
`;

const ResetModalBody = styled.div`
  margin: 1.5rem 0;
`;

const ResetInfo = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  
  p {
    margin: 0.5rem 0;
    color: #666;
  }
`;

const ResetFormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const ResetLabel = styled.label`
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
`;

const ResetInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const ResetTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const ResetModalActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;
`;

const PayoutStatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  background: ${({ $status }) =>
    $status === 'verified'
      ? '#d1fae5'
      : $status === 'rejected'
      ? '#fee2e2'
      : '#fef3c7'};
  color: ${({ $status }) =>
    $status === 'verified'
      ? '#065f46'
      : $status === 'rejected'
      ? '#991b1b'
      : '#92400e'};
`;

const PaymentMethodCard = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  margin-top: 0.5rem;
`;

export default SellerDetailsModal;
