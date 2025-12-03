import { useState } from 'react';
import styled from 'styled-components';
import { FaCheckCircle, FaTimesCircle, FaPercent } from 'react-icons/fa';
import { useApproveRefund, useApprovePartialRefund, useRejectRefund } from '../hooks/useAdminRefunds';

const ActionPanelContainer = styled.div`
  background: white;
  border-radius: 0.8rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const PanelTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 1.4rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.6rem;
  font-size: 1.4rem;
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.6rem;
  font-size: 1.4rem;
  min-height: 100px;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
`;

const Checkbox = styled.input`
  width: 1.8rem;
  height: 1.8rem;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 1.4rem;
  color: #374151;
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 1.2rem 2rem;
  border: none;
  border-radius: 0.6rem;
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  ${props => props.$variant === 'approve' && `
    background: #10b981;
    color: white;
    &:hover:not(:disabled) {
      background: #059669;
    }
  `}
  ${props => props.$variant === 'partial' && `
    background: #6366f1;
    color: white;
    &:hover:not(:disabled) {
      background: #4f46e5;
    }
  `}
  ${props => props.$variant === 'reject' && `
    background: #ef4444;
    color: white;
    &:hover:not(:disabled) {
      background: #dc2626;
    }
  `}
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function RefundActionPanel({ refund }) {
  const [finalAmount, setFinalAmount] = useState(refund?.refundAmount || refund?.totalPrice || 0);
  const [requireReturn, setRequireReturn] = useState(false);
  const [adminNotes, setAdminNotes] = useState(refund?.adminNotes || '');

  const approveRefund = useApproveRefund();
  const approvePartialRefund = useApprovePartialRefund();
  const rejectRefund = useRejectRefund();

  const isPending = refund?.refundStatus === 'pending';
  const isApproved = refund?.refundStatus === 'approved' || refund?.refundStatus === 'completed';
  const isRejected = refund?.refundStatus === 'rejected';
  const requestedAmount = refund?.refundAmount || refund?.totalPrice || 0;

  const handleApproveFull = () => {
    approveRefund.mutate({
      refundId: refund._id || refund.orderId,
      data: {
        notes: adminNotes,
        requireReturn,
      },
    });
  };

  const handleApprovePartial = () => {
    if (finalAmount <= 0 || finalAmount > requestedAmount) {
      alert('Invalid refund amount. Must be between 0 and requested amount.');
      return;
    }
    approvePartialRefund.mutate({
      refundId: refund._id || refund.orderId,
      data: {
        amount: finalAmount,
        notes: adminNotes,
        requireReturn,
      },
    });
  };

  const handleReject = () => {
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    if (!window.confirm('Are you sure you want to reject this refund request?')) {
      return;
    }
    rejectRefund.mutate({
      refundId: refund._id || refund.orderId,
      data: {
        reason: adminNotes,
        notes: adminNotes,
      },
    });
  };

  return (
    <ActionPanelContainer>
      <PanelTitle>Admin Actions</PanelTitle>

      <FormGroup>
        <Label>Final Refund Amount (GH₵)</Label>
        <Input
          type="number"
          value={finalAmount}
          onChange={(e) => setFinalAmount(parseFloat(e.target.value) || 0)}
          min="0"
          max={requestedAmount}
          step="0.01"
          disabled={!isPending}
        />
        <div style={{ fontSize: '1.2rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Requested: GH₵{requestedAmount.toFixed(2)}
        </div>
      </FormGroup>

      <CheckboxGroup>
        <Checkbox
          type="checkbox"
          id="requireReturn"
          checked={requireReturn}
          onChange={(e) => setRequireReturn(e.target.checked)}
          disabled={!isPending}
        />
        <CheckboxLabel htmlFor="requireReturn">Require item return</CheckboxLabel>
      </CheckboxGroup>

      <FormGroup>
        <Label>Admin Notes</Label>
        <TextArea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add internal notes about this refund..."
        />
      </FormGroup>

      <ButtonGroup>
        <Button
          $variant="approve"
          onClick={handleApproveFull}
          disabled={!isPending || approveRefund.isPending}
        >
          <FaCheckCircle />
          {approveRefund.isPending ? 'Approving...' : 'Approve Full Refund'}
        </Button>

        <Button
          $variant="partial"
          onClick={handleApprovePartial}
          disabled={!isPending || approvePartialRefund.isPending || finalAmount <= 0 || finalAmount >= requestedAmount}
        >
          <FaPercent />
          {approvePartialRefund.isPending ? 'Approving...' : `Approve Partial (GH₵${finalAmount.toFixed(2)})`}
        </Button>

        <Button
          $variant="reject"
          onClick={handleReject}
          disabled={!isPending || isRejected || rejectRefund.isPending}
        >
          <FaTimesCircle />
          {rejectRefund.isPending ? 'Rejecting...' : 'Reject Refund'}
        </Button>
      </ButtonGroup>
    </ActionPanelContainer>
  );
}

