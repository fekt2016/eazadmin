import React, { useEffect } from "react";
import {
  FaCheckCircle,
  FaEdit,
  FaEllipsisV,
  FaEye,
  FaStore,
  FaTimesCircle,
  FaTrash,
  FaUndo,
  FaUserAlt,
  FaUserShield,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import styled from "styled-components";

// Dynamic Table Component
export const Table = ({
  data,
  columns,
  onEdit,
  onDelete,
  onViewDetails,
  actionMenu,
  setActionMenu,
  actionType = "menu", // "menu" or "iconLink"
  actionLinkPath, // Function to generate link path: (item) => string
}) => {
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenu && !event.target.closest('[data-action-menu]')) {
        setActionMenu(null);
      }
    };

    if (actionMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [actionMenu, setActionMenu]);

  return (
    <TableContainer>
      <StyledTable>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableHeader key={column.accessor}>{column.Header}</TableHeader>
            ))}
            <TableHeader>Actions</TableHeader>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map((item) => {
            const userId = item._id || item.id;
            const linkPath = actionLinkPath ? actionLinkPath(item) : `users/detail/${userId}`;

            return (
              <TableRow key={item.id}>
                {columns.map((column) => (
                  <TableCell key={`${item.id}-${column.accessor}`}>
                    {column.Cell
                      ? column.Cell({
                          value: item[column.accessor],
                          row: item, // Pass full row data for access to all fields
                        })
                      : item[column.accessor]}
                  </TableCell>
                ))}

                <TableCell style={{ position: 'relative' }} data-action-menu>
                  {actionType === "iconLink" ? (
                    <ActionIconLink
                      to={linkPath}
                      title="View user details"
                    >
                      <FaEye />
                    </ActionIconLink>
                  ) : (
                    <>
                      <ActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenu(actionMenu === item.id ? null : item.id);
                        }}
                        type="button"
                      >
                        <FaEllipsisV />
                      </ActionButton>

                      {actionMenu === item.id && (
                        <ActionMenu 
                          data-action-menu
                          ref={(el) => {
                            if (el) {
                              // Position dropdown dynamically using fixed positioning
                              setTimeout(() => {
                                const button = el.previousElementSibling;
                                if (button) {
                                  const buttonRect = button.getBoundingClientRect();
                                  const viewportHeight = window.innerHeight;
                                  const spaceBelow = viewportHeight - buttonRect.bottom;
                                  const menuHeight = el.scrollHeight || 200;
                                  
                                  // Calculate position
                                  let top = buttonRect.bottom + 5;
                                  let left = buttonRect.right - el.offsetWidth;
                                  
                                  // Ensure menu doesn't go off-screen horizontally
                                  if (left < 10) {
                                    left = 10;
                                  }
                                  
                                  // Position above if not enough space below
                                  if (spaceBelow < menuHeight + 10) {
                                    top = buttonRect.top - menuHeight - 5;
                                    el.setAttribute('data-position', 'above');
                                  } else {
                                    el.setAttribute('data-position', 'below');
                                  }
                                  
                                  // Set fixed position with calculated coordinates
                                  el.style.position = 'fixed';
                                  el.style.top = `${Math.max(10, top)}px`;
                                  el.style.left = `${left}px`;
                                  el.style.right = 'auto';
                                  el.style.bottom = 'auto';
                                  el.style.zIndex = '99999';
                                }
                              }, 0);
                            }
                          }}
                        >
                          {onViewDetails && (
                            <ActionMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onViewDetails) {
                                  onViewDetails(item);
                                }
                                setActionMenu(null);
                              }}
                            >
                              <FaEye /> View Details
                          </ActionMenuItem>
                          )}
                          {onEdit && (
                            <ActionMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEdit) {
                                  onEdit(item);
                                }
                                setActionMenu(null);
                              }}
                            >
                            <FaEdit /> Edit
                          </ActionMenuItem>
                          )}
                          {onDelete && (
                            <ActionMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDelete) {
                                  onDelete(item);
                                }
                                setActionMenu(null);
                              }}
                            >
                            <FaTrash /> Delete
                          </ActionMenuItem>
                          )}
                        </ActionMenu>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </StyledTable>
    </TableContainer>
  );
};

// Custom Cell Components
export const RoleCell = ({ value }) => {
  const getIcon = () => {
    switch (value) {
      case "admin":
        return <FaUserShield style={{ color: "#4361EE" }} />;
      case "seller":
        return <FaStore style={{ color: "#F8961E" }} />;
      case "user":
        return <FaUserAlt style={{ color: "#4CC9F0" }} />;
      default:
        return <FaUserAlt />;
    }
  };

  return (
    <RoleBadge>
      {getIcon()}
      <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
    </RoleBadge>
  );
};

export const StatusCell = ({ value }) => {
  return (
    <StatusBadge status={value}>
      {value === "active" ? <FaCheckCircle /> : <FaTimesCircle />}
      <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
    </StatusBadge>
  );
};

export const UserCell = ({ value, row }) => {
  return (
    <UserInfo>
      <UserAvatar>{value.charAt(0)}</UserAvatar>
      <UserDetails>
        <UserName>{value}</UserName>
        <UserEmail>{row.email}</UserEmail>
        {row.shopName && <VendorTag>{row.shopName}</VendorTag>}
      </UserDetails>
    </UserInfo>
  );
};
export const LastActiveCell = ({ value }) => {
  if (!value) return "-";

  // Format the last active time
  const lastActiveDate = new Date(value);
  const now = new Date();
  const diffHours = Math.abs(now - lastActiveDate) / 36e5;

  let formattedTime;
  if (diffHours < 1) {
    formattedTime = "Just now";
  } else if (diffHours < 24) {
    formattedTime = `${Math.floor(diffHours)} hours ago`;
  } else {
    formattedTime = `${Math.floor(diffHours / 24)} days ago`;
  }

  return <span>{formattedTime}</span>;
};
export const DateCell = ({ value }) => {
  if (!value) return "-";

  const date = new Date(value);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return <span>{formattedDate}</span>;
};

export const VerificationStatusCell = ({ value, row }) => {
  // Use verificationStatus from row data, fallback to value
  const verificationStatus = row?.verificationStatus || value || 'pending';
  
  const getStatusConfig = (status) => {
    switch (status) {
      case 'verified':
        return {
          icon: <FaCheckCircle />,
          color: '#10b981',
          bg: '#d1fae5',
          label: 'Verified'
        };
      case 'rejected':
        return {
          icon: <FaTimesCircle />,
          color: '#ef4444',
          bg: '#fee2e2',
          label: 'Rejected'
        };
      case 'pending':
      default:
        return {
          icon: <FaTimesCircle style={{ opacity: 0.5 }} />,
          color: '#f59e0b',
          bg: '#fef3c7',
          label: 'Pending'
        };
    }
  };

  const config = getStatusConfig(verificationStatus);

  return (
    <VerificationStatusBadge $status={verificationStatus} $color={config.color} $bg={config.bg}>
      {config.icon}
      <span>{config.label}</span>
    </VerificationStatusBadge>
  );
};

export const PayoutStatusCell = ({ value, row }) => {
  // Use payoutStatus from row data, fallback to value
  const payoutStatus = row?.payoutStatus || value || 'pending';
  
  const getStatusConfig = (status) => {
    switch (status) {
      case 'verified':
        return {
          icon: <FaCheckCircle />,
          color: '#10b981',
          bg: '#d1fae5',
          label: 'Verified'
        };
      case 'rejected':
        return {
          icon: <FaTimesCircle />,
          color: '#ef4444',
          bg: '#fee2e2',
          label: 'Rejected'
        };
      case 'pending':
      default:
        return {
          icon: <FaTimesCircle style={{ opacity: 0.5 }} />,
          color: '#f59e0b',
          bg: '#fef3c7',
          label: 'Pending'
        };
    }
  };

  const config = getStatusConfig(payoutStatus);

  return (
    <VerificationStatusBadge $status={payoutStatus} $color={config.color} $bg={config.bg}>
      {config.icon}
      <span>{config.label}</span>
    </VerificationStatusBadge>
  );
};

export const OrderCountCell = ({ value, row }) => {
  // Use orderCount from row data, fallback to value
  const orderCount = row?.orderCount ?? value ?? 0;
  
  return (
    <OrderCountBadge>
      <span>{orderCount.toLocaleString()}</span>
    </OrderCountBadge>
  );
};

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 12px;
  background: #4361ee;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 36px;
  min-height: 36px;

  &:hover {
    background: #3a56d4;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  overflow-y: visible;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
  width: 100%;
  
  /* Smooth scrolling */
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
  
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f7fafc;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
    
    &:hover {
      background: #a0aec0;
    }
  }
`;

const StyledTable = styled.table`
  width: 100%;
  min-width: 1000px; /* Ensure minimum width for all columns */
  border-collapse: collapse;
  table-layout: auto;
`;

const TableHead = styled.thead`
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
`;

const TableHeader = styled.th`
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #2b2d42;
  font-size: 13px;
  white-space: nowrap;
  
  /* Make Actions column sticky on the right */
  &:last-child {
    position: sticky;
    right: 0;
    background: #f8f9fa;
    z-index: 10;
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.05);
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #e9ecef;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8faff;
  }
`;

const TableCell = styled.td`
  padding: 8px 12px;
  color: #2b2d42;
  vertical-align: middle;
  font-size: 13px;
  white-space: nowrap;
  
  /* Make Actions column sticky on the right */
  &:last-child {
    position: sticky;
    right: 0;
    background: white;
    z-index: 10;
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.05);
  }
  
  /* Ensure Actions column stays white on hover */
  tr:hover &:last-child {
    background: #f8faff;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4361ee;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
`;

const UserDetails = styled.div``;

const UserName = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
`;

const UserEmail = styled.div`
  color: #8d99ae;
  font-size: 14px;
  margin-bottom: 8px;
`;

const VendorTag = styled.span`
  background: #f0f2ff;
  color: #4361ee;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
`;

const RoleBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 14px;
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ status }) =>
    status === "active"
      ? "#4CC9F020"
      : status === "pending"
      ? "#F8961E20"
      : "#F7258520"};
  color: ${({ status }) =>
    status === "active"
      ? "#4CC9F0"
      : status === "pending"
      ? "#F8961E"
      : "#F72585"};
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  width: fit-content;
`;

const ActionMenu = styled.div`
  position: fixed;
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 99999;
  overflow: visible;
  max-height: 300px;
  overflow-y: auto;
  
  /* Position will be set dynamically via JavaScript */
  top: 0;
  left: 0;
`;

const ActionMenuItem = styled.div`
  padding: 10px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
  }
`;

const ActionIconLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #4361ee;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;

  &:hover {
    background: #3a56d4;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
  }

  svg {
    font-size: 16px;
  }
`;

const VerificationStatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: ${({ $bg }) => $bg || '#fef3c7'};
  color: ${({ $color }) => $color || '#f59e0b'};
  width: fit-content;

  svg {
    font-size: 14px;
  }
`;

const OrderCountBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  background: #e8f4f8;
  color: #4361ee;
  min-width: 50px;
  text-align: center;
`;
