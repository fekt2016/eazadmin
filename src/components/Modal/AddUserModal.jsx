import { useState } from "react";
import { FaStore, FaTimes, FaUserAlt, FaUserShield } from "react-icons/fa";
import styled from "styled-components";

const AddUserModal = ({ onClose, onCreate }) => {
  const [activeTab, setActiveTab] = useState("user");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    shopName: "",
    category: "",
    adminRole: "admin",
    permissions: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const permissions = checked
        ? [...prev.permissions, value]
        : prev.permissions.filter((p) => p !== value);
      return { ...prev, permissions };
    });
  };

  const handleSubmit = () => {
    const userData = {
      ...formData,
      role: activeTab,
      status: "active",
    };
    onCreate(userData);
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <h2>Create New Account</h2>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <ModalTabs>
            <ModalTab
              active={activeTab === "user"}
              onClick={() => setActiveTab("user")}
            >
              <FaUserAlt /> User
            </ModalTab>
            <ModalTab
              active={activeTab === "seller"}
              onClick={() => setActiveTab("seller")}
            >
              <FaStore /> Seller
            </ModalTab>
            <ModalTab
              active={activeTab === "admin"}
              onClick={() => setActiveTab("admin")}
            >
              <FaUserShield /> Admin
            </ModalTab>
          </ModalTabs>

          <FormGroup>
            <Label>Full Name</Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
            />
          </FormGroup>

          <FormGroup>
            <Label>Email Address</Label>

            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
            />
          </FormGroup>

          <FormGroup>
            <Label>Password</Label>

            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create password"
            />
          </FormGroup>

          {activeTab === "seller" && (
            <FormGroup>
              <Label>Store Name</Label>
              <Input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                placeholder="Enter store name"
              />
            </FormGroup>
          )}

          {activeTab === "admin" && (
            <Form>
              <FormGroup>
                <Label>Admin Role</Label>
                <Select
                  name="adminRole"
                  value={formData.adminRole}
                  onChange={handleChange}
                >
                  <option value="admin">Administrator</option>
                  <option value="super">Super Administrator</option>
                  <option value="content">Content Admin</option>
                  <option value="support">Support Admin</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Permissions</Label>
                <CheckboxGroup>
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      value="user_management"
                      checked={formData.permissions.includes("user_management")}
                      onChange={handlePermissionChange}
                    />
                    User Management
                  </CheckboxLabel>

                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      value="content_management"
                      checked={formData.permissions.includes(
                        "content_management"
                      )}
                      onChange={handlePermissionChange}
                    />
                    Content Management
                  </CheckboxLabel>

                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      value="settings"
                      checked={formData.permissions.includes("settings")}
                      onChange={handlePermissionChange}
                    />
                    System Settings
                  </CheckboxLabel>

                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      value="analytics"
                      checked={formData.permissions.includes("analytics")}
                      onChange={handlePermissionChange}
                    />
                    Analytics & Reporting
                  </CheckboxLabel>
                </CheckboxGroup>
              </FormGroup>
            </Form>
          )}
        </ModalBody>
        <ModalFooter>
          <Button secondary onClick={onClose}>
            Cancel
          </Button>
          <Button primary onClick={handleSubmit}>
            Create Account
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

// Add these styled components at the bottom of your styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 1px solid #e9ecef;

  h2 {
    font-size: 24px;
    color: #2b2d42;
    margin: 0;
  }
`;
const Form = styled.form``;
const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #8d99ae;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #4361ee;
  }
`;

const ModalBody = styled.div`
  padding: 25px;
`;

const ModalTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 25px;
`;

const ModalTab = styled.div`
  padding: 12px 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  color: ${({ active }) => (active ? "#4361EE" : "#8D99AE")};
  border-bottom-color: ${({ active }) => (active ? "#4361EE" : "transparent")};
  transition: all 0.3s;

  &:hover {
    color: #4361ee;
  }
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
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  background: white;
  font-size: 14px;
  color: #2b2d42;
  transition: all 0.3s;

  &:focus {
    border-color: #4361ee;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
    outline: none;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  background: white;
  font-size: 14px;
  color: #2b2d42;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
  transition: all 0.3s;

  &:focus {
    border-color: #4361ee;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
    outline: none;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 10px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;

  input {
    margin: 0;
  }
`;

const ModalFooter = styled.div`
  padding: 20px 25px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
`;

const Button = styled.button`
  padding: 12px 25px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;

  ${({ primary }) =>
    primary &&
    `
    background: #4361ee;
    color: white;

    &:hover {
      background: #3a56d4;
    }
  `}

  ${({ secondary }) =>
    secondary &&
    `
    background: #f8f9fa;
    color: #2b2d42;

    &:hover {
      background: #e9ecef;
    }
  `}
`;

export default AddUserModal;
