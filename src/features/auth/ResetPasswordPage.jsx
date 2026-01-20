import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import useAuth from '../../shared/hooks/useAuth';
import './ForgotPasswordPage.css';

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

  // Check if token exists in URL
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

    if (!validatePasswords()) {
      return;
    }

    try {
      await resetPassword(
        {
          token,
          newPassword: state.newPassword,
          confirmPassword: state.confirmPassword,
        },
        {
          onSuccess: (data) => {
            console.log("Password reset successful:", data);
            setIsSuccess(true);
            toast.success('Password reset successfully!');
            // Navigation is handled by the mutation's onSuccess
          },
          onError: (error) => {
            console.error("Error resetting password:", error);
          },
        }
      );
    } catch (err) {
      console.error("Password reset error:", err);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <h1>Password Reset Successful</h1>
            <p className="subtitle">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>

          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>Your password has been successfully reset.</p>
          </div>

          <button
            className="submit-button"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // No token state
  if (!token) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <h1>Invalid Link</h1>
            <p className="subtitle">
              The reset link is invalid or has expired.
            </p>
          </div>

          <div className="error-message">
            This password reset link is invalid or has expired. Please request a new one.
          </div>

          <button
            className="submit-button"
            onClick={() => navigate("/forgot-password")}
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Set New Password</h1>
          <p className="subtitle">
            Please enter your new password. It must be at least 8 characters long.
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error.message || "Failed to reset password. The link may have expired. Please request a new one."}
          </div>
        )}
        {passwordError && <div className="error-message">{passwordError}</div>}

        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">
              New Password
            </label>
            <input
              className="form-input"
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
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              className="form-input"
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
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={
              isPending ||
              !state.newPassword ||
              !state.confirmPassword
            }
          >
            {isPending ? "Resetting..." : "Reset Password"}
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


