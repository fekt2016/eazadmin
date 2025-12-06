import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FaBell, 
  FaCheck, 
  FaCheckDouble, 
  FaTrash, 
  FaShoppingCart, 
  FaTruck, 
  FaMoneyBillWave, 
  FaHeadset, 
  FaBox, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaUsers,
  FaCog
} from 'react-icons/fa';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '../../shared/hooks/notifications/useNotifications';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import Button from '../../shared/components/Button';
import { PATHS } from '../../routes/routePaths';

const Container = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const TitleSection = styled.div`
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  p {
    color: #7f8c8d;
    margin: 0;
  }
`;

const UnreadBadge = styled.span`
  background: var(--color-primary-500, #007bff);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-left: 1rem;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: ${props => props.active ? 'var(--color-primary-500, #007bff)' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--color-primary-500, #007bff);
  }
`;

const NotificationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NotificationItem = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  ${props => !props.read && `
    border-left: 4px solid var(--color-primary-500, #007bff);
    background: #f8f9ff;
  `}
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color || '#e0e0e0'};
  color: white;
  flex-shrink: 0;
  font-size: 1.25rem;
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
`;

const NotificationMessage = styled.p`
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const NotificationTime = styled.span`
  color: #999;
  font-size: 0.8rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
`;

const DeleteButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  opacity: 0.7;

  &:hover {
    background: #fee2e2;
    color: #dc2626;
    opacity: 1;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const MarkReadButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  opacity: 0.7;

  &:hover {
    background: #dbeafe;
    color: #007bff;
    opacity: 1;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #999;
  
  svg {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.3;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #666;
  }
  
  p {
    margin: 0;
    color: #999;
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
`;

const CategoryTab = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: ${props => props.active ? 'var(--color-primary-500, #007bff)' : '#666'};
  border-bottom: 3px solid ${props => props.active ? 'var(--color-primary-500, #007bff)' : 'transparent'};
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: ${props => props.active ? '600' : '400'};
  white-space: nowrap;
  transition: all 0.2s;
  
  &:hover {
    color: var(--color-primary-500, #007bff);
  }
`;

const AdminNotificationsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'seller', 'product', 'order', 'payout', 'support', 'system'

  // Map category filter to notification type
  const getTypeFromCategory = (category) => {
    const categoryMap = {
      'seller': ['seller', 'verification'],
      'product': ['product'],
      'order': ['order', 'delivery'],
      'payout': ['payout', 'finance'],
      'support': ['support'],
      'system': ['system', 'announcement'],
    };
    return categoryMap[category] || undefined;
  };

  const { data: notificationsData, isLoading } = useNotifications({
    read: filter === 'all' ? undefined : filter === 'unread' ? false : true,
    type: categoryFilter === 'all' ? undefined : getTypeFromCategory(categoryFilter)?.[0],
  });

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.data?.unreadCount || 0;

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = notificationsData?.data?.notifications || [];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <FaShoppingCart />;
      case 'delivery':
        return <FaTruck />;
      case 'payout':
      case 'finance':
        return <FaMoneyBillWave />;
      case 'support':
        return <FaHeadset />;
      case 'product':
        return <FaBox />;
      case 'verification':
        return <FaCheckCircle />;
      case 'announcement':
        return <FaExclamationCircle />;
      case 'user':
        return <FaUsers />;
      case 'system':
        return <FaCog />;
      default:
        return <FaBell />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order':
        return '#007bff';
      case 'delivery':
        return '#17a2b8';
      case 'payout':
      case 'finance':
        return '#28a745';
      case 'support':
        return '#ffc107';
      case 'product':
        return '#6f42c1';
      case 'verification':
        return '#20c997';
      case 'announcement':
        return '#dc3545';
      case 'user':
        return '#6610f2';
      case 'system':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification._id);
    }

    // Navigate based on actionUrl or metadata
    if (notification.actionUrl) {
      // If actionUrl is already a full path starting with /dashboard, use it directly
      if (notification.actionUrl.startsWith('/dashboard')) {
        navigate(notification.actionUrl);
      } else {
        // Otherwise, prepend /dashboard
        navigate(`/dashboard${notification.actionUrl}`);
      }
    } else if (notification.metadata?.orderId) {
      navigate(`/dashboard/orders/detail/${notification.metadata.orderId}`);
    } else if (notification.metadata?.ticketId) {
      navigate(`/dashboard/support/tickets/${notification.metadata.ticketId}`);
    } else if (notification.metadata?.userId) {
      navigate(`/dashboard/users/detail/${notification.metadata.userId}`);
    } else if (notification.metadata?.productId) {
      navigate(`/dashboard/product-details/${notification.metadata.productId}`);
    } else if (notification.metadata?.sellerId) {
      navigate(`/dashboard/sellers/detail/${notification.metadata.sellerId}`);
    } else if (notification.metadata?.refundId) {
      navigate(`/dashboard/refunds/${notification.metadata.refundId}`);
    } else if (notification.metadata?.withdrawalId) {
      navigate(`/dashboard/payment-request/detail/${notification.metadata.withdrawalId}`);
    }
  };

  const handleMarkAsRead = (e, notificationId) => {
    e.stopPropagation();
    markAsRead.mutate(notificationId);
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      deleteNotification.mutate(notificationId, {
        onSuccess: () => {
          console.log('Notification deleted successfully');
        },
        onError: (error) => {
          console.error('Error deleting notification:', error);
          alert('Failed to delete notification. Please try again.');
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <TitleSection>
          <h1>
            <FaBell />
            Notifications
            {unreadCount > 0 && <UnreadBadge>{unreadCount} unread</UnreadBadge>}
          </h1>
          <p>Manage your platform notifications</p>
        </TitleSection>
        {notifications.length > 0 && unreadCount > 0 && (
          <Button
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            loading={markAllAsRead.isPending}
            leftIcon={<FaCheckDouble />}
          >
            Mark All as Read
          </Button>
        )}
      </Header>

      <CategoryTabs>
        <CategoryTab
          active={categoryFilter === 'all'}
          onClick={() => setCategoryFilter('all')}
        >
          All
        </CategoryTab>
        <CategoryTab
          active={categoryFilter === 'seller'}
          onClick={() => setCategoryFilter('seller')}
        >
          Seller
        </CategoryTab>
        <CategoryTab
          active={categoryFilter === 'product'}
          onClick={() => setCategoryFilter('product')}
        >
          Product
        </CategoryTab>
        <CategoryTab
          active={categoryFilter === 'order'}
          onClick={() => setCategoryFilter('order')}
        >
          Orders
        </CategoryTab>
        <CategoryTab
          active={categoryFilter === 'payout'}
          onClick={() => setCategoryFilter('payout')}
        >
          Finance
        </CategoryTab>
        <CategoryTab
          active={categoryFilter === 'support'}
          onClick={() => setCategoryFilter('support')}
        >
          Support
        </CategoryTab>
        <CategoryTab
          active={categoryFilter === 'system'}
          onClick={() => setCategoryFilter('system')}
        >
          System
        </CategoryTab>
      </CategoryTabs>

      <FilterSection>
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All
        </FilterButton>
        <FilterButton
          active={filter === 'unread'}
          onClick={() => setFilter('unread')}
        >
          Unread
        </FilterButton>
        <FilterButton
          active={filter === 'read'}
          onClick={() => setFilter('read')}
        >
          Read
        </FilterButton>
      </FilterSection>

      {notifications.length === 0 ? (
        <EmptyState>
          <FaBell />
          <h3>No notifications</h3>
          <p>
            {filter === 'unread' 
              ? "You're all caught up! No unread notifications." 
              : "You don't have any notifications yet."}
          </p>
        </EmptyState>
      ) : (
        <NotificationsList>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              read={notification.read}
              onClick={() => handleNotificationClick(notification)}
            >
              <IconWrapper color={getNotificationColor(notification.type)}>
                {getNotificationIcon(notification.type)}
              </IconWrapper>
              <NotificationContent>
                <NotificationTitle>{notification.title}</NotificationTitle>
                <NotificationMessage>{notification.message}</NotificationMessage>
                <NotificationTime>
                  {formatTime(notification.createdAt)}
                </NotificationTime>
              </NotificationContent>
              <ActionButtons>
                {!notification.read && (
                  <MarkReadButton
                    onClick={(e) => handleMarkAsRead(e, notification._id)}
                    title="Mark as read"
                    aria-label="Mark as read"
                  >
                    <FaCheck />
                  </MarkReadButton>
                )}
                <DeleteButton
                  onClick={(e) => handleDelete(e, notification._id)}
                  title="Delete notification"
                  aria-label="Delete notification"
                  disabled={deleteNotification.isPending && deleteNotification.variables === notification._id}
                >
                  {deleteNotification.isPending && deleteNotification.variables === notification._id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <FaTrash />
                  )}
                </DeleteButton>
              </ActionButtons>
            </NotificationItem>
          ))}
        </NotificationsList>
      )}
    </Container>
  );
};

export default AdminNotificationsPage;

