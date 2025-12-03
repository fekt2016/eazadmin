import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import styled from "styled-components";
import { FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaStore, FaCalendarAlt, FaClock, FaShieldAlt, FaCheckCircle, FaTimesCircle, FaFileAlt, FaIdCard, FaCheck, FaImage, FaTimes, FaEye } from "react-icons/fa";
import { useGetUserById } from '../../shared/hooks/useUserDetail';
import { PATHS } from '../../routes/routhPath';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import adminSellerApi from '../../shared/services/adminSellerApi';

const UserDetail = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine which page to navigate back to based on the current route
  // Use absolute path to avoid relative path issues when navigating from nested routes
  const getBackPath = () => {
    // All routes are nested under /dashboard, so use absolute path
    return `/dashboard/${PATHS.USERS}`;
  };

  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const {
    data: userResponse,
    isLoading,
    error,
  } = useGetUserById(userId);

  // Approve seller verification mutation
  const approveVerification = useMutation({
    mutationFn: (sellerId) => adminSellerApi.approveSellerVerification(sellerId),
    onSuccess: (data) => {
      setSuccessMessage(data?.data?.message || "Seller verification approved successfully!");
      setErrorMessage(null);
      // Invalidate and refetch user data
      queryClient.invalidateQueries(["admin", "user", userId]);
      // Also invalidate sellers list
      queryClient.invalidateQueries(["admin", "sellers"]);
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.message || error.message || "Failed to approve seller verification");
      setSuccessMessage(null);
    },
  });

  // Reject seller verification mutation
  const rejectVerification = useMutation({
    mutationFn: ({ sellerId, reason }) => adminSellerApi.rejectSellerVerification(sellerId, reason),
    onSuccess: (data) => {
      setSuccessMessage(data?.data?.message || "Seller verification rejected successfully!");
      setErrorMessage(null);
      // Invalidate and refetch user data
      queryClient.invalidateQueries(["admin", "user", userId]);
      // Also invalidate sellers list
      queryClient.invalidateQueries(["admin", "sellers"]);
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.message || error.message || "Failed to reject seller verification");
      setSuccessMessage(null);
    },
  });

  // Update document status mutation
  const updateDocumentStatus = useMutation({
    mutationFn: ({ sellerId, documentType, status }) => 
      adminSellerApi.updateDocumentStatus(sellerId, documentType, status),
    onSuccess: (data) => {
      setSuccessMessage(data?.data?.message || "Document status updated successfully!");
      setErrorMessage(null);
      // Invalidate and refetch user data
      queryClient.invalidateQueries(["admin", "user", userId]);
      // Also invalidate sellers list
      queryClient.invalidateQueries(["admin", "sellers"]);
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.message || error.message || "Failed to update document status");
      setSuccessMessage(null);
    },
  });

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Helper function to get document URL and status (handles both old string format and new object format)
  const getDocumentInfo = (document) => {
    if (!document) return { url: null, status: null };
    if (typeof document === 'string') {
      return { url: document, status: 'pending' }; // Old format, default to pending
    }
    return { url: document.url || null, status: document.status || 'pending' };
  };

  // Handle document status update
  const handleDocumentStatusUpdate = (documentType, status) => {
    if (!userId) return;
    updateDocumentStatus.mutate({ sellerId: userId, documentType, status });
  };

  const handleRejectVerification = () => {
    if (!userId) return;
    setShowRejectModal(true);
  };

  const confirmRejectVerification = () => {
    if (!userId) return;
    if (!rejectReason.trim()) {
      setErrorMessage("Please provide a reason for rejection");
      return;
    }
    rejectVerification.mutate({ sellerId: userId, reason: rejectReason });
    setShowRejectModal(false);
    setRejectReason('');
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  if (error) {
    let errorMessage = "Error loading user details. Please try again.";
    
    if (error.message?.includes("Invalid user ID format")) {
      errorMessage = error.message;
    } else if (error.response?.status === 404) {
      // Check if it's a "not found" error
      const apiMessage = error.response?.data?.message || error.message;
      if (apiMessage?.includes("not found") || apiMessage?.includes("doc with this ID")) {
        errorMessage = "User not found. The user may have been deleted or the ID is incorrect.";
      } else {
        errorMessage = apiMessage || "User not found.";
      }
    } else {
      errorMessage = error.response?.data?.message || error.message || errorMessage;
    }
    
    return (
      <Container>
        <Header>
          <BackButton onClick={() => navigate(getBackPath())}>
            <FaArrowLeft /> Back to Users
          </BackButton>
        </Header>
        <ErrorMessage>{errorMessage}</ErrorMessage>
      </Container>
    );
  }

  const userData = userResponse?.data?.data?.data || userResponse?.data?.data || userResponse?.data || {};
  const selectedUser = userData;

  if (!selectedUser || (!selectedUser.id && !selectedUser._id)) {
    return (
      <Container>
        <Header>
          <BackButton onClick={() => navigate(getBackPath())}>
            <FaArrowLeft /> Back to Users
          </BackButton>
        </Header>
        <ErrorMessage>User not found</ErrorMessage>
      </Container>
    );
  }

  // Determine user type
  const isSeller = selectedUser.role === "seller";
  const isAdmin = selectedUser.role === "admin";
  const isUser = selectedUser.role === "user";

  // Check if seller has all required details for verification
  // Email must be verified and all documents must be verified
  const getDocumentStatus = (document) => {
    if (!document) return null;
    if (typeof document === 'string') return null; // Old format, can't determine status
    return document.status || null;
  };

  const businessCertStatus = getDocumentStatus(selectedUser.verificationDocuments?.businessCert);
  const idProofStatus = getDocumentStatus(selectedUser.verificationDocuments?.idProof);
  const addresProofStatus = getDocumentStatus(selectedUser.verificationDocuments?.addresProof);
  
  const allDocumentsVerified = 
    businessCertStatus === 'verified' &&
    idProofStatus === 'verified' &&
    addresProofStatus === 'verified';

  const allDocumentsUploaded = 
    (selectedUser.verificationDocuments?.businessCert && 
     (typeof selectedUser.verificationDocuments.businessCert === 'string' || 
      selectedUser.verificationDocuments.businessCert.url)) &&
    (selectedUser.verificationDocuments?.idProof && 
     (typeof selectedUser.verificationDocuments.idProof === 'string' || 
      selectedUser.verificationDocuments.idProof.url)) &&
    (selectedUser.verificationDocuments?.addresProof && 
     (typeof selectedUser.verificationDocuments.addresProof === 'string' || 
      selectedUser.verificationDocuments.addresProof.url));

  const hasAllRequiredDetails = isSeller && selectedUser.requiredSetup && (
    selectedUser.requiredSetup.hasAddedBusinessInfo &&
    selectedUser.requiredSetup.hasAddedBankDetails &&
    selectedUser.verification?.emailVerified &&
    allDocumentsUploaded
  );

  // Check if seller is fully verified (email verified + all documents verified)
  const isFullyVerified = isSeller && 
    selectedUser.verification?.emailVerified &&
    allDocumentsVerified &&
    allDocumentsUploaded;

  // Check if seller is pending verification and can be approved
  // Can approve if: pending verification, has all required details, email verified, all documents uploaded, but not yet fully verified
  const canApproveVerification = isSeller && 
    selectedUser.onboardingStage === 'pending_verification' &&
    hasAllRequiredDetails &&
    !isFullyVerified;

  const handleApproveVerification = async () => {
    if (!userId) return;
    
    if (window.confirm('Are you sure you want to approve this seller\'s verification? This will mark them as verified.')) {
      approveVerification.mutate(userId);
    }
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(getBackPath())}>
          <FaArrowLeft /> Back to Users
        </BackButton>
        <TitleSection>
          <h1>User Details</h1>
          <p>View complete information about this user</p>
        </TitleSection>
      </Header>

      <Content>
        {successMessage && (
          <SuccessBanner>
            <FaCheckCircle size={20} />
            <span>{successMessage}</span>
            <CloseButton onClick={() => setSuccessMessage(null)}>×</CloseButton>
          </SuccessBanner>
        )}
        {errorMessage && (
          <ErrorBanner>
            <FaTimesCircle size={20} />
            <span>{errorMessage}</span>
            <CloseButton onClick={() => setErrorMessage(null)}>×</CloseButton>
          </ErrorBanner>
        )}
        <UserInfoSection>
          <UserAvatar>{selectedUser.name?.charAt(0) || "U"}</UserAvatar>
          <UserInfoText>
            <UserName>{selectedUser.name || "N/A"}</UserName>
            <UserEmail>
              <FaEnvelope /> {selectedUser.email || "N/A"}
            </UserEmail>
            {selectedUser.phone && (
              <UserPhone>
                <FaPhone /> {selectedUser.phone}
              </UserPhone>
            )}
            <UserRole>
              <RoleBadge role={selectedUser.role}>
                {selectedUser.role?.charAt(0).toUpperCase() + selectedUser.role?.slice(1) || "User"}
              </RoleBadge>
              <StatusBadge status={selectedUser.status || "active"}>
                {selectedUser.status?.charAt(0).toUpperCase() + selectedUser.status?.slice(1) || "Active"}
              </StatusBadge>
            </UserRole>
          </UserInfoText>
        </UserInfoSection>

        <DetailsGrid>
          <DetailCard>
            <DetailIcon>
              <FaCalendarAlt />
            </DetailIcon>
            <DetailContent>
              <DetailLabel>Registration Date</DetailLabel>
              <DetailValue>
                {selectedUser.createdAt
                  ? new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </DetailValue>
            </DetailContent>
          </DetailCard>

          <DetailCard>
            <DetailIcon>
              <FaClock />
            </DetailIcon>
            <DetailContent>
              <DetailLabel>Last Active</DetailLabel>
              <DetailValue>
                {selectedUser.lastLogin
                  ? new Date(selectedUser.lastLogin).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Never logged in"}
              </DetailValue>
            </DetailContent>
          </DetailCard>

          {isUser && (
            <DetailCard>
              <DetailIcon>
                <FaUser />
              </DetailIcon>
              <DetailContent>
                <DetailLabel>Account Type</DetailLabel>
                <DetailValue>Regular User</DetailValue>
              </DetailContent>
            </DetailCard>
          )}

          {isSeller && (
            <>
              <DetailCard>
                <DetailIcon>
                  <FaStore />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Store Name</DetailLabel>
                  <DetailValue>{selectedUser.shopName || selectedUser.businessInfo?.shopName || "-"}</DetailValue>
                </DetailContent>
              </DetailCard>

              <DetailCard>
                <DetailIcon>
                  <FaStore />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Total Orders</DetailLabel>
                  <DetailValue>{selectedUser.orders || 0}</DetailValue>
                </DetailContent>
              </DetailCard>

              <DetailCard>
                <DetailIcon>
                  <FaStore />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Total Revenue</DetailLabel>
                  <DetailValue>{selectedUser.revenue || "$0"}</DetailValue>
                </DetailContent>
              </DetailCard>

              <DetailCard>
                <DetailIcon>
                  <FaShieldAlt />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Onboarding Stage</DetailLabel>
                  <DetailValue>
                    {isFullyVerified 
                      ? "Verified"
                      : selectedUser.onboardingStage 
                        ? selectedUser.onboardingStage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                        : "Not Set"}
                  </DetailValue>
                </DetailContent>
              </DetailCard>

              <DetailCard>
                <DetailIcon>
                  <FaShieldAlt />
                </DetailIcon>
                <DetailContent>
                  <DetailLabel>Verification Status</DetailLabel>
                  <DetailValue>
                    {isFullyVerified 
                      ? "Verified"
                      : selectedUser.verificationStatus 
                        ? selectedUser.verificationStatus.charAt(0).toUpperCase() + selectedUser.verificationStatus.slice(1)
                        : "Pending"}
                  </DetailValue>
                </DetailContent>
              </DetailCard>
            </>
          )}

          {isAdmin && (
            <DetailCard>
              <DetailIcon>
                <FaShieldAlt />
              </DetailIcon>
              <DetailContent>
                <DetailLabel>Permissions Level</DetailLabel>
                <DetailValue>
                  {selectedUser.permissions || "Full Access"}
                </DetailValue>
              </DetailContent>
            </DetailCard>
          )}
        </DetailsGrid>

        {/* Verification Section for Sellers */}
        {isSeller && selectedUser.verification && (
          <VerificationSection>
            <SectionTitle>
              <FaShieldAlt /> Verification Status
            </SectionTitle>
            <VerificationGrid>
              <VerificationItem>
                <VerificationIcon $verified={selectedUser.verification.emailVerified}>
                  {selectedUser.verification.emailVerified ? <FaCheckCircle /> : <FaTimesCircle />}
                </VerificationIcon>
                <VerificationContent>
                  <VerificationLabel>Email Verification</VerificationLabel>
                  <VerificationStatus $verified={selectedUser.verification.emailVerified}>
                    {selectedUser.verification.emailVerified ? "Verified" : "Not Verified"}
                  </VerificationStatus>
                </VerificationContent>
              </VerificationItem>

              <VerificationItem>
                <VerificationIcon $verified={isFullyVerified}>
                  {isFullyVerified ? <FaCheckCircle /> : <FaTimesCircle />}
                </VerificationIcon>
                <VerificationContent>
                  <VerificationLabel>Overall Verification Status</VerificationLabel>
                  <VerificationStatus $verified={isFullyVerified}>
                    {isFullyVerified ? "Fully Verified" : "Not Fully Verified"}
                  </VerificationStatus>
                  {!isFullyVerified && (
                    <VerificationSubtext>
                      {!selectedUser.verification?.emailVerified && "Email not verified. "}
                      {!allDocumentsUploaded && "Documents not uploaded. "}
                      {allDocumentsUploaded && !allDocumentsVerified && "Documents pending verification."}
                    </VerificationSubtext>
                  )}
                </VerificationContent>
              </VerificationItem>
            </VerificationGrid>

            {/* Verification Documents Preview */}
            {isSeller && selectedUser.verificationDocuments && (
              <DocumentsSection>
                <SectionTitle>
                  <FaFileAlt /> Verification Documents
                </SectionTitle>
                <DocumentsGrid>
                  {(() => {
                    const docInfo = getDocumentInfo(selectedUser.verificationDocuments.businessCert);
                    return docInfo.url && (
                      <DocumentPreviewCard>
                        <DocumentPreviewHeader>
                          <DocumentIcon>
                            <FaFileAlt />
                          </DocumentIcon>
                          <DocumentLabel>Business Certificate</DocumentLabel>
                          {docInfo.status && (
                            <DocumentStatusBadge $status={docInfo.status}>
                              {docInfo.status === 'verified' ? <FaCheckCircle /> : docInfo.status === 'rejected' ? <FaTimesCircle /> : null}
                              {docInfo.status.charAt(0).toUpperCase() + docInfo.status.slice(1)}
                            </DocumentStatusBadge>
                          )}
                        </DocumentPreviewHeader>
                        <DocumentPreviewImage 
                          src={docInfo.url} 
                          alt="Business Certificate"
                          onClick={() => setSelectedDocument(docInfo.url)}
                        />
                        <DocumentActions>
                          <DocumentViewButton 
                            href={docInfo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <FaEye /> View Full Size
                          </DocumentViewButton>
                          <DocumentButtonGroup>
                            <DocumentApproveButton
                              onClick={() => handleDocumentStatusUpdate('businessCert', 'verified')}
                              disabled={updateDocumentStatus.isLoading || docInfo.status === 'verified'}
                            >
                              {updateDocumentStatus.isLoading ? (
                                <Spinner />
                              ) : (
                                <>
                                  <FaCheck /> Verify
                                </>
                              )}
                            </DocumentApproveButton>
                            <DocumentRejectButton
                              onClick={() => handleDocumentStatusUpdate('businessCert', 'rejected')}
                              disabled={updateDocumentStatus.isLoading || docInfo.status === 'rejected' || docInfo.status === 'verified'}
                            >
                              {updateDocumentStatus.isLoading ? (
                                <Spinner />
                              ) : (
                                <>
                                  <FaTimes /> Reject
                                </>
                              )}
                            </DocumentRejectButton>
                          </DocumentButtonGroup>
                        </DocumentActions>
                      </DocumentPreviewCard>
                    );
                  })()}

                  {(() => {
                    const docInfo = getDocumentInfo(selectedUser.verificationDocuments.idProof);
                    return docInfo.url && (
                      <DocumentPreviewCard>
                        <DocumentPreviewHeader>
                          <DocumentIcon>
                            <FaIdCard />
                          </DocumentIcon>
                          <DocumentLabel>ID Proof</DocumentLabel>
                          {docInfo.status && (
                            <DocumentStatusBadge $status={docInfo.status}>
                              {docInfo.status === 'verified' ? <FaCheckCircle /> : docInfo.status === 'rejected' ? <FaTimesCircle /> : null}
                              {docInfo.status.charAt(0).toUpperCase() + docInfo.status.slice(1)}
                            </DocumentStatusBadge>
                          )}
                        </DocumentPreviewHeader>
                        <DocumentPreviewImage 
                          src={docInfo.url} 
                          alt="ID Proof"
                          onClick={() => setSelectedDocument(docInfo.url)}
                        />
                        <DocumentActions>
                          <DocumentViewButton 
                            href={docInfo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <FaEye /> View Full Size
                          </DocumentViewButton>
                          <DocumentButtonGroup>
                            <DocumentApproveButton
                              onClick={() => handleDocumentStatusUpdate('idProof', 'verified')}
                              disabled={updateDocumentStatus.isLoading || docInfo.status === 'verified'}
                            >
                              {updateDocumentStatus.isLoading ? (
                                <Spinner />
                              ) : (
                                <>
                                  <FaCheck /> Verify
                                </>
                              )}
                            </DocumentApproveButton>
                            <DocumentRejectButton
                              onClick={() => handleDocumentStatusUpdate('idProof', 'rejected')}
                              disabled={updateDocumentStatus.isLoading || docInfo.status === 'rejected' || docInfo.status === 'verified'}
                            >
                              {updateDocumentStatus.isLoading ? (
                                <Spinner />
                              ) : (
                                <>
                                  <FaTimes /> Reject
                                </>
                              )}
                            </DocumentRejectButton>
                          </DocumentButtonGroup>
                        </DocumentActions>
                      </DocumentPreviewCard>
                    );
                  })()}

                  {(() => {
                    const docInfo = getDocumentInfo(selectedUser.verificationDocuments.addresProof);
                    return docInfo.url && (
                      <DocumentPreviewCard>
                        <DocumentPreviewHeader>
                          <DocumentIcon>
                            <FaFileAlt />
                          </DocumentIcon>
                          <DocumentLabel>Address Proof</DocumentLabel>
                          {docInfo.status && (
                            <DocumentStatusBadge $status={docInfo.status}>
                              {docInfo.status === 'verified' ? <FaCheckCircle /> : docInfo.status === 'rejected' ? <FaTimesCircle /> : null}
                              {docInfo.status.charAt(0).toUpperCase() + docInfo.status.slice(1)}
                            </DocumentStatusBadge>
                          )}
                        </DocumentPreviewHeader>
                        <DocumentPreviewImage 
                          src={docInfo.url} 
                          alt="Address Proof"
                          onClick={() => setSelectedDocument(docInfo.url)}
                        />
                        <DocumentActions>
                          <DocumentViewButton 
                            href={docInfo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <FaEye /> View Full Size
                          </DocumentViewButton>
                          <DocumentButtonGroup>
                            <DocumentApproveButton
                              onClick={() => handleDocumentStatusUpdate('addresProof', 'verified')}
                              disabled={updateDocumentStatus.isLoading || docInfo.status === 'verified'}
                            >
                              {updateDocumentStatus.isLoading ? (
                                <Spinner />
                              ) : (
                                <>
                                  <FaCheck /> Verify
                                </>
                              )}
                            </DocumentApproveButton>
                            <DocumentRejectButton
                              onClick={() => handleDocumentStatusUpdate('addresProof', 'rejected')}
                              disabled={updateDocumentStatus.isLoading || docInfo.status === 'rejected' || docInfo.status === 'verified'}
                            >
                              {updateDocumentStatus.isLoading ? (
                                <Spinner />
                              ) : (
                                <>
                                  <FaTimes /> Reject
                                </>
                              )}
                            </DocumentRejectButton>
                          </DocumentButtonGroup>
                        </DocumentActions>
                      </DocumentPreviewCard>
                    );
                  })()}

                  {(() => {
                    const hasBusinessCert = getDocumentInfo(selectedUser.verificationDocuments.businessCert).url;
                    const hasIdProof = getDocumentInfo(selectedUser.verificationDocuments.idProof).url;
                    const hasAddresProof = getDocumentInfo(selectedUser.verificationDocuments.addresProof).url;
                    return !hasBusinessCert && !hasIdProof && !hasAddresProof && (
                    <DocumentItem>
                      <DocumentContent>
                        <DocumentLabel>No verification documents uploaded</DocumentLabel>
                      </DocumentContent>
                    </DocumentItem>
                    );
                  })()}
                </DocumentsGrid>
              </DocumentsSection>
            )}

            {/* Approve Verification Button */}
            {canApproveVerification && (
              <ActionSection>
                <ApproveButton
                  onClick={handleApproveVerification}
                  disabled={approveVerification.isLoading}
                >
                  {approveVerification.isLoading ? (
                    <>
                      <Spinner /> Processing...
                    </>
                  ) : (
                    <>
                      <FaCheck /> Approve Seller Verification
                    </>
                  )}
                </ApproveButton>
                <HelperText>
                  This seller has completed all required details and is ready for verification approval.
                </HelperText>
              </ActionSection>
            )}

            {/* Show message if seller is already verified */}
            {isSeller && isFullyVerified && (
              <ActionSection>
                <VerifiedBadge>
                  <FaCheckCircle /> Seller is Fully Verified
                  {selectedUser.verifiedBy && (
                    <VerifiedInfo>
                      Verified by admin on {selectedUser.verifiedAt ? new Date(selectedUser.verifiedAt).toLocaleDateString() : 'N/A'}
                    </VerifiedInfo>
                  )}
                </VerifiedBadge>
              </ActionSection>
            )}

            {/* Show message if seller is unverified/rejected */}
            {isSeller && selectedUser.verificationStatus === 'rejected' && (
              <ActionSection>
                <UnverifiedBadge>
                  <FaTimesCircle /> Seller Verification Rejected
                </UnverifiedBadge>
              </ActionSection>
            )}

            {/* Show message if seller is missing required details */}
            {isSeller && selectedUser.onboardingStage === 'pending_verification' && !hasAllRequiredDetails && (
              <ActionSection>
                <WarningText>
                  Seller is missing some required details. Please ensure all information is complete before approving.
                </WarningText>
              </ActionSection>
            )}
          </VerificationSection>
        )}
      </Content>
    </Container>
  );
};

export default UserDetail;

// Styled Components
const Container = styled.div`
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  color: #4361ee;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: all 0.3s;

  &:hover {
    background: #f8f9fa;
    border-color: #4361ee;
  }
`;

const TitleSection = styled.div`
  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #2b2d42;
  }

  p {
    margin: 0;
    color: #8d99ae;
    font-size: 1rem;
  }
`;

const Content = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
`;

const UserInfoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 25px;
  border-bottom: 1px solid #f0f2f5;
`;

const UserAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #4361ee;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 32px;
  flex-shrink: 0;
`;

const UserInfoText = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #2b2d42;
  margin-bottom: 8px;
`;

const UserEmail = styled.div`
  color: #8d99ae;
  font-size: 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UserPhone = styled.div`
  color: #8d99ae;
  font-size: 16px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UserRole = styled.div`
  display: flex;
  gap: 10px;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
`;

const DetailCard = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  transition: all 0.3s;

  &:hover {
    background: #f0f2f5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const DetailIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #4361ee20;
  color: #4361ee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

const DetailContent = styled.div`
  flex: 1;
`;

const DetailLabel = styled.div`
  color: #8d99ae;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const DetailValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #2b2d42;
`;

const RoleBadge = styled.span`
  display: inline-block;
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: ${({ role }) =>
    role === "admin"
      ? "#4CC9F020"
      : role === "seller"
      ? "#F8961E20"
      : "#4361EE20"};
  color: ${({ role }) =>
    role === "admin" ? "#4CC9F0" : role === "seller" ? "#F8961E" : "#4361EE"};
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: ${({ status }) =>
    status === "active"
      ? "#4CC9F020"
      : status === "pending"
      ? "#F8961E20"
      : "#F7258520"};
  color: ${({ status }) =>
    status === "active"
      ? "#4CC9F0"
      : status === "pending"
      ? "#F8961E"
      : "#F72585"};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #f72585;
  font-size: 1.1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
`;

const VerificationSection = styled.div`
  margin-top: 2rem;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
  color: #2b2d42;
  margin-bottom: 1.5rem;
  font-weight: 700;

  svg {
    color: #4361ee;
  }
`;

const VerificationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const VerificationItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    background: #f0f2f5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const VerificationIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: ${({ $verified }) => ($verified ? "#4CC9F020" : "#F7258520")};
  color: ${({ $verified }) => ($verified ? "#4CC9F0" : "#F72585")};
  flex-shrink: 0;
`;

const VerificationContent = styled.div`
  flex: 1;
`;

const VerificationLabel = styled.div`
  font-size: 14px;
  color: #8d99ae;
  margin-bottom: 5px;
  font-weight: 500;
`;

const VerificationStatus = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ $verified }) => ($verified ? "#4CC9F0" : "#F72585")};
`;

const DocumentsSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
`;

const DocumentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const DocumentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    background: #f0f2f5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const DocumentIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: #4361ee20;
  color: #4361ee;
  flex-shrink: 0;
`;

const DocumentContent = styled.div`
  flex: 1;
`;

const DocumentLabel = styled.div`
  font-size: 14px;
  color: #8d99ae;
  margin-bottom: 5px;
  font-weight: 500;
`;

const DocumentLink = styled.a`
  font-size: 16px;
  font-weight: 600;
  color: #4361ee;
  text-decoration: none;
  transition: all 0.3s;

  &:hover {
    color: #3a56d4;
    text-decoration: underline;
  }
`;

const SuccessBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1rem 1.5rem;
  background: #4CC9F020;
  color: #4CC9F0;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-weight: 500;
  position: relative;

  svg {
    flex-shrink: 0;
  }
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1rem 1.5rem;
  background: #F7258520;
  color: #F72585;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-weight: 500;
  position: relative;

  svg {
    flex-shrink: 0;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 24px;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s;

  &:hover {
    opacity: 1;
  }
`;

const ActionSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ApproveButton = styled.button`
  align-self: flex-start;
  min-width: 250px;
  padding: 12px 24px;
  background: #4361ee;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #3a56d4;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    font-size: 18px;
  }
`;

const HelperText = styled.p`
  color: #8d99ae;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
`;

const VerifiedBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 1rem 1.5rem;
  background: #4CC9F020;
  color: #4CC9F0;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  width: fit-content;

  svg {
    font-size: 20px;
  }
`;

const WarningText = styled.p`
  color: #F8961E;
  font-size: 14px;
  margin: 0;
  padding: 1rem;
  background: #F8961E20;
  border-radius: 8px;
  line-height: 1.5;
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const DocumentPreviewCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const DocumentPreviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1rem;
`;

const DocumentPreviewImage = styled.img`
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #e9ecef;
  transition: all 0.3s;

  &:hover {
    border-color: #4361ee;
    box-shadow: 0 2px 8px rgba(67, 97, 238, 0.2);
  }
`;

const DocumentActions = styled.div`
  margin-top: 1rem;
  display: flex;
  gap: 10px;
`;

const DocumentViewButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #4361ee;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;

  &:hover {
    background: #3a56d4;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
  }

  svg {
    font-size: 14px;
  }
`;

const DocumentStatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  margin-left: auto;
  background: ${props => 
    props.$status === 'verified' ? '#4CC9F020' : 
    props.$status === 'rejected' ? '#F7258520' : 
    '#F8961E20'};
  color: ${props => 
    props.$status === 'verified' ? '#4CC9F0' : 
    props.$status === 'rejected' ? '#F72585' : 
    '#F8961E'};

  svg {
    font-size: 14px;
  }
`;

const DocumentButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const DocumentApproveButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #4CC9F0;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #3ab8d4;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(76, 201, 240, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    font-size: 12px;
  }
`;

const DocumentRejectButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #F72585;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #d61a6f;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(247, 37, 133, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    font-size: 12px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const RejectButton = styled.button`
  align-self: flex-start;
  min-width: 200px;
  padding: 12px 24px;
  background: #F72585;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #d91a6b;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(247, 37, 133, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    font-size: 18px;
  }
`;

const UnverifiedBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 1rem 1.5rem;
  background: #F7258520;
  color: #F72585;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  width: fit-content;

  svg {
    font-size: 20px;
  }
`;

const VerificationSubtext = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
  font-weight: 400;
`;

const VerifiedInfo = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
  font-weight: 400;
`;

const DocumentModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;

  h3 {
    margin: 0;
    color: #2b2d42;
    font-size: 1.5rem;
  }
`;

const CloseModalButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #8d99ae;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;

  &:hover {
    background: #f8f9fa;
    color: #2b2d42;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalImage = styled.img`
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  display: block;
`;

const ModalActions = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const RejectReasonTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #4361ee;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
  }
`;

const CancelButton = styled.button`
  padding: 12px 24px;
  background: #f8f9fa;
  color: #2b2d42;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #e9ecef;
    border-color: #dee2e6;
  }
`;

