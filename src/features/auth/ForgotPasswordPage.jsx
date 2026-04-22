import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styled from "styled-components";
import useAuth from '../../shared/hooks/useAuth';
import { PageTitle, PageSub } from '../../shared/components/page/PageHeader';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { requestPasswordReset } = useAuth();
  const { mutate: requestReset, isPending, error } = requestPasswordReset;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await requestReset(normalizedEmail, {
        onSuccess: () => {
          setIsSubmitted(true);
          toast.success('If an account exists, a reset email has been sent.');
        },
      });
    } catch {
      // errors surfaced via the `error` state from useMutation
    }
  };

  if (isSubmitted) {
    return (
      <Container>
        <Card>
          <AuthCardHeader>
            <PageTitle>Check Your Email</PageTitle>
            <PageSub>We&apos;ve sent password reset instructions to your inbox.</PageSub>
          </AuthCardHeader>

          <SuccessMessage>
            <SuccessIcon>✓</SuccessIcon>
            <p>
              If an account exists with <strong>{email}</strong>, we've sent password reset instructions.
            </p>
            <InfoBox>
              <p><strong>What's next?</strong></p>
              <ul>
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the reset link in the email</li>
                <li>The link expires in 10 minutes</li>
              </ul>
            </InfoBox>
          </SuccessMessage>

          <SubmitButton type="button" onClick={() => navigate("/login")}>
            Back to Login
          </SubmitButton>

          <ResendLink type="button" onClick={() => setIsSubmitted(false)}>
            Didn't receive the email? Try again
          </ResendLink>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <AuthCardHeader>
          <PageTitle>Reset Your Password</PageTitle>
          <PageSub>Enter your email to receive password reset instructions</PageSub>
        </AuthCardHeader>

        {error && (
          <ErrorMessage>
            {error.message || "Failed to send reset email. Please try again."}
          </ErrorMessage>
        )}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <FormLabel htmlFor="email">Email Address</FormLabel>
            <FormInput
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              autoFocus
            />
          </FormGroup>

          <SubmitButton type="submit" disabled={isPending || !email.trim()}>
            {isPending ? "Sending..." : "Send Reset Link"}
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

const InfoBox = styled.div`
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  text-align: left;

  p {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #1e293b;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 0.375rem 0 0.375rem 1.25rem;
    position: relative;
    color: #64748b;
    font-size: 0.875rem;

    &::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #3b6d11;
      font-weight: bold;
    }
  }
`;

const ResendLink = styled.button`
  background: none;
  border: none;
  color: var(--color-primary-600);
  font-weight: 500;
  cursor: pointer;
  padding: 0.75rem 0;
  font-size: 0.875rem;
  margin-top: 1rem;
  width: 100%;
  transition: color 0.2s;

  &:hover {
    color: var(--color-primary-700);
    text-decoration: underline;
  }
`;
