import { useEffect, useState } from "react";
import styled from "styled-components";
import useSellerAdmin from '../../hooks/useSellerAdmin';

const EditUserModal = ({ user, onClose }) => {
  const [formData, setFormData] = useState(user || {});
  const { updateSeller } = useSellerAdmin();

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSeller.mutateAsync({ id: formData.id, data: formData });
      onClose();
    } catch (error) {
      console.error('Error updating seller:', error);
      // Optionally show error message to user
    }
  };

  if (!user) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>Edit {user.name}</h3>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalContent>
            <FormGroup>
              <Label>Full Name</Label>
              <Input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Status</Label>
              <Select
                name="status"
                value={formData.status || "active"}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </Select>
            </FormGroup>

            {/* Seller-specific fields */}
            {user.role === "seller" && (
              <>
                <FormGroup>
                  <Label>Store Name</Label>
                  <Input
                    type="text"
                    name="shopName"
                    value={formData.shopName || ""}
                    onChange={handleChange}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Total Orders</Label>
                  <Input
                    type="number"
                    name="orders"
                    value={formData.orders || 0}
                    onChange={handleChange}
                    min="0"
                  />
                </FormGroup>
              </>
            )}

            {/* Admin-specific fields */}
            {user.role === "admin" && (
              <FormGroup>
                <Label>Permissions Level</Label>
                <Select
                  name="permissions"
                  value={formData.permissions || "full"}
                  onChange={handleChange}
                >
                  <option value="full">Full Access</option>
                  <option value="content">Content Management</option>
                  <option value="reports">Reports Only</option>
                </Select>
              </FormGroup>
            )}
          </ModalContent>

          <ModalFooter>
            <SecondaryButton type="button" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">Save Changes</PrimaryButton>
          </ModalFooter>
        </form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default EditUserModal;

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

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2b2d42;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  color: #2b2d42;

  &:focus {
    border-color: #4361ee;
    outline: none;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  color: #2b2d42;

  &:focus {
    border-color: #4361ee;
    outline: none;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
  }
`;

const PrimaryButton = styled.button`
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

const SecondaryButton = styled.button`
  padding: 12px 25px;
  background: #f8f9fa;
  color: #4361ee;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #f1f3f9;
  }
`;
