import styled from "styled-components";

const UserDetailsModal = ({ selectedUser, setIsDetailsModalOpen }) => {
  if (!selectedUser) return null;

  // Determine user type
  const isSeller = selectedUser.role === "seller";
  const isAdmin = selectedUser.role === "admin";
  const isUser = selectedUser.role === "user";
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsDetailsModalOpen(false);
    }
  };
  // Prevent clicks inside modal from closing
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer onClick={handleModalClick}>
        <ModalHeader>
          <h3>{selectedUser.name}s Details</h3>
          <CloseButton onClick={() => setIsDetailsModalOpen(false)}>
            &times;
          </CloseButton>
        </ModalHeader>

        <ModalContent>
          <UserInfoSection>
            <UserAvatar>{selectedUser.name.charAt(0)}</UserAvatar>
            <UserInfoText>
              <UserName>{selectedUser.name}</UserName>
              <UserEmail>{selectedUser.email}</UserEmail>
              <UserRole>
                <RoleBadge role={selectedUser.role}>
                  {selectedUser.role}
                </RoleBadge>
                <StatusBadge status={selectedUser.status}>
                  {selectedUser.status}
                </StatusBadge>
              </UserRole>
            </UserInfoText>
          </UserInfoSection>

          <DetailsGrid>
            <DetailCard>
              <DetailLabel>Registration Date</DetailLabel>
              <DetailValue>
                {new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </DetailValue>
            </DetailCard>

            <DetailCard>
              <DetailLabel>Last Active</DetailLabel>
              <DetailValue>
                {selectedUser.lastLogin
                  ? new Date(selectedUser.lastLogin).toLocaleString()
                  : "Never logged in"}
              </DetailValue>
            </DetailCard>
            {isUser && (
              <DetailCard>
                <DetailLabel>Joined Date</DetailLabel>
                <DetailValue>
                  {new Date(selectedUser.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </DetailValue>
              </DetailCard>
            )}

            {isSeller && (
              <>
                <DetailCard>
                  <DetailLabel>Store Name</DetailLabel>
                  <DetailValue>{selectedUser.shopName || "-"}</DetailValue>
                </DetailCard>

                <DetailCard>
                  <DetailLabel>Total Orders</DetailLabel>
                  <DetailValue>{selectedUser.orders || 0}</DetailValue>
                </DetailCard>

                <DetailCard>
                  <DetailLabel>Total Revenue</DetailLabel>
                  <DetailValue>{selectedUser.revenue || "$0"}</DetailValue>
                </DetailCard>
              </>
            )}

            {isAdmin && (
              <DetailCard>
                <DetailLabel>Permissions Level</DetailLabel>
                <DetailValue>
                  {selectedUser.permissions || "Full Access"}
                </DetailValue>
              </DetailCard>
            )}
          </DetailsGrid>
        </ModalContent>

        <ModalFooter>
          <ModalButton onClick={() => setIsDetailsModalOpen(false)}>
            Close
          </ModalButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContainer = styled.div`
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
  padding: 20px;
  border-bottom: 1px solid #e9ecef;

  h3 {
    margin: 0;
    font-size: 22px;
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

  &:hover {
    background: #f5f7fb;
    color: #4361ee;
  }
`;

const ModalContent = styled.div`
  padding: 25px;
`;

const ModalFooter = styled.div`
  padding: 15px 25px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 12px 25px;
  background: #4361ee;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #3a56d4;
    transform: translateY(-2px);
  }
`;

// User info styles
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
  margin-bottom: 5px;
`;

const UserEmail = styled.div`
  color: #8d99ae;
  font-size: 16px;
  margin-bottom: 15px;
`;

const UserRole = styled.div`
  display: flex;
  gap: 10px;
`;

// Detail styles
const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

const DetailCard = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
`;

const DetailLabel = styled.div`
  color: #8d99ae;
  font-size: 14px;
  margin-bottom: 8px;
`;

const DetailValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #2b2d42;
`;

// Badge styles
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

export default UserDetailsModal;
