import styled from 'styled-components';

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.6rem;
  font-size: 1.3rem;
  font-weight: 600;
  text-transform: capitalize;
  background: ${props => {
    switch (props.$status) {
      case 'pending':
        return '#fef3c7'; // yellow-100
      case 'approved':
        return '#d1fae5'; // green-100
      case 'rejected':
        return '#fee2e2'; // red-100
      case 'completed':
        return '#dbeafe'; // blue-100
      case 'processing':
        return '#e0e7ff'; // indigo-100
      default:
        return '#e5e7eb'; // gray-100
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'pending':
        return '#92400e'; // yellow-800
      case 'approved':
        return '#065f46'; // green-800
      case 'rejected':
        return '#991b1b'; // red-800
      case 'completed':
        return '#1e40af'; // blue-800
      case 'processing':
        return '#3730a3'; // indigo-800
      default:
        return '#374151'; // gray-800
    }
  }};
`;

export default function RefundStatusBadge({ status }) {
  return <StatusBadge $status={status}>{status || 'Unknown'}</StatusBadge>;
}

