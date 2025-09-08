import { FaBox, FaChartLine, FaShoppingCart, FaUsers } from "react-icons/fa";
import styled from "styled-components";
import { Link } from "react-router-dom";

// Mock data
const metrics = [
  {
    title: "Total Revenue",
    value: "$42,567",
    change: "+12.5%",
    icon: <FaShoppingCart />,
    bg: "primary",
  },
  {
    title: "Total Orders",
    value: "1,258",
    change: "+8.3%",
    icon: <FaBox />,
    bg: "success",
  },
  {
    title: "Active Vendors",
    value: "89",
    change: "+5.2%",
    icon: <FaUsers />,
    bg: "accent",
  },
  {
    title: "Conversion Rate",
    value: "4.7%",
    change: "+1.2%",
    icon: <FaChartLine />,
    bg: "warning",
  },
];

const orders = [
  {
    id: "#ORD-001",
    customer: "John Smith",
    date: "15 Oct, 2023",
    amount: "$128.50",
    status: "Completed",
  },
  {
    id: "#ORD-002",
    customer: "Sarah Johnson",
    date: "14 Oct, 2023",
    amount: "$75.20",
    status: "Pending",
  },
  {
    id: "#ORD-003",
    customer: "Michael Brown",
    date: "14 Oct, 2023",
    amount: "$210.00",
    status: "Completed",
  },
  {
    id: "#ORD-004",
    customer: "Emily Davis",
    date: "13 Oct, 2023",
    amount: "$59.99",
    status: "Failed",
  },
  {
    id: "#ORD-005",
    customer: "David Wilson",
    date: "13 Oct, 2023",
    amount: "$342.75",
    status: "Completed",
  },
];

const vendors = [
  { name: "FashionHub", products: 42, sales: "$12,450", rating: 4.8 },
  { name: "TechGadgets", products: 28, sales: "$8,920", rating: 4.7 },
  { name: "HomeStyle", products: 35, sales: "$7,310", rating: 4.5 },
  { name: "BeautyCare", products: 19, sales: "$5,680", rating: 4.3 },
  { name: "SportsGear", products: 23, sales: "$4,950", rating: 4.6 },
];

// Color maps for styled components
const bgColorMap = {
  primary: "var(--color-primary-100)",
  success: "var(--color-green-100)",
  accent: "var(--color-brand-100)",
  warning: "var(--color-yellow-100)",
};

const colorMap = {
  primary: "var(--color-primary-500)",
  success: "var(--color-green-700)",
  accent: "var(--color-brand-500)",
  warning: "var(--color-yellow-700)",
};

const statusBgMap = {
  Completed: "var(--color-green-100)",
  Pending: "var(--color-yellow-100)",
  Failed: "var(--color-red-100)",
};

const statusColorMap = {
  Completed: "var(--color-green-700)",
  Pending: "var(--color-yellow-700)",
  Failed: "var(--color-red-700)",
};

export default function AdminDashboard() {
  return (
    <DashboardContainer>
      <MainContent>
        <Content>
          <WelcomeBanner>
            <div>
              <h1>Welcome back, Admin!</h1>
              <p>
                Heres whats happening with your multi-vendor platform today.
                Monitor your vendors, track sales, and manage orders
                efficiently.
              </p>
            </div>
            <button>Generate Report</button>
          </WelcomeBanner>
          <CardsContainer>
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardIcon bg={metric.bg}>{metric.icon}</CardIcon>
                <CardContent>
                  <h3>{metric.value}</h3>
                  <p>{metric.title}</p>
                  <small
                    style={{ color: "var(--color-green-700)", fontWeight: 500 }}
                  >
                    {metric.change}
                  </small>
                </CardContent>
              </Card>
            ))}
          </CardsContainer>
          <ChartsContainer>
            <ChartCard>
              <ChartHeader>
                <h3>Sales Analytics</h3>
                <SelectDropdown>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </SelectDropdown>
              </ChartHeader>
              <ChartPlaceholder>Sales Chart Visualization</ChartPlaceholder>
            </ChartCard>
            <ChartCard>
              <ChartHeader>
                <h3>Top Vendors</h3>
              </ChartHeader>
              <div>
                {vendors.map((vendor, index) => (
                  <VendorCard key={index}>
                    <VendorAvatar>{vendor.name.charAt(0)}</VendorAvatar>
                    <VendorInfo>
                      <h4>{vendor.name}</h4>
                      <p>
                        {vendor.products} products • {vendor.sales} sales
                      </p>
                    </VendorInfo>
                    <VendorRating>{vendor.rating} ★</VendorRating>
                  </VendorCard>
                ))}
              </div>
            </ChartCard>
          </ChartsContainer>
          <ChartCard>
            <ChartHeader>
              <h3>Recent Orders</h3>
              <ViewAllButton to="/admin/dashboard/orders">
                View All
              </ViewAllButton>
            </ChartHeader>
            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr key={index}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.date}</td>
                      <td>{order.amount}</td>
                      <td>
                        <StatusBadge status={order.status}>
                          {order.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </ChartCard>
        </Content>
      </MainContent>
    </DashboardContainer>
  );
}

// Styled components using global variables
const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: var(--color-grey-100);
`;

const MainContent = styled.div`
  flex: 1;
  transition: all 0.3s;
`;

const Content = styled.div`
  padding: 30px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const WelcomeBanner = styled.div`
  background: linear-gradient(
    90deg,
    var(--color-primary-500),
    var(--color-brand-500)
  );
  color: var(--color-white-0);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    font-size: 28px;
    margin-bottom: 10px;
  }

  p {
    opacity: 0.9;
    max-width: 600px;
  }

  button {
    background: var(--color-white-0);
    border: none;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 500;
    cursor: pointer;
    color: var(--color-primary-500);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      background: var(--color-grey-50);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 20px;

    button {
      width: 100%;
    }
  }
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
  margin-bottom: 30px;
`;

const Card = styled.div`
  background: var(--color-white-0);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const CardIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: ${(props) => bgColorMap[props.bg] || bgColorMap.primary};
  color: ${(props) => colorMap[props.bg] || colorMap.primary};
`;

const CardContent = styled.div`
  flex: 1;

  h3 {
    font-size: 24px;
    margin-bottom: 5px;
  }

  p {
    color: var(--color-grey-400);
    font-size: 14px;
  }
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: var(--color-white-0);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    font-size: 18px;
  }
`;

const SelectDropdown = styled.select`
  border: none;
  background: var(--color-grey-100);
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 14px;
`;

const ChartPlaceholder = styled.div`
  height: 300px;
  background: linear-gradient(
    120deg,
    var(--color-grey-50),
    var(--color-grey-200)
  );
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-grey-400);
  font-weight: 500;
`;

const TableContainer = styled.div`
  background: var(--color-white-0);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 15px 10px;
    text-align: left;
    border-bottom: 1px solid var(--color-grey-200);
  }

  th {
    color: var(--color-grey-500);
    font-weight: 500;
    font-size: 14px;
  }

  tbody tr:hover {
    background-color: rgba(67, 97, 238, 0.05);
  }
`;

const StatusBadge = styled.span`
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${(props) => statusBgMap[props.status] || statusBgMap.Completed};
  color: ${(props) => statusColorMap[props.status] || statusColorMap.Completed};
`;

const VendorCard = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--color-grey-200);

  &:last-child {
    border-bottom: none;
  }
`;

const VendorAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--color-primary-500);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white-0);
  font-weight: 600;
  font-size: 18px;
  margin-right: 15px;
`;

const VendorInfo = styled.div`
  flex: 1;

  h4 {
    margin-bottom: 5px;
  }

  p {
    color: var(--color-grey-400);
    font-size: 13px;
  }
`;

const VendorRating = styled.div`
  font-weight: 600;
  color: var(--color-sec-700);
`;

const ViewAllButton = styled(Link)`
  background: var(--color-primary-500);
  color: var(--color-white-0);
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: var(--color-primary-700);
    transform: translateY(-2px);
  }
`;
