import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import styled from "styled-components";
import useAuth from '../../shared/hooks/useAuth';
import { PageTitle, PageSub } from '../../shared/components/page/PageHeader';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { resetPasswordWithToken } = useAuth();
  const { mutate: resetPassword, isPending, error } = resetPasswordWithToken;

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link. Please request a new password reset.');
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const validatePasswords = () => {
    if (state.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    if (state.newPassword !== state.confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid reset link. Please request a new password reset.');
      navigate("/forgot-password");
      return;
    }

    if (!validatePasswords()) return;

    try {
      await resetPassword(
        { token, newPassword: state.newPassword, confirmPassword: state.confirmPassword },
        {
          onSuccess: () => {
            setIsSuccess(true);
            toast.success('Password reset successfully!');
          },
        }
      );
    } catch {
      // errors surfaced via the `error` state from useMutation
    }
  };

  if (isSuccess) {
    return (
      <Container>
        <Card>
          <AuthCardHeader>
            <PageTitle>Password Reset Successful</PageTitle>
            <PageSub>Your password has been successfully reset. You can now log in with your new password.</PageSub>
          </AuthCardHeader>

          <SuccessMessage>
            <SuccessIcon>✓</SuccessIcon>
            <p>Your password has been successfully reset.</p>
          </SuccessMessage>

          <SubmitButton type="button" onClick={() => navigate("/login")}>
            Go to Login
          </SubmitButton>
        </Card>
      </Container>
    );
  }

  if (!token) {
    return (
      <Container>
        <Card>
          <AuthCardHeader>
            <PageTitle>Invalid Link</PageTitle>
            <PageSub>The reset link is invalid or has expired.</PageSub>
          </AuthCardHeader>
          <ErrorMessage>
            This password reset link is invalid or has expired. Please request a new one.
          </ErrorMessage>
          <SubmitButton type="button" onClick={() => navigate("/forgot-password")}>
            Request New Reset Link
          </SubmitButton>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <AuthCardHeader>
          <PageTitle>Set New Password</PageTitle>
          <PageSub>Please enter your new password. It must be at least 8 characters long.</PageSub>
        </AuthCardHeader>

        {error && (
          <ErrorMessage>
            {error.message || "Failed to reset password. The link may have expired. Please request a new one."}
          </ErrorMessage>
        )}
        {passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <FormLabel htmlFor="newPassword">New Password</FormLabel>
            <FormInput
              type="password"
              id="newPassword"
              name="newPassword"
              value={state.newPassword}
              onChange={(e) => {
                setState({ ...state, newPassword: e.target.value });
                if (passwordError) setPasswordError("");
              }}
              placeholder="••••••••"
              required
              minLength="8"
              autoFocus
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
            <FormInput
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={state.confirmPassword}
              onChange={(e) => {
                setState({ ...state, confirmPassword: e.target.value });
                if (passwordError) setPasswordError("");
              }}
              placeholder="••••••••"
              required
            />
          </FormGroup>

          <SubmitButton
            type="submit"
            disabled={isPending || !state.newPassword || !state.confirmPassword}
          >
            {isPending ? "Resetting..." : "Reset Password"}
          </SubmitButton>
        </Form>

        <SignupSection>
          <SignupText>Remember your password?</SignupText>
          <SignupLink to="/login">Back to Login</SignupLink>
        </SignupSection>
      </Card>
    </Container>
  );
}

// ─── Styled Components ───────────────────────────────────────

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-body-bg) 0%, var(--color-primary-100) 50%, var(--color-primary-50) 100%);
  padding: 1.25rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 1.25rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 450px;
  padding: 2.5rem;
  text-align: center;
`;

const AuthCardHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  text-align: left;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
  font-size: 0.875rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  background: #f8fafc;
  color: #1e293b;

  &:focus {
    outline: none;
    border-color: var(--color-primary-600);
    background: white;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-800) 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: #fcebeb;
  color: #a32d2d;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
  text-align: left;
`;

const SignupSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eaeaea;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

const SignupText = styled.span`
  color: #64748b;
  font-size: 0.875rem;
`;

const SignupLink = styled(Link)`
  color: var(--color-primary-600);
  font-weight: 500;
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    text-decoration: underline;
  }
`;

const SuccessMessage = styled.div`
  margin: 1.5rem 0;
  text-align: center;

  p {
    color: #1e293b;
    font-size: 0.9375rem;
    line-height: 1.6;
  }
`;

const SuccessIcon = styled.div`
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  background-color: #eaf3de;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #3b6d11;
  font-weight: bold;
`;
