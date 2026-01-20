import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuth from '../../shared/hooks/useAuth';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { requestPasswordReset } = useAuth();
  const { mutate: requestReset, isPending, error } = requestPasswordReset;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await requestReset(normalizedEmail, {
        onSuccess: (data) => {
          console.log("Password reset request sent:", data);
          setIsSubmitted(true);
          toast.success('If an account exists, a reset email has been sent.');
        },
        onError: (error) => {
          console.error("Error requesting password reset:", error);
        },
      });
    } catch (err) {
      console.error("Password reset request error:", err);
    }
  };

  // Success state - show confirmation message
  if (isSubmitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <h1>Check Your Email</h1>
            <p className="subtitle">
              We've sent password reset instructions to your inbox.
            </p>
          </div>

          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>
              If an account exists with <strong>{email}</strong>, we've sent password reset instructions.
            </p>
            <div className="info-box">
              <p><strong>What's next?</strong></p>
              <ul>
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the reset link in the email</li>
                <li>The link expires in 10 minutes</li>
              </ul>
            </div>
          </div>

          <button
            className="submit-button"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>

          <button
            className="resend-link"
            onClick={() => setIsSubmitted(false)}
          >
            Didn't receive the email? Try again
          </button>
        </div>
      </div>
    );
  }

  // Form state - show email input
  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Reset Your Password</h1>
          <p className="subtitle">
            Enter your email to receive password reset instructions
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error.message || "Failed to send reset email. Please try again."}
          </div>
        )}

        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              className="form-input"
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isPending || !email.trim()}
          >
            {isPending ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="signup-section">
          <span className="signup-text">Remember your password?</span>
          <Link className="signup-link" to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}


