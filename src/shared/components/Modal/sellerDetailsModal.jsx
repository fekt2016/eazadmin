import { useState } from "react";
import styled from "styled-components";
import useSellerAdmin from '../../hooks/useSellerAdmin';
import { useGetSellerBalance, useResetSellerBalance, useResetLockedBalance } from '../../hooks/useSellerBalance';
import { FaWallet, FaUndo, FaLock } from "react-icons/fa";
import { toast } from "react-toastify";

const SellerDetailsModal = ({ seller, onClose }) => {
  // Always call hooks at the top level - never conditionally
  const { updateStatus } = useSellerAdmin();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showResetLockedModal, setShowResetLockedModal] = useState(false);
  const [resetBalance, setResetBalance] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetLockedReason, setResetLockedReason] = useState("");
  
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

  const handleStatusChange = async (newStatus) => {
    console.log("new:", newStatus);
    console.log("sellerId:", seller._id);

    try {
      await updateStatus.mutateAsync({
        sellerId: seller._id,
        status: newStatus,
      });
      onClose();
    } catch (error) {
      console.error("Error updating status:", error);
      // Handle error (e.g., show a notification)
    }
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
              <DocumentLink
                href={seller.verificationDocuments?.idProof}
                target="_blank"
              >
                ID Proof
              </DocumentLink>
              <DocumentLink
                href={seller.verificationDocuments?.addresProof}
                target="_blank"
              >
                Address Proof
              </DocumentLink>
            </Documents>
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
        </DetailsSection>

        <ActionGroup>
          <ActionButton
            variant="success"
            onClick={() => handleStatusChange("active")}
          >
            Approve
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={() => handleStatusChange("deactive")}
          >
            Reject
          </ActionButton>
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
  &:hover {
    text-decoration: underline;
  }
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

export default SellerDetailsModal;
