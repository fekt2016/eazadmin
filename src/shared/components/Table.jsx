import {
  FaCheckCircle,
  FaEdit,
  FaEllipsisV,
  FaEye,
  FaStore,
  FaTimesCircle,
  FaTrash,
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
                          row: item.name,
                        })
                      : item[column.accessor]}
                  </TableCell>
                ))}

                <TableCell>
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
                        onClick={() =>
                          setActionMenu(actionMenu === item.id ? null : item.id)
                        }
                      >
                        <FaEllipsisV />
                      </ActionButton>

                      {actionMenu === item.id && (
                        <ActionMenu>
                          <ActionMenuItem onClick={() => onViewDetails(item)}>
                            <FaUserAlt /> View Details
                          </ActionMenuItem>
                          <ActionMenuItem onClick={() => onEdit(item)}>
                            <FaEdit /> Edit
                          </ActionMenuItem>
                          <ActionMenuItem onClick={() => onDelete(item)}>
                            <FaTrash /> Delete
                          </ActionMenuItem>
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

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 15px;
  background: #4361ee;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #3a56d4;
    transform: translateY(-2px);
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
`;

const TableHeader = styled.th`
  padding: 18px 25px;
  text-align: left;
  font-weight: 600;
  color: #2b2d42;
  font-size: 14px;
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
  padding: 10px 15px;
  color: #2b2d42;
  vertical-align: middle;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserAvatar = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: #4361ee;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
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
  position: absolute;
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 10;
  overflow: hidden;
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
