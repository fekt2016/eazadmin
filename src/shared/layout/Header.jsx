import styled from "styled-components";
import { getOptimizedImageUrl, IMAGE_SLOTS } from '../utils/cloudinaryConfig';

const T = {
  primary:      'var(--color-primary-600)',
  primaryLight: 'var(--color-primary-500)',
  primaryBg:    'var(--color-primary-100)',
  border:       'var(--color-border)',
  cardBg:       'var(--color-card-bg)',
  bodyBg:       'var(--color-body-bg)',
  text:         'var(--color-grey-900)',
  textMuted:    'var(--color-grey-500)',
  textLight:    'var(--color-grey-400)',
  radius:       'var(--border-radius-xl)',
  radiusSm:     'var(--border-radius-md)',
  shadow:       'var(--shadow-sm)',
  shadowMd:     'var(--shadow-md)',
};

const Header = ({ user }) => {
  return (
    <Container>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--layout-stack-gap)" }}>
        {/* <ToggleButton onClick={toggleSidebar}>
          <FaBars />
        </ToggleButton> */}
        {/* <SearchBar>
          <FaSearch style={{ color: theme.gray }} />
          <input type="text" placeholder="Search..." />
        </SearchBar> */}
      </div>
      <TopbarRight>
        {user ? (
          <UserProfile>
            <UserAvatar>
              {user.avatar ? (
                <img
                  src={getOptimizedImageUrl(user.avatar, IMAGE_SLOTS.AVATAR)}
                  alt={user.name || 'Admin'}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                (user.name || 'A').charAt(0).toUpperCase()
              )}
            </UserAvatar>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 600 }}>{user.name || 'Admin'}</div>
              <div style={{ fontSize: "12px", color: 'var(--color-grey-500)' }}>
                {user.shopName || user.email || 'Administrator'}
              </div>
            </div>
          </UserProfile>
        ) : (
          <UserProfile>
            <UserAvatar>A</UserAvatar>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 600 }}>Loading...</div>
              <div style={{ fontSize: "12px", color: 'var(--color-grey-500)' }}>
                Administrator
              </div>
            </div>
          </UserProfile>
        )}
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
  background: ${T.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
`;

const TopbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: var(--layout-section-gap);
`;

// const NavItems = styled.nav`
//   display: flex;
//   align-items: center;
//   /* gap: 2rem; */

//   @media (max-width: 768px) {
//     gap: 1rem;
//   }
// `;
const Container = styled.header`
  height: var(--header-height);
  background: ${T.cardBg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--layout-header-padding-x);
  border-bottom: 1px solid ${T.border};
  box-shadow: ${T.shadow};
  position: sticky;
  top: 0;
  z-index: 1000;

  @media (max-width: 768px) {
    padding: 0 var(--layout-header-padding-x-mobile);
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
