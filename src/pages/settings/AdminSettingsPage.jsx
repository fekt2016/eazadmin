import { useState } from "react";
import styled from "styled-components";
import { useMutation } from "@tanstack/react-query";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import { authApi } from "../../shared/services/adminApi";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import {
  PageHeader,
  PageTitle,
  PageSub,
} from "../../shared/components/page/PageHeader";

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload) => authApi.updateMyPassword(payload),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirm("");
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Could not update password";
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !passwordConfirm) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== passwordConfirm) {
      toast.error("New password and confirmation do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    mutation.mutate({
      currentPassword,
      newPassword,
      passwordConfirm,
    });
  };

  return (
    <PageWrap>
      <PageHeader>
        <div>
          <PageTitle>Settings</PageTitle>
          <PageSub>Update your account password</PageSub>
        </div>
      </PageHeader>

      <Card>
        <CardTitle>
          <FaLock aria-hidden />
          Change password
        </CardTitle>
        <Hint>
          Use a strong password you do not use elsewhere. After a successful
          change, continue using this session or sign out when you are done.
        </Hint>

        <Form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="settings-current-password">Current password</Label>
            <InputRow>
              <Input
                id="settings-current-password"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <Toggle
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <FaEyeSlash /> : <FaEye />}
              </Toggle>
            </InputRow>
          </Field>

          <Field>
            <Label htmlFor="settings-new-password">New password</Label>
            <InputRow>
              <Input
                id="settings-new-password"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <Toggle
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </Toggle>
            </InputRow>
          </Field>

          <Field>
            <Label htmlFor="settings-confirm-password">Confirm new password</Label>
            <InputRow>
              <Input
                id="settings-confirm-password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Re-enter new password"
              />
              <Toggle
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirm ? "Hide confirmation" : "Show confirmation"
                }
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </Toggle>
            </InputRow>
          </Field>

          <SubmitRow>
            <SubmitButton
              type="submit"
              disabled={
                mutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !passwordConfirm
              }
            >
              {mutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" color="#ffffff" />
                  Updating…
                </>
              ) : (
                "Update password"
              )}
            </SubmitButton>
          </SubmitRow>
        </Form>
      </Card>
    </PageWrap>
  );
}

const PageWrap = styled.div`
  padding: 2rem;
  max-width: 640px;
  margin: 0 auto;
  min-height: 100%;
  background: var(--color-body-bg);
`;

const Card = styled.section`
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-xl);
  padding: 1.75rem;
  box-shadow: var(--shadow-sm);
`;

const CardTitle = styled.h2`
  margin: 0 0 1rem;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-grey-900);
`;

const Hint = styled.p`
  margin: 0 0 1.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-grey-600);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-grey-800);
`;

const InputRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 3rem 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  color: #1e293b;
  background: #f8fafc;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--color-primary-600);
    background: #fff;
  }
`;

const Toggle = styled.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.35rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--color-primary-600);
  }
`;

const SubmitRow = styled.div`
  margin-top: 0.5rem;
`;

const SubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary-600);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  min-width: 180px;

  &:hover:not(:disabled) {
    background: var(--color-primary-700);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;
