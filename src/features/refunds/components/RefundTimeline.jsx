import styled from 'styled-components';
import { FaCheckCircle, FaTimesCircle, FaClock, FaMoneyBillWave, FaUser, FaStore } from 'react-icons/fa';
import { formatDate } from '../../../shared/utils/helpers';

const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 0.8rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TimelineTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const TimelineItem = styled.div`
  display: flex;
  gap: 1.5rem;
  position: relative;
  padding-left: 3rem;

  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 1.1rem;
    top: 3rem;
    width: 2px;
    height: calc(100% + 1rem);
    background: #e5e7eb;
  }
`;

const TimelineIcon = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.$type) {
      case 'requested':
        return '#fef3c7';
      case 'approved':
        return '#d1fae5';
      case 'rejected':
        return '#fee2e2';
      case 'completed':
        return '#dbeafe';
      default:
        return '#e5e7eb';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'requested':
        return '#92400e';
      case 'approved':
        return '#065f46';
      case 'rejected':
        return '#991b1b';
      case 'completed':
        return '#1e40af';
      default:
        return '#374151';
    }
  }};
  z-index: 1;
`;

const TimelineContent = styled.div`
  flex: 1;
`;

const TimelineTitleText = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const TimelineDescription = styled.div`
  font-size: 1.4rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const TimelineDate = styled.div`
  font-size: 1.2rem;
  color: #9ca3af;
`;

const TimelineAmount = styled.span`
  font-weight: 700;
  color: #059669;
`;

function getIcon(type) {
  switch (type) {
    case 'requested':
      return <FaUser />;
    case 'approved':
      return <FaCheckCircle />;
    case 'rejected':
      return <FaTimesCircle />;
    case 'completed':
      return <FaMoneyBillWave />;
    case 'seller_response':
      return <FaStore />;
    default:
      return <FaClock />;
  }
}

export default function RefundTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <TimelineContainer>
        <TimelineTitle>Refund Timeline</TimelineTitle>
        <div style={{ color: '#6b7280', fontSize: '1.4rem' }}>No timeline events yet</div>
      </TimelineContainer>
    );
  }

  return (
    <TimelineContainer>
      <TimelineTitle>Refund Timeline</TimelineTitle>
      {timeline.map((event, index) => (
        <TimelineItem key={index}>
          <TimelineIcon $type={event.type || 'default'}>
            {getIcon(event.type)}
          </TimelineIcon>
          <TimelineContent>
            <TimelineTitleText>{event.title || event.message}</TimelineTitleText>
            {event.description && (
              <TimelineDescription>{event.description}</TimelineDescription>
            )}
            {event.amount && (
              <TimelineDescription>
                Amount: <TimelineAmount>GH₵{event.amount.toFixed(2)}</TimelineAmount>
              </TimelineDescription>
            )}
            <TimelineDate>
              {formatDate(event.timestamp || event.date || event.createdAt)}
            </TimelineDate>
          </TimelineContent>
        </TimelineItem>
      ))}
    </TimelineContainer>
  );
}

