import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import styled from "styled-components";
import {
  FaArrowLeft,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaUser,
  FaStore,
  FaPhone,
  FaEnvelope,
  FaCheck,
  FaTimes,
  FaClock,
  FaFileAlt,
  FaBuilding,
  FaMobileAlt,
  FaShieldAlt,
  FaGlobe,
  FaDesktop,
} from "react-icons/fa";
import { useGetWithdrawalRequest, useVerifyPaystackOtp, useResendPaystackOtp } from "../../shared/hooks/usePayout";
import { PATHS } from "../../routes/routhPath";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import { useApproveWithdrawalRequest, useRejectWithdrawalRequest, useVerifyTransferStatus } from "../../shared/hooks/usePayout";

const PaymentRequestDetail = () => {
  const { id: requestId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  const {
    data: withdrawalData,
    isLoading,
    error,
  } = useGetWithdrawalRequest(requestId);

  const request = withdrawalData?.data?.withdrawalRequest || withdrawalData?.withdrawalRequest || null;

  // Withdrawal request mutations
  const approveWithdrawal = useApproveWithdrawalRequest();
  const rejectWithdrawal = useRejectWithdrawalRequest();
  const verifyTransfer = useVerifyTransferStatus();
  const verifyPaystackOtp = useVerifyPaystackOtp();
  const resendPaystackOtp = useResendPaystackOtp();

  // Check if transfer is already completed
  const isTransferCompleted = (status) => {
    const completedStatuses = ['paid', 'success', 'completed', 'settled'];
    return completedStatuses.includes(status?.toLowerCase());
  };

  // Format payment method for display
  const getMethodDisplay = (method) => {
    const methodMap = {
      bank: "Bank Transfer",
      mtn_momo: "MTN Mobile Money",
      vodafone_cash: "Vodafone Cash",
      airtel_tigo_money: "AirtelTigo Money",
      cash: "Cash Pickup",
    };
    return methodMap[method] || method;
  };

  // Format status badge (handles both PaymentRequest and WithdrawalRequest statuses)
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: "#f39c12", bg: "#fef3c7", icon: FaClock, text: "Pending" },
      processing: { color: "#3498db", bg: "#dbeafe", icon: FaClock, text: "Processing" },
      approved: { color: "#27ae60", bg: "#d1fae5", icon: FaCheck, text: "Approved" },
      paid: { color: "#27ae60", bg: "#d1fae5", icon: FaCheck, text: "Paid" },
      success: { color: "#27ae60", bg: "#d1fae5", icon: FaCheck, text: "Success" },
      rejected: { color: "#e74c3c", bg: "#fee2e2", icon: FaTimes, text: "Rejected" },
      failed: { color: "#e74c3c", bg: "#fee2e2", icon: FaTimes, text: "Failed" },
      cancelled: { color: "#95a5a6", bg: "#f3f4f6", icon: FaTimes, text: "Cancelled" },
    };
    return statusMap[status] || statusMap.pending;
  };

  const handleApprove = () => {
    if (!requestId) return;
    if (window.confirm("Are you sure you want to approve this withdrawal request? This will initiate a Paystack transfer.")) {
      approveWithdrawal.mutate(requestId, {
        onSuccess: (data) => {
          const balanceInfo = data?.data?.sellerBalance;
          let message = "Withdrawal request approved and transfer initiated!";
          if (balanceInfo) {
            message += ` Seller's remaining available balance: ₵${balanceInfo.availableBalance.toFixed(2)}`;
          }
          setSuccessMessage(message);
          setErrorMessage(null);
          // Invalidate queries to refresh the withdrawal request data
          queryClient.invalidateQueries(['withdrawalRequest', requestId]);
        },
        onError: (error) => {
          setErrorMessage(error.response?.data?.message || "Failed to approve withdrawal request");
          setSuccessMessage(null);
        },
      });
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setErrorMessage("Please provide a reason for rejection");
      return;
    }
    rejectWithdrawal.mutate(
      { requestId, reason: rejectionReason.trim() },
      {
        onSuccess: () => {
          setSuccessMessage("Withdrawal request rejected successfully!");
          setErrorMessage(null);
          setShowRejectModal(false);
          setRejectionReason("");
        },
        onError: (error) => {
          setErrorMessage(error.response?.data?.message || "Failed to reject withdrawal request");
          setSuccessMessage(null);
        },
      }
    );
  };

  const handleVerify = () => {
    if (!requestId) return;
    verifyTransfer.mutate(requestId, {
      onSuccess: () => {
        setSuccessMessage("Transfer status verified and updated!");
        setErrorMessage(null);
        // Refresh the withdrawal request data
        queryClient.invalidateQueries(['withdrawalRequest', requestId]);
      },
      onError: (error) => {
        setErrorMessage(error.response?.data?.message || "Failed to verify transfer status");
        setSuccessMessage(null);
      },
    });
  };

  const handleOpenOtpModal = () => {
    if (!requestId) return;
    setOtpModalOpen(true);
    setOtpValue("");
  };

  const handleSubmitOtp = () => {
    const trimmedOtp = otpValue.trim();
    
    if (!trimmedOtp) {
      setErrorMessage("Please enter the Paystack OTP");
      return;
    }
    
    // Validate OTP format (should be at least 4 characters, typically 6 digits)
    if (trimmedOtp.length < 4) {
      setErrorMessage("OTP must be at least 4 characters long");
      return;
    }
    
    // Check if withdrawal is in correct status
    if (request?.status !== 'awaiting_paystack_otp') {
      setErrorMessage(
        `Cannot verify OTP. Current status: ${request?.status || 'unknown'}. The withdrawal must be in 'awaiting_paystack_otp' status.`
      );
      return;
    }
    
    verifyPaystackOtp.mutate(
      { requestId, otp: trimmedOtp },
      {
        onSuccess: (data) => {
          // Check if this was a status sync (transfer already completed)
          const responseMessage = data?.message || data?.data?.message;
          if (responseMessage && responseMessage.includes('already completed')) {
            setSuccessMessage(responseMessage || "Transfer was already completed. Status has been synced.");
          } else {
            setSuccessMessage("Paystack OTP verified and transfer updated!");
          }
          setErrorMessage(null);
          setOtpModalOpen(false);
          setOtpValue("");
          queryClient.invalidateQueries(['withdrawalRequest', requestId]);
        },
        onError: (error) => {
          // Extract error message from various possible response formats
          let errorMessage = 
            error.response?.data?.message ||
            error.response?.data?.error?.message ||
            error.message ||
            "Failed to verify Paystack OTP";
          
          console.error('[PaymentRequestDetail] OTP verification error:', {
            error,
            response: error.response?.data,
            status: error.response?.status,
          });
          
          // If error indicates transfer is not awaiting OTP, suggest refreshing status
          if (errorMessage.toLowerCase().includes('not currently awaiting otp') ||
              errorMessage.toLowerCase().includes('transfer is not') ||
              errorMessage.toLowerCase().includes('not awaiting otp')) {
            errorMessage += " Please click 'Verify Transfer Status' to refresh the transfer status from Paystack.";
          }
          
          setErrorMessage(errorMessage);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  if (error || !request) {
    return (
      <Container>
        <ErrorBox>
          <FaTimes />
          <p>{error?.response?.data?.message || error?.message || "Withdrawal request not found"}</p>
          <BackButton onClick={() => navigate(`/dashboard/${PATHS.PAYMENTS}`)}>
            <FaArrowLeft /> Back to Withdrawal Requests
          </BackButton>
        </ErrorBox>
      </Container>
    );
  }

  const statusBadge = getStatusBadge(request.status, request.isActive);
  const StatusIcon = statusBadge.icon;
  const seller = request.seller || {};
  const paymentDetails = request.paymentDetails || {};

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(`/dashboard/${PATHS.PAYMENTS}`)}>
          <FaArrowLeft /> Back to Withdrawal Requests
        </BackButton>
        <Title>Withdrawal Request Details</Title>
      </Header>

      {successMessage && (
        <SuccessBanner>
          <FaCheck /> {successMessage}
        </SuccessBanner>
      )}

      {errorMessage && (
        <ErrorBanner>
          <FaTimes /> {errorMessage}
        </ErrorBanner>
      )}

      <Content>
        <LeftColumn>
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
              <StatusBadge $status={request.status}>
                <StatusIcon />
                {statusBadge.text}
              </StatusBadge>
            </CardHeader>
            <CardBody>
              <DetailRow>
                <DetailLabel>
                  <FaMoneyBillWave /> Request ID
                </DetailLabel>
                <DetailValue>#{request._id?.slice(-8) || request.id || "N/A"}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>
                  <FaMoneyBillWave /> Amount
                </DetailLabel>
                <DetailValue>₵{request.amount?.toFixed(2) || "0.00"}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>
                  <FaCalendarAlt /> Request Date
                </DetailLabel>
                <DetailValue>
                  {new Date(request.createdAt || request.date).toLocaleString()}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>
                  <FaFileAlt /> Payout Method
                </DetailLabel>
                <DetailValue>{getMethodDisplay(request.payoutMethod || request.paymentMethod)}</DetailValue>
              </DetailRow>
              {request.transactionId && (
                <DetailRow>
                  <DetailLabel>
                    <FaFileAlt /> Transaction ID
                  </DetailLabel>
                  <DetailValue>{request.transactionId}</DetailValue>
                </DetailRow>
              )}
              {request.paystackReference && (
                <DetailRow>
                  <DetailLabel>
                    <FaFileAlt /> Paystack Reference
                  </DetailLabel>
                  <DetailValue>{request.paystackReference}</DetailValue>
                </DetailRow>
              )}
              {request.paystackTransferCode && (
                <DetailRow>
                  <DetailLabel>
                    <FaFileAlt /> Transfer Code
                  </DetailLabel>
                  <DetailValue>{request.paystackTransferCode}</DetailValue>
                </DetailRow>
              )}
              {request.processedAt && (
                <DetailRow>
                  <DetailLabel>
                    <FaCalendarAlt /> Processed At
                  </DetailLabel>
                  <DetailValue>
                    {new Date(request.processedAt).toLocaleString()}
                  </DetailValue>
                </DetailRow>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seller Information</CardTitle>
            </CardHeader>
            <CardBody>
              <DetailRow>
                <DetailLabel>
                  <FaStore /> Shop Name
                </DetailLabel>
                <DetailValue>{seller.shopName || seller.name || "N/A"}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>
                  <FaUser /> Name
                </DetailLabel>
                <DetailValue>{seller.name || "N/A"}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>
                  <FaEnvelope /> Email
                </DetailLabel>
                <DetailValue>{seller.email || "N/A"}</DetailValue>
              </DetailRow>
              {seller.phone && (
                <DetailRow>
                  <DetailLabel>
                    <FaPhone /> Phone
                  </DetailLabel>
                  <DetailValue>{seller.phone}</DetailValue>
                </DetailRow>
              )}
            </CardBody>
          </Card>
        </LeftColumn>

        <RightColumn>
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardBody>
              {(request.payoutMethod === "bank" || request.paymentMethod === "bank") && (
                <>
                  <DetailRow>
                    <DetailLabel>
                      <FaBuilding /> Bank Name
                    </DetailLabel>
                    <DetailValue>{paymentDetails.bankName || "N/A"}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>
                      <FaUser /> Account Name
                    </DetailLabel>
                    <DetailValue>{paymentDetails.accountName || "N/A"}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>
                      <FaFileAlt /> Account Number
                    </DetailLabel>
                    <DetailValue>{paymentDetails.accountNumber || "N/A"}</DetailValue>
                  </DetailRow>
                  {paymentDetails.branch && (
                    <DetailRow>
                      <DetailLabel>
                        <FaBuilding /> Branch
                      </DetailLabel>
                      <DetailValue>{paymentDetails.branch}</DetailValue>
                    </DetailRow>
                  )}
                </>
              )}

              {((request.payoutMethod === "mtn_momo" || request.paymentMethod === "mtn_momo") ||
                (request.payoutMethod === "vodafone_cash" || request.paymentMethod === "vodafone_cash") ||
                (request.payoutMethod === "airtel_tigo_money" || request.paymentMethod === "airtel_tigo_money")) && (
                <>
                  <DetailRow>
                    <DetailLabel>
                      <FaMobileAlt /> Network
                    </DetailLabel>
                    <DetailValue>{paymentDetails.network || "N/A"}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>
                      <FaPhone /> Phone Number
                    </DetailLabel>
                    <DetailValue>{paymentDetails.phone || "N/A"}</DetailValue>
                  </DetailRow>
                  {paymentDetails.accountName && (
                    <DetailRow>
                      <DetailLabel>
                        <FaUser /> Account Name
                      </DetailLabel>
                      <DetailValue>{paymentDetails.accountName}</DetailValue>
                    </DetailRow>
                  )}
                </>
              )}

              {request.paymentMethod === "cash" && (
                <>
                  <DetailRow>
                    <DetailLabel>
                      <FaBuilding /> Pickup Location
                    </DetailLabel>
                    <DetailValue>{paymentDetails.pickupLocation || "N/A"}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>
                      <FaUser /> Contact Person
                    </DetailLabel>
                    <DetailValue>{paymentDetails.contactPerson || "N/A"}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>
                      <FaPhone /> Contact Phone
                    </DetailLabel>
                    <DetailValue>{paymentDetails.contactPhone || "N/A"}</DetailValue>
                  </DetailRow>
                </>
              )}
            </CardBody>
          </Card>

          {/* Seller Balance Information */}
          {seller.balance !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Seller Balance Information</CardTitle>
              </CardHeader>
              <CardBody>
                <DetailRow>
                  <DetailLabel>
                    <FaMoneyBillWave /> Total Revenue
                  </DetailLabel>
                  <DetailValue>₵{(seller.balance || 0).toFixed(2)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>
                    <FaMoneyBillWave /> Locked Balance
                  </DetailLabel>
                  <DetailValue>₵{(seller.lockedBalance || 0).toFixed(2)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>
                    <FaMoneyBillWave /> Pending Balance
                  </DetailLabel>
                  <DetailValue>₵{(seller.pendingBalance || 0).toFixed(2)}</DetailValue>
                </DetailRow>
                <DetailRow style={{ borderTop: '2px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <DetailLabel style={{ fontWeight: 600, color: '#1e293b' }}>
                    <FaMoneyBillWave /> Available Balance
                  </DetailLabel>
                  <DetailValue style={{ fontWeight: 700, color: '#059669', fontSize: '1.1rem' }}>
                    ₵{(seller.withdrawableBalance || 0).toFixed(2)}
                  </DetailValue>
                </DetailRow>
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <strong>Note:</strong> Available Balance = Total Revenue - Locked Balance - Pending Balance. 
                  {request.status === 'awaiting_paystack_otp' && ' Balance will be deducted when seller verifies OTP.'}
                </div>
              </CardBody>
            </Card>
          )}

          {request.rejectionReason && (
            <Card>
              <CardHeader>
                <CardTitle>Rejection Reason</CardTitle>
              </CardHeader>
              <CardBody>
                <RejectionText>{request.rejectionReason}</RejectionText>
              </CardBody>
            </Card>
          )}

          {/* Approval Information */}
          {request.approvedByAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <FaShieldAlt /> Approval Information
                </CardTitle>
              </CardHeader>
              <CardBody>
                <DetailRow>
                  <DetailLabel>
                    <FaUser /> Approved By
                  </DetailLabel>
                  <DetailValue>{request.approvedByAdmin.name || "N/A"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>
                    <FaShieldAlt /> Role
                  </DetailLabel>
                  <DetailValue style={{ textTransform: 'capitalize' }}>{request.approvedByAdmin.role || "N/A"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>
                    <FaEnvelope /> Email
                  </DetailLabel>
                  <DetailValue>{request.approvedByAdmin.email || "N/A"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>
                    <FaCalendarAlt /> Approval Time
                  </DetailLabel>
                  <DetailValue>
                    {request.approvedByAdmin.timestamp
                      ? new Date(request.approvedByAdmin.timestamp).toLocaleString()
                      : "N/A"}
                  </DetailValue>
                </DetailRow>
                {request.approvedByAdmin.ipAddress && (
                  <DetailRow>
                    <DetailLabel>
                      <FaGlobe /> IP Address
                    </DetailLabel>
                    <DetailValue style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {request.approvedByAdmin.ipAddress}
                    </DetailValue>
                  </DetailRow>
                )}
                {request.approvedByAdmin.userAgent && (
                  <DetailRow>
                    <DetailLabel>
                      <FaDesktop /> Device
                    </DetailLabel>
                    <DetailValue style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {request.approvedByAdmin.userAgent.length > 60
                        ? `${request.approvedByAdmin.userAgent.substring(0, 60)}...`
                        : request.approvedByAdmin.userAgent}
                    </DetailValue>
                  </DetailRow>
                )}
              </CardBody>
            </Card>
          )}

          {/* Rejection Information */}
          {request.rejectedByAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <FaShieldAlt /> Rejection Information
                </CardTitle>
              </CardHeader>
              <CardBody>
                <DetailRow>
                  <DetailLabel>
                    <FaUser /> Rejected By
                  </DetailLabel>
                  <DetailValue>{request.rejectedByAdmin.name || "N/A"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>
                    <FaShieldAlt /> Role
                  </DetailLabel>
                  <DetailValue style={{ textTransform: 'capitalize' }}>{request.rejectedByAdmin.role || "N/A"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>
                    <FaEnvelope /> Email
                  </DetailLabel>
                  <DetailValue>{request.rejectedByAdmin.email || "N/A"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>
                    <FaCalendarAlt /> Rejection Time
                  </DetailLabel>
                  <DetailValue>
                    {request.rejectedByAdmin.timestamp
                      ? new Date(request.rejectedByAdmin.timestamp).toLocaleString()
                      : "N/A"}
                  </DetailValue>
                </DetailRow>
                {request.rejectedByAdmin.ipAddress && (
                  <DetailRow>
                    <DetailLabel>
                      <FaGlobe /> IP Address
                    </DetailLabel>
                    <DetailValue style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {request.rejectedByAdmin.ipAddress}
                    </DetailValue>
                  </DetailRow>
                )}
                {request.rejectedByAdmin.userAgent && (
                  <DetailRow>
                    <DetailLabel>
                      <FaDesktop /> Device
                    </DetailLabel>
                    <DetailValue style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {request.rejectedByAdmin.userAgent.length > 60
                        ? `${request.rejectedByAdmin.userAgent.substring(0, 60)}...`
                        : request.rejectedByAdmin.userAgent}
                    </DetailValue>
                  </DetailRow>
                )}
              </CardBody>
            </Card>
          )}

          {request.status === "pending" && 
           request.isActive !== false && 
           !isTransferCompleted(request.status) && (
            <ActionCard>
              <ActionTitle>Actions</ActionTitle>
              <ActionButtons>
                <ApproveButton
                  onClick={handleApprove}
                  disabled={approveWithdrawal.isPending}
                >
                  {approveWithdrawal.isPending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck /> Approve & Transfer
                    </>
                  )}
                </ApproveButton>
                <RejectButton
                  onClick={() => setShowRejectModal(true)}
                  disabled={rejectWithdrawal.isPending}
                >
                  {rejectWithdrawal.isPending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaTimes /> Reject
                    </>
                  )}
                </RejectButton>
              </ActionButtons>
            </ActionCard>
          )}
          {request.isActive === false && (
            <ActionCard>
              <ActionTitle>Status</ActionTitle>
              <DeactivatedBadge>
                <FaTimes /> Deactivated by Seller
              </DeactivatedBadge>
              {request.deactivatedAt && (
                <DeactivatedInfo>
                  Deactivated on: {new Date(request.deactivatedAt).toLocaleString()}
                </DeactivatedInfo>
              )}
              <DeactivatedWarning>
                This withdrawal was deactivated by the seller and cannot be processed.
              </DeactivatedWarning>
            </ActionCard>
          )}
          {(request.status === "processing" || request.status === "approved" || request.status === "awaiting_paystack_otp") && 
           !isTransferCompleted(request.status) && (
            <ActionCard>
              <ActionTitle>Actions</ActionTitle>
              <ActionButtons>
                <ApproveButton
                  onClick={handleVerify}
                  disabled={verifyTransfer.isPending}
                >
                  {verifyTransfer.isPending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck /> Verify Transfer Status
                    </>
                  )}
                </ApproveButton>
                {request.status === "awaiting_paystack_otp" && (
                  <>
                    <ApproveButton
                      type="button"
                      onClick={handleOpenOtpModal}
                      disabled={verifyPaystackOtp.isPending}
                    >
                      <FaCheck /> Enter Paystack OTP
                    </ApproveButton>
                    <ApproveButton
                      type="button"
                      onClick={() => resendPaystackOtp.mutate(requestId)}
                      disabled={resendPaystackOtp.isPending}
                    >
                      <FaCheck /> Resend Paystack OTP
                    </ApproveButton>
                  </>
                )}
              </ActionButtons>
            </ActionCard>
          )}
        </RightColumn>
      </Content>

      {otpModalOpen && (
        <ModalOverlay onClick={() => setOtpModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Enter Paystack OTP</ModalTitle>
              <CloseButton onClick={() => setOtpModalOpen(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <p>
                Enter the OTP sent to your Paystack business phone/email to
                finalize this transfer.
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                If you're having issues, try refreshing the transfer status first.
              </p>
              <ModalInput
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={otpValue}
                onChange={(e) => {
                  // Only allow numeric input
                  const value = e.target.value.replace(/\D/g, '');
                  setOtpValue(value);
                }}
                placeholder="Enter OTP (numbers only)"
                maxLength={10}
              />
            </ModalBody>
            <ModalFooter>
              <ModalButton
                $secondary
                type="button"
                onClick={() => setOtpModalOpen(false)}
              >
                Cancel
              </ModalButton>
              <ModalButton
                $primary
                type="button"
                onClick={handleSubmitOtp}
                disabled={verifyPaystackOtp.isPending}
              >
                {verifyPaystackOtp.isPending ? 'Verifying...' : 'Confirm OTP'}
              </ModalButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {showRejectModal && (
        <ModalOverlay onClick={() => setShowRejectModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Reject Payment Request</ModalTitle>
              <CloseButton onClick={() => setShowRejectModal(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <ModalLabel>Reason for Rejection *</ModalLabel>
              <ModalTextarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejecting this payment request..."
                rows={4}
              />
            </ModalBody>
            <ModalFooter>
              <ModalButton $secondary onClick={() => setShowRejectModal(false)}>
                Cancel
              </ModalButton>
              <ModalButton
                $primary
                onClick={handleReject}
                disabled={!rejectionReason.trim() || rejectWithdrawal.isPending}
              >
                {rejectWithdrawal.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </ModalButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default PaymentRequestDetail;

// Styled Components
const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  color: #495057;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e9ecef;
    border-color: #adb5bd;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

const SuccessBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #d1fae5;
  border: 1px solid #10b981;
  border-radius: 8px;
  color: #047857;
  margin-bottom: 1.5rem;
  font-weight: 500;
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #b91c1c;
  margin-bottom: 1.5rem;
  font-weight: 500;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${(props) => {
    const statusMap = {
      pending: "#fef3c7",
      paid: "#d1fae5",
      success: "#d1fae5",
      rejected: "#fee2e2",
      failed: "#fee2e2",
    };
    return statusMap[props.$status] || "#f3f4f6";
  }};
  color: ${(props) => {
    const statusMap = {
      pending: "#f59e0b",
      paid: "#10b981",
      success: "#10b981",
      rejected: "#ef4444",
      failed: "#ef4444",
    };
    return statusMap[props.$status] || "#6b7280";
  }};
`;

const CardBody = styled.div`
  padding: 1.5rem;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #6b7280;
  font-size: 0.95rem;
`;

const DetailValue = styled.div`
  font-weight: 600;
  color: #1e293b;
  text-align: right;
  font-size: 0.95rem;
`;

const RejectionText = styled.p`
  color: #b91c1c;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  padding: 1rem;
  background: #fee2e2;
  border-radius: 8px;
`;

const ActionCard = styled(Card)`
  border: 2px solid #e5e7eb;
`;

const ActionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

const ApproveButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #dc2626;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorBox = styled.div`
  text-align: center;
  padding: 3rem;
  color: #ef4444;

  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }
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
  padding: 2rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #1e293b;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 0.75rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
  margin-top: 0.75rem;
`;

const ModalLabel = styled.label`
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const ModalTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const DeactivatedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
`;

const DeactivatedWarning = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  color: #b45309;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  border: 1px solid #fbbf24;
`;

const DeactivatedInfo = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${(props) =>
    props.$primary
      ? `
    background: #ef4444;
    color: white;
    border: none;
    &:hover:not(:disabled) {
      background: #dc2626;
    }
  `
      : `
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    &:hover {
      background: #e5e7eb;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

