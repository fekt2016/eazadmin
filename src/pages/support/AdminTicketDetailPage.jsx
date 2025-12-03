import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaPaperclip,
  FaSpinner,
  FaUser,
  FaUserShield,
  FaStore,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';
import styled from 'styled-components';
import {
  useTicketDetail,
  useReplyToTicket,
  useUpdateTicketStatus,
} from '../../shared/hooks/useSupport';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../features/support/supportTypes';
import { PATHS } from '../../routes/routhPath';

const Container = styled.div`
  max-width: 120rem;
  margin: 0 auto;
  padding: 3rem 2rem;
  min-height: 100vh;
  background: #fafbfc;
`;

const BackButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 0.8rem 1.6rem;
  border-radius: 0.8rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 2.4rem;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3B82F6;
    color: #3B82F6;
  }
`;

const TicketHeader = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1.2rem;
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const TicketTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 1.6rem 0;
`;

const TicketMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.6rem;
  margin-bottom: 2.4rem;
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const MetaLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetaValue = styled.span`
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1a202c;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  background: ${props => props.$bgColor || '#e2e8f0'};
  color: ${props => props.$color || '#1a202c'};
  width: fit-content;
`;

const AdminControls = styled.div`
  display: flex;
  gap: 1.6rem;
  flex-wrap: wrap;
  padding-top: 2.4rem;
  border-top: 1px solid #e2e8f0;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-width: 20rem;
  flex: 1;
`;

const ControlLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a202c;
`;

const ControlSelect = styled.select`
  padding: 0.8rem 1.2rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.8rem;
  font-size: 1rem;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const MessagesContainer = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1.2rem;
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const MessagesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2.4rem;
`;

const MessageBubble = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: ${props => props.$isAdmin ? 'flex-end' : 'flex-start'};
`;

const MessageContent = styled.div`
  max-width: 70%;
  padding: 1.2rem 1.6rem;
  border-radius: 1.2rem;
  background: ${props => {
    if (props.$isAdmin) return '#3B82F6';
    if (props.$isInternal) return '#FEF3C7';
    return '#f1f5f9';
  }};
  color: ${props => {
    if (props.$isAdmin) return '#ffffff';
    if (props.$isInternal) return '#92400E';
    return '#1a202c';
  }};
  font-size: 0.9375rem;
  line-height: 1.6;
  border: ${props => props.$isInternal ? '1px solid #FCD34D' : 'none'};
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.4rem;
`;

const MessageTime = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
`;

const ReplyForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding-top: 2.4rem;
  border-top: 1px solid #e2e8f0;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 12rem;
  padding: 1.2rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.8rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 1.2rem;
  align-items: center;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
`;

const SubmitButton = styled(motion.button)`
  background: #3B82F6;
  color: #ffffff;
  border: none;
  padding: 1.2rem 2.4rem;
  border-radius: 0.8rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  
  &:hover:not(:disabled) {
    background: #2563EB;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const UpdateButton = styled(motion.button)`
  background: #10B981;
  color: #ffffff;
  border: none;
  padding: 0.8rem 1.6rem;
  border-radius: 0.8rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 6rem 2rem;
  color: #64748b;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 6rem 2rem;
  background: #ffffff;
  border-radius: 1.2rem;
  border: 1px solid #e2e8f0;
`;

/**
 * Admin Ticket Detail Page
 */
const AdminTicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [department, setDepartment] = useState('');

  const { data, isLoading, error } = useTicketDetail(id);
  const replyMutation = useReplyToTicket();
  const updateStatusMutation = useUpdateTicketStatus();

  const ticket = data?.data?.ticket;
  const messages = data?.data?.messages || [];

  // Initialize form values when ticket loads
  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setPriority(ticket.priority);
      setDepartment(ticket.department);
    }
  }, [ticket]);

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      await replyMutation.mutateAsync({
        ticketId: id,
        replyData: {
          message: replyMessage,
          isInternal: isInternalNote,
        },
      });
      setReplyMessage('');
      setIsInternalNote(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateStatus = async () => {
    if (!status || !priority || !department) {
      alert('Please fill all fields before updating');
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        ticketId: id,
        updateData: {
          status,
          priority,
          department,
        },
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const colors = STATUS_COLORS[status] || '#6B7280';
    return (
      <Badge $bgColor={`${colors}15`} $color={colors}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = PRIORITY_COLORS[priority] || '#6B7280';
    return (
      <Badge $bgColor={`${colors}15`} $color={colors}>
        {priority}
      </Badge>
    );
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'buyer':
        return <FaUser />;
      case 'seller':
        return <FaStore />;
      case 'admin':
        return <FaUserShield />;
      default:
        return <FaUser />;
    }
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingState>Loading ticket...</LoadingState>
      </Container>
    );
  }

  if (error || !ticket) {
    return (
      <Container>
        <ErrorState>
          <h3>Ticket not found</h3>
          <p>The ticket you're looking for doesn't exist.</p>
        </ErrorState>
      </Container>
    );
  }

  const hasChanges = 
    status !== ticket.status ||
    priority !== ticket.priority ||
    department !== ticket.department;

  return (
    <Container>
      <BackButton
        onClick={() => navigate(`/dashboard/${PATHS.SUPPORT_TICKETS}`)}
        whileHover={{ x: -4 }}
        transition={{ duration: 0.2 }}
      >
        <FaArrowLeft />
        Back to Tickets
      </BackButton>

      <TicketHeader>
        <TicketTitle>{ticket.title}</TicketTitle>
        <TicketMeta>
          <MetaItem>
            <MetaLabel>Ticket Number</MetaLabel>
            <MetaValue>{ticket.ticketNumber}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>User</MetaLabel>
            <MetaValue>
              {getRoleIcon(ticket.role)}
              {' '}
              {ticket.userId?.name || ticket.userId?.email || 'Unknown User'}
            </MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Role</MetaLabel>
            <MetaValue>{ticket.role}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Created</MetaLabel>
            <MetaValue>{formatDate(ticket.createdAt)}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Last Updated</MetaLabel>
            <MetaValue>{formatDate(ticket.lastMessageAt || ticket.updatedAt)}</MetaValue>
          </MetaItem>
        </TicketMeta>

        <AdminControls>
          <ControlGroup>
            <ControlLabel>Status</ControlLabel>
            <ControlSelect
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_user">Awaiting User</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </ControlSelect>
          </ControlGroup>
          <ControlGroup>
            <ControlLabel>Priority</ControlLabel>
            <ControlSelect
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </ControlSelect>
          </ControlGroup>
          <ControlGroup>
            <ControlLabel>Department</ControlLabel>
            <ControlSelect
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="Orders & Delivery">Orders & Delivery</option>
              <option value="Payments & Billing">Payments & Billing</option>
              <option value="Shipping & Returns">Shipping & Returns</option>
              <option value="Account & Profile">Account & Profile</option>
              <option value="Payout & Finance">Payout & Finance</option>
              <option value="Listings">Listings</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Compliance">Compliance</option>
              <option value="Payments">Payments</option>
              <option value="General">General</option>
            </ControlSelect>
          </ControlGroup>
          {hasChanges && (
            <ControlGroup style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
              <UpdateButton
                onClick={handleUpdateStatus}
                disabled={updateStatusMutation.isPending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                    Updating...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Update Ticket
                  </>
                )}
              </UpdateButton>
            </ControlGroup>
          )}
        </AdminControls>
      </TicketHeader>

      <MessagesContainer>
        <MessagesList>
          {messages.map((message) => {
            const isAdmin = message.senderRole === 'admin';
            return (
              <MessageBubble key={message._id} $isAdmin={isAdmin}>
                <MessageHeader>
                  {isAdmin ? <FaUserShield /> : getRoleIcon(message.senderRole)}
                  <span>{message.senderName}</span>
                  {message.isInternal && (
                    <Badge $bgColor="#FEF3C7" $color="#92400E" style={{ marginLeft: '0.8rem' }}>
                      Internal Note
                    </Badge>
                  )}
                  <span>•</span>
                  <MessageTime>{formatDate(message.createdAt)}</MessageTime>
                </MessageHeader>
                <MessageContent $isAdmin={isAdmin} $isInternal={message.isInternal}>
                  {message.message}
                </MessageContent>
              </MessageBubble>
            );
          })}
        </MessagesList>

        <ReplyForm onSubmit={handleSubmitReply}>
          <TextArea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply here..."
            disabled={replyMutation.isPending}
          />
          <FormActions>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={isInternalNote}
                onChange={(e) => setIsInternalNote(e.target.checked)}
                disabled={replyMutation.isPending}
              />
              <span>Internal note (visible only to admins)</span>
            </CheckboxLabel>
            <SubmitButton
              type="submit"
              disabled={!replyMessage.trim() || replyMutation.isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {replyMutation.isPending ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  Sending...
                </>
              ) : (
                'Send Reply'
              )}
            </SubmitButton>
          </FormActions>
        </ReplyForm>
      </MessagesContainer>
    </Container>
  );
};

export default AdminTicketDetailPage;

