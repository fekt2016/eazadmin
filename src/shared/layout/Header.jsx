import styled from "styled-components";
import { FaBell } from "react-icons/fa";

const Header = ({ user }) => {
  return (
    <Container>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {/* <ToggleButton onClick={toggleSidebar}>
          <FaBars />
        </ToggleButton> */}
        {/* <SearchBar>
          <FaSearch style={{ color: theme.gray }} />
          <input type="text" placeholder="Search..." />
        </SearchBar> */}
      </div>
      <TopbarRight>
        <IconButton>
          <FaBell />
          <NotificationBadge>3</NotificationBadge>
        </IconButton>
        <UserProfile>
          <UserAvatar>{user.avatar}</UserAvatar>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: "12px", color: theme.gray }}>
              {user.shopName}
            </div>
          </div>
        </UserProfile>
      </TopbarRight>
    </Container>
  );
};

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: ${({ theme }) => theme.danger};
  color: white;
  font-size: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const IconButton = styled.button`
  position: relative;
  background: ${({ theme }) => theme.light};
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
  color: ${({ theme }) => theme.dark};
`;
const TopbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

// const NavItems = styled.nav`
//   display: flex;
//   align-items: center;
//   /* gap: 2rem; */

//   @media (max-width: 768px) {
//     gap: 1rem;
//   }
// `;
const theme = {
  primaryColor: "#2563eb",
  secondaryColor: "#1e40af",
  textColor: "#1f2937",
  lightText: "#6b7280",
  sidebarWidth: "240px",
  headerHeight: "64px",
  borderRadius: "8px",
  transition: "all 0.3s ease",
};

// const NavLink = styled(Link)`
//   color: ${theme.lightText};
//   text-decoration: none;
//   display: flex;
//   align-items: center;
//   gap: 0.5rem;
//   transition: ${theme.transition};

//   &:hover {
//     color: ${theme.primaryColor};
//   }

//   &.active {
//     color: ${theme.primaryColor};
//     font-weight: 500;
//   }
// `;

const Container = styled.header`
  height: ${theme.headerHeight};
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

// const UserProfile = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 1rem;
//   cursor: pointer;

//   img {
//     width: 40px;
//     height: 40px;
//     border-radius: 50%;
//     object-fit: cover;
//   }
// `;

export default Header;
