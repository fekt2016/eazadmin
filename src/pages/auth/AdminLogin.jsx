import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import useAuth from "../../shared/hooks/useAuth";
import Logo from "../../shared/components/Logo";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";

// Allowed admin roles
const ALLOWED_ROLES = ["superadmin", "admin", "moderator"];

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const emailInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [shake, setShake] = useState(false);

  // Auto-focus email field on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && formData.email && formData.password) {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error("Please enter both email and password");
      return;
    }

    try {
      const response = await login.mutateAsync({
        email: formData.email,
        password: formData.password,
      });

      // Check if user has allowed role
      const user = response.data?.user || response.data?.data?.user;
      const role = user?.role || "admin";

      if (!ALLOWED_ROLES.includes(role)) {
        toast.error("You are not authorized to access the admin system.");
        // SECURITY: Cookie-only authentication - no token to clear
        // Backend logout endpoint clears the cookie
        // Only clear non-sensitive role preference
        if (typeof window !== "undefined") {
          localStorage.removeItem("current_role");
        }
        return;
      }

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem("admin_remember_me", "true");
      } else {
        localStorage.removeItem("admin_remember_me");
      }

      toast.success("Login successful! Redirecting...");
      
      // Small delay for better UX
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    }
  };

  return (
    <LoginContainer>
      <LoginCard $shake={shake}>
        <LogoContainer>
          <Logo variant="default" />
        </LogoContainer>

        <WelcomeSection>
          <Title>EazAdmin Login</Title>
          <Subtitle>Sign in to manage your platform</Subtitle>
        </WelcomeSection>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <InputIcon>
              <FaEnvelope />
            </InputIcon>
            <Input
              ref={emailInputRef}
              type="email"
              id="email"
              name="email"
              placeholder="Email address"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              onKeyPress={handleKeyPress}
            />
          </InputGroup>

          <InputGroup>
            <InputIcon>
              <FaLock />
            </InputIcon>
            <Input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
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

          <OptionsRow>
            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <CheckboxLabel htmlFor="remember">Remember me</CheckboxLabel>
            </CheckboxGroup>
            <ForgotPasswordLink href="#" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </ForgotPasswordLink>
          </OptionsRow>

          <LoginButton
            type="submit"
            disabled={login.isPending || !formData.email || !formData.password}
            $isLoading={login.isPending}
          >
            {login.isPending ? (
              <>
                <LoadingSpinner size="sm" color="#ffffff" />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign in"
            )}
          </LoginButton>
        </Form>
      </LoginCard>

      <BackgroundDecoration />
    </LoginContainer>
  );
}

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.1); }
  50% { box-shadow: 0 0 30px rgba(37, 99, 235, 0.2); }
`;

// Styled Components
const LoginContainer = styled.div`
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
  background: radial-gradient(
    circle at 30% 30%,
    rgba(37, 99, 235, 0.05) 0%,
    transparent 50%
  );
  pointer-events: none;
  z-index: 0;
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
  animation: ${fadeIn} 0.6s ease-out;
  transition: all 0.3s ease;
  animation: ${(props) => (props.$shake ? shake : fadeIn)} 0.5s ease;

  &:hover {
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  animation: ${glow} 3s ease-in-out infinite;

  &:hover {
    animation: ${glow} 1s ease-in-out infinite;
  }
`;

const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #64748b;
  font-weight: 400;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  padding: 1rem 1rem 1rem 3rem;
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

  &::placeholder {
    color: #94a3b8;
  }

  &:hover:not(:focus) {
    border-color: #cbd5e1;
    background: white;
  }
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

  &:hover {
    color: #2563eb;
  }

  &:focus {
    outline: none;
    color: #2563eb;
  }
`;

const OptionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: #2563eb;
`;

const CheckboxLabel = styled.label`
  color: #64748b;
  cursor: pointer;
  user-select: none;
  font-weight: 400;
`;

const ForgotPasswordLink = styled.a`
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
`;

const LoginButton = styled.button`
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

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  span {
    display: inline-block;
  }
`;

