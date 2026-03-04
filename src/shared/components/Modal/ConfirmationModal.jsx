// src/shared/components/Modal/ConfirmationModal.jsx
import styled from "styled-components";

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmation Required",
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmColor = "#ef4444",
}) => {
    if (!isOpen) return null;

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <h3>{title}</h3>
                    <CloseButton onClick={onClose}>×</CloseButton>
                </ModalHeader>
                <ModalBody>
                    <p>{message}</p>
                    <ButtonGroup>
                        <SecondaryButton onClick={onClose}>{cancelText}</SecondaryButton>
                        <ConfirmButton $confirmColor={confirmColor} onClick={onConfirm}>
                            {confirmText}
                        </ConfirmButton>
                    </ButtonGroup>
                </ModalBody>
            </ModalContainer>
        </ModalOverlay>
    );
};

export default ConfirmationModal;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 90%;
  max-width: 500px;
  padding: 24px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
`;

const ModalBody = styled.div`
  padding: 16px 0;

  p {
    margin-bottom: 24px;
    line-height: 1.5;
    font-size: 1rem;
    color: #4b5563;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    color: #1f2937;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const SecondaryButton = styled.button`
  padding: 10px 16px;
  background-color: white;
  color: #4b5563;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid #d1d5db;
  cursor: pointer;

  &:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
  }
`;

const ConfirmButton = styled.button`
  padding: 10px 16px;
  background-color: ${({ $confirmColor }) => $confirmColor};
  color: white;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;
