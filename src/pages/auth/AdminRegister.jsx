import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser, FaShieldAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import useAuth from "../../shared/hooks/useAuth";
import Logo from "../../shared/components/Logo";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";

const ROLE_OPTIONS = [
    { value: "admin", label: "Admin", description: "Full platform management access" },
    { value: "superadmin", label: "Super Admin", description: "Unrestricted access to all features" },
    { value: "moderator", label: "Moderator", description: "Content review and moderation" },
];

export default function AdminRegister() {
    const navigate = useNavigate();
    const { register: registerMutation } = useAuth();
    const nameInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        passwordConfirm: "",
        role: "admin",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        nameInputRef.current?.focus();
    }, []);

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && formData.name && formData.email && formData.password && formData.passwordConfirm) {
            handleSubmit(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.password || !formData.passwordConfirm) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            toast.error("Please fill in all fields");
            return;
        }

        if (formData.password !== formData.passwordConfirm) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            toast.error("Passwords do not match");
            return;
        }

        if (formData.password.length < 8) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            toast.error("Password must be at least 8 characters");
            return;
        }

        try {
            await registerMutation.mutateAsync(formData);
            toast.success("Admin account created! Redirecting...");
            setTimeout(() => {
                navigate("/dashboard");
            }, 500);
        } catch (error) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Registration failed. Please try again.";
            toast.error(errorMessage);
        }
    };

    return (
        <RegisterContainer>
            <RegisterCard $shake={shake}>
                <LogoContainer>
                    <Logo variant="default" />
                </LogoContainer>

                <WelcomeSection>
                    <Title>Create Admin Account</Title>
                    <Subtitle>Set up a new admin for the platform</Subtitle>
                </WelcomeSection>

                <Form onSubmit={handleSubmit}>
                    {/* Name */}
                    <InputGroup>
                        <InputIcon><FaUser /></InputIcon>
                        <Input
                            ref={nameInputRef}
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Full name"
                            autoComplete="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            onKeyPress={handleKeyPress}
                        />
                    </InputGroup>

                    {/* Email */}
                    <InputGroup>
                        <InputIcon><FaEnvelope /></InputIcon>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Email address"
                            autoComplete="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            onKeyPress={handleKeyPress}
                        />
                    </InputGroup>

                    {/* Role */}
                    <InputGroup>
                        <InputIcon><FaShieldAlt /></InputIcon>
                        <Select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label} — {opt.description}
                                </option>
                            ))}
                        </Select>
                    </InputGroup>

                    {/* Password */}
                    <InputGroup>
                        <InputIcon><FaLock /></InputIcon>
                        <Input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            placeholder="Password (min. 8 characters)"
                            autoComplete="new-password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            onKeyPress={handleKeyPress}
                            style={{ paddingRight: "3rem" }}
                        />
                        <PasswordToggle
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </PasswordToggle>
                    </InputGroup>

                    {/* Confirm Password */}
                    <InputGroup>
                        <InputIcon><FaLock /></InputIcon>
                        <Input
                            type={showConfirm ? "text" : "password"}
                            id="passwordConfirm"
                            name="passwordConfirm"
                            placeholder="Confirm password"
                            autoComplete="new-password"
                            required
                            value={formData.passwordConfirm}
                            onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                            onKeyPress={handleKeyPress}
                            style={{ paddingRight: "3rem" }}
                        />
                        <PasswordToggle
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            aria-label={showConfirm ? "Hide password" : "Show password"}
                        >
                            {showConfirm ? <FaEyeSlash /> : <FaEye />}
                        </PasswordToggle>
                    </InputGroup>

                    <SubmitButton
                        type="submit"
                        disabled={registerMutation.isPending || !formData.name || !formData.email || !formData.password || !formData.passwordConfirm}
                        $isLoading={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? (
                            <>
                                <LoadingSpinner size="sm" color="#ffffff" />
                                <span>Creating account...</span>
                            </>
                        ) : (
                            "Create Admin Account"
                        )}
                    </SubmitButton>

                    <LoginLink>
                        Already have an account?{" "}
                        <Link to="/login">Sign in instead</Link>
                    </LoginLink>
                </Form>
            </RegisterCard>

            <BackgroundDecoration />
        </RegisterContainer>
    );
}

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shakeAnim = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
`;

// Styled Components
const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #eef2ff 0%, #f7faff 50%, #f0f9ff 100%);
  position: relative;
  overflow: hidden;
`;

const BackgroundDecoration = styled.div`
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 30%, rgba(37, 99, 235, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
`;

const RegisterCard = styled.div`
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 20px;
  padding: 2.5rem 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
  animation: ${(props) => (props.$shake ? shakeAnim : fadeIn)} 0.5s ease;

  @media (max-width: 640px) {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #64748b;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  font-size: 1.125rem;
  z-index: 1;
  pointer-events: none;
  transition: color 0.2s ease;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 3rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2563eb;
    background: white;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  }

  &::placeholder { color: #94a3b8; }
  &:hover:not(:focus) { border-color: #cbd5e1; background: white; }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 3rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  color: #1e293b;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8.825L.75 3.575 1.8 2.525 6 6.725 10.2 2.525 11.25 3.575z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;

  &:focus {
    outline: none;
    border-color: #2563eb;
    background-color: white;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  }

  &:hover:not(:focus) { border-color: #cbd5e1; background-color: white; }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  z-index: 1;

  &:hover { color: #2563eb; }
  &:focus { outline: none; color: #2563eb; }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  }

  &:active:not(:disabled) { transform: translateY(0) scale(0.98); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  span { display: inline-block; }
`;

const LoginLink = styled.p`
  text-align: center;
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.25rem;

  a {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
    &:hover { color: #1d4ed8; text-decoration: underline; }
  }
`;
