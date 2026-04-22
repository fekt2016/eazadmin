import { useEffect, useState } from "react";
import { FaStore, FaTimes, FaUserAlt, FaUserShield } from "react-icons/fa";
import styled from "styled-components";
import { toast } from "react-toastify";

const ADMIN_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Superadmin" },
  { value: "support_agent", label: "Support Agent" },
];

/**
 * @param {object} props
 * @param {() => void} props.onClose
 * @param {(payload: { accountType: 'user'|'seller'|'admin'; name: string; email: string; shopName?: string; role?: string; referral: string }) => Promise<void>} props.onSubmit
 * @param {string} [props.defaultReferral]
 * @param {boolean} [props.canCreateAdmin]
 * @param {'user'|'seller'|'admin'} [props.initialAccountType]
 */
const AddUserModal = ({
  onClose,
  onSubmit,
  defaultReferral = "",
  canCreateAdmin = false,
  initialAccountType = "user",
}) => {
  const [activeTab, setActiveTab] = useState(initialAccountType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    shopName: "",
    adminRole: "admin",
    referral: defaultReferral,
  });

  useEffect(() => {
    setActiveTab(initialAccountType);
  }, [initialAccountType]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, referral: defaultReferral }));
  }, [defaultReferral]);

  useEffect(() => {
    if (activeTab === "admin" && !canCreateAdmin) {
      setActiveTab("user");
    }
  }, [activeTab, canCreateAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    if (activeTab === "seller" && !formData.shopName.trim()) {
      toast.error("Store name is required for sellers");
      return;
    }
    if (activeTab === "admin" && !canCreateAdmin) {
      toast.error("Only a superadmin can create admin accounts");
      return;
    }

    const payload = {
      accountType: activeTab,
      name,
      email,
      referral: formData.referral.trim(),
    };
    if (activeTab === "seller") {
      payload.shopName = formData.shopName.trim();
    }
    if (activeTab === "admin") {
      payload.role = formData.adminRole;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch {
      // Parent / API layer surfaces errors
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay role="presentation" onClick={onClose}>
      <ModalContainer
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader>
          <h2 id="add-user-modal-title">Create New Account</h2>
          <CloseButton type="button" onClick={onClose} aria-label="Close">
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <ModalTabs>
            <ModalTab
              $active={activeTab === "user"}
              onClick={() => setActiveTab("user")}
              type="button"
            >
              <FaUserAlt /> User
            </ModalTab>
            <ModalTab
              $active={activeTab === "seller"}
              onClick={() => setActiveTab("seller")}
              type="button"
            >
              <FaStore /> Seller
            </ModalTab>
            {canCreateAdmin && (
              <ModalTab
                $active={activeTab === "admin"}
                onClick={() => setActiveTab("admin")}
                type="button"
              >
                <FaUserShield /> Admin
              </ModalTab>
            )}
          </ModalTabs>

          <Hint>
            A secure password is generated on the server and emailed to this
            address. It is not shown in the admin panel. Ask them to change it
            after first sign-in.
          </Hint>

          <FormGroup>
            <Label htmlFor="add-user-name">Full Name</Label>
            <Input
              id="add-user-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              autoComplete="name"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="add-user-email">Email Address</Label>
            <Input
              id="add-user-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              autoComplete="email"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="add-user-referral">Referral</Label>
            <Input
              id="add-user-referral"
              type="text"
              name="referral"
              value={formData.referral}
              onChange={handleChange}
              placeholder="Referring admin or note"
              autoComplete="off"
            />
          </FormGroup>

          {activeTab === "seller" && (
            <FormGroup>
              <Label htmlFor="add-user-shop">Store Name</Label>
              <Input
                id="add-user-shop"
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                placeholder="Enter store name"
                autoComplete="organization"
              />
            </FormGroup>
          )}

          {activeTab === "admin" && canCreateAdmin && (
            <FormGroup>
              <Label htmlFor="add-user-admin-role">Admin Role</Label>
              <Select
                id="add-user-admin-role"
                name="adminRole"
                value={formData.adminRole}
                onChange={handleChange}
              >
                {ADMIN_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="button" $secondary onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            $primary
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create Account"}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

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

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #8d99ae;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #bb6c02;
  }
`;

const ModalBody = styled.div`
  padding: 25px;
`;

const Hint = styled.p`
  margin: 0 0 20px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
`;

const ModalTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 25px;
`;

const ModalTab = styled.button`
  flex: 1;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  border: none;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: ${({ $active }) => ($active ? "#bb6c02" : "#8D99AE")};
  border-bottom-color: ${({ $active }) =>
    $active ? "#bb6c02" : "transparent"};
  transition: all 0.3s;

  &:hover {
    color: #bb6c02;
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
  box-sizing: border-box;

  &:focus {
    border-color: #bb6c02;
    box-shadow: 0 0 0 3px rgba(187, 108, 2, 0.1);
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
  box-sizing: border-box;

  &:focus {
    border-color: #bb6c02;
    box-shadow: 0 0 0 3px rgba(187, 108, 2, 0.1);
    outline: none;
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

  ${({ $primary }) =>
    $primary &&
    `
    background: #bb6c02;
    color: white;

    &:hover:not(:disabled) {
      background: #9a5a02;
    }
  `}

  ${({ $secondary }) =>
    $secondary &&
    `
    background: #f8f9fa;
    color: #2b2d42;

    &:hover:not(:disabled) {
      background: #e9ecef;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default AddUserModal;
