import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaTicketAlt, FaUser, FaStore, FaShieldAlt } from 'react-icons/fa';
import styled from 'styled-components';
import { useAdminTickets } from '../../shared/hooks/useSupport';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../features/support/supportTypes';
import { PATHS } from '../../routes/routhPath';

const Container = styled.div`
  max-width: 160rem;
  margin: 0 auto;
  padding: 3rem 2.4rem;
  min-height: 100vh;
  background: #fafbfc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  flex-wrap: wrap;
  gap: 1.6rem;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
`;

const FiltersBar = styled.div`
  display: flex;
  gap: 1.6rem;
  margin-bottom: 2.4rem;
  flex-wrap: wrap;
  align-items: center;
  background: #ffffff;
  padding: 1.6rem;
  border-radius: 1.2rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const SearchInput = styled.div`
  position: relative;
  flex: 1;
  min-width: 20rem;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 4rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.8rem;
  font-size: 1rem;
  background: #ffffff;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 1rem 1.2rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.8rem;
  font-size: 1rem;
  background: #ffffff;
  cursor: pointer;
  min-width: 15rem;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const TicketsTable = styled.div`
  background: #ffffff;
  border-radius: 1.2rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1.6rem;
  padding: 1.6rem 2.4rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  @media (max-width: 1200px) {
    display: none;
  }
`;

const TicketRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1.6rem;
  padding: 1.6rem 2.4rem;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
  
  &:hover {
    background: #f8fafc;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 1.2rem;
    padding: 2rem;
  }
`;

const TicketCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  
  @media (max-width: 1200px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const CellLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  display: none;
  
  @media (max-width: 1200px) {
    display: block;
  }
`;

const TicketNumber = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #3B82F6;
  font-family: 'Courier New', monospace;
`;

const TicketTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  line-height: 1.4;
`;

const TicketMeta = styled.div`
  font-size: 0.875rem;
  color: #64748b;
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

const RoleIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.875rem;
  color: #64748b;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 6rem 2rem;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  color: #cbd5e1;
  margin-bottom: 1.6rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.8rem 0;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  color: #64748b;
  margin: 0;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 6rem 2rem;
  color: #64748b;
`;

const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 1.6rem;
  margin-bottom: 2.4rem;
`;

const StatCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1.2rem;
  padding: 1.6rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.4rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

/**
 * Admin Tickets List Page
 */
const AdminTicketsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Read role and department from URL query parameters
  useEffect(() => {
    const roleParam = searchParams.get('role');
    const departmentParam = searchParams.get('department');
    if (roleParam) {
      setRoleFilter(roleParam);
    }
    if (departmentParam) {
      setDepartmentFilter(departmentParam);
    }
  }, [searchParams]);

  const { data, isLoading, error } = useAdminTickets({
    status: statusFilter || undefined,
    department: departmentFilter || undefined,
    priority: priorityFilter || undefined,
    role: roleFilter || undefined,
    search: searchQuery || undefined,
    page,
    limit: 20,
  });

  const tickets = data?.data?.tickets || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const handleTicketClick = (ticketId) => {
    navigate(`/dashboard/${PATHS.TICKET_DETAIL.replace(':id', ticketId)}`);
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
        return <FaShieldAlt />;
      default:
        return <FaUser />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingState>Loading tickets...</LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <EmptyState>
          <EmptyTitle>Error loading tickets</EmptyTitle>
          <EmptyText>Please try again later.</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <Title>All Support Tickets</Title>
          <p style={{ 
            margin: '0.8rem 0 0 0', 
            color: '#64748b', 
            fontSize: '1rem',
            fontWeight: '400'
          }}>
            View and manage all support tickets from buyers, sellers, and admins. Click any ticket to reply.
          </p>
        </div>
      </Header>

      <FiltersBar>
        <SearchInput>
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
          <Input
            type="text"
            placeholder="Search by ticket number or title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </SearchInput>
        <FilterSelect
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="awaiting_user">Awaiting User</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </FilterSelect>
        <FilterSelect
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </FilterSelect>
        <FilterSelect
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Roles</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </FilterSelect>
        <FilterSelect
          value={departmentFilter}
          onChange={(e) => {
            setDepartmentFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Departments</option>
          <option value="Orders & Delivery">Orders & Delivery</option>
          <option value="Payments & Billing">Payments & Billing</option>
          <option value="Shipping & Returns">Shipping & Returns</option>
          <option value="Account & Profile">Account & Profile</option>
          <option value="Payout & Finance">Payout & Finance</option>
          <option value="Listings">Listings</option>
          <option value="Infrastructure">Infrastructure</option>
          <option value="Compliance">Compliance</option>
          <option value="Payments">Payments</option>
        </FilterSelect>
      </FiltersBar>

      {tickets.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FaTicketAlt />
          </EmptyIcon>
          <EmptyTitle>No tickets found</EmptyTitle>
          <EmptyText>
            {searchQuery || statusFilter || priorityFilter || roleFilter || departmentFilter
              ? 'Try adjusting your filters'
              : 'No support tickets have been created yet.'}
          </EmptyText>
        </EmptyState>
      ) : (
        <>
          <TicketsTable>
            <TableHeader>
              <div>Ticket #</div>
              <div>Title</div>
              <div>User</div>
              <div>Department</div>
              <div>Status</div>
              <div>Priority</div>
              <div>Created</div>
            </TableHeader>
            {tickets.map((ticket) => (
              <TicketRow
                key={ticket._id}
                onClick={() => handleTicketClick(ticket._id)}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <TicketCell>
                  <CellLabel>Ticket Number</CellLabel>
                  <TicketNumber>{ticket.ticketNumber}</TicketNumber>
                </TicketCell>
                <TicketCell>
                  <CellLabel>Title</CellLabel>
                  <TicketTitle>{ticket.title}</TicketTitle>
                  {ticket.department && (
                    <TicketMeta>{ticket.department}</TicketMeta>
                  )}
                </TicketCell>
                <TicketCell>
                  <CellLabel>User</CellLabel>
                  <RoleIcon>
                    {getRoleIcon(ticket.role)}
                    <span>{ticket.role}</span>
                  </RoleIcon>
                  {ticket.userId?.name && (
                    <TicketMeta>{ticket.userId.name}</TicketMeta>
                  )}
                </TicketCell>
                <TicketCell>
                  <CellLabel>Department</CellLabel>
                  <TicketMeta>{ticket.department}</TicketMeta>
                </TicketCell>
                <TicketCell>
                  <CellLabel>Status</CellLabel>
                  {getStatusBadge(ticket.status)}
                </TicketCell>
                <TicketCell>
                  <CellLabel>Priority</CellLabel>
                  {getPriorityBadge(ticket.priority)}
                </TicketCell>
                <TicketCell>
                  <CellLabel>Created</CellLabel>
                  <TicketMeta>{formatDate(ticket.createdAt)}</TicketMeta>
                </TicketCell>
              </TicketRow>
            ))}
          </TicketsTable>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '0.8rem 1.6rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.8rem',
                  background: page === 1 ? '#f1f5f9' : '#ffffff',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '0.8rem 1.6rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.8rem',
                  background: page === totalPages ? '#f1f5f9' : '#ffffff',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default AdminTicketsPage;

