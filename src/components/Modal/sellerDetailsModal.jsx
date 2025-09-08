// import { useState } from "react";
import styled from "styled-components";
import useSellerAdmin from "../../hook/useSellerAdmin";

const SellerDetailsModal = ({ seller, onClose }) => {
  // console.log("Seller Details Modal:", seller);
  const { updateStatus } = useSellerAdmin();
  //   const [isUpdating, setIsUpdating] = useState(false);

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
        </DetailsSection>

        <ActionGroup>
          <ActionButton
            variant="success"
            onClick={() => handleStatusChange("active")}
            // disabled={isUpdating}
          >
            Approve
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={() => handleStatusChange("deactive")}
            // disabled={isUpdating}
          >
            Reject
          </ActionButton>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
        </ActionGroup>
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
  background: ${({ variant }) =>
    variant === "success"
      ? "#28a745"
      : variant === "danger"
      ? "#dc3545"
      : "#6c757d"};
  color: white;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  transition: background 0.2s;

  &:hover {
    background: ${({ variant }) =>
      variant === "success"
        ? "#218838"
        : variant === "danger"
        ? "#c82333"
        : "#5a6268"};
  }
`;

export default SellerDetailsModal;
