import { useState, useMemo } from "react";
import styled from "styled-components";
import {
  FaSearch,
  FaTicketAlt,
  FaTag,
  FaEdit,
  FaTrash,
  FaPercentage,
  FaDollarSign,
  FaCalendarAlt,
  FaUser,
  FaGlobe,
  FaBan,
} from "react-icons/fa";
import { useGetAllCoupons, useDeactivateCoupon } from '../../shared/hooks/useAdminCoupon';
import { useGetAllDiscounts, useDeleteDiscount } from '../../shared/hooks/useAdminDiscount';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import Button from '../../shared/components/Button';
import { formatDate } from '../../shared/utils/helpers';

const statusOptions = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "expired", label: "Expired" },
];

export const AdminCouponDiscountPage = () => {
  const [activeTab, setActiveTab] = useState("coupons");
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sellerFilter, setSellerFilter] = useState("all");

  const { data: couponsData, isLoading: couponsLoading } = useGetAllCoupons({
    status: activeStatus === "all" ? undefined : activeStatus,
    page: 1,
    limit: 100,
  });

  const { data: discountsData, isLoading: discountsLoading } = useGetAllDiscounts();
  const { mutate: deactivateCoupon } = useDeactivateCoupon();
  const { mutate: deleteDiscount } = useDeleteDiscount();

  const couponBatches = useMemo(
    () => couponsData?.data?.batches || [],
    [couponsData]
  );

  const discounts = useMemo(
    () => discountsData?.data?.data?.discounts || [],
    [discountsData]
  );

  const filteredCoupons = useMemo(() => {
    let filtered = couponBatches;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (batch) =>
          batch.name?.toLowerCase().includes(term) ||
          batch.seller?.name?.toLowerCase().includes(term) ||
          batch.seller?.email?.toLowerCase().includes(term)
      );
    }

    // Filter by seller
    if (sellerFilter !== "all") {
      if (sellerFilter === "global") {
        filtered = filtered.filter((batch) => batch.global === true);
      } else {
        filtered = filtered.filter(
          (batch) => batch.seller?._id === sellerFilter || batch.seller === sellerFilter
        );
      }
    }

    return filtered;
  }, [couponBatches, searchTerm, sellerFilter]);

  const filteredDiscounts = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let filtered = discounts;

    // Status filtering
    if (activeStatus !== "all") {
      filtered = filtered.filter((discount) => {
        const isActive =
          discount.active &&
          today >= discount.startDate &&
          today <= discount.endDate;
        const isExpired = discount.endDate < today;

        if (activeStatus === "active" && !isActive) return false;
        if (activeStatus === "inactive" && discount.active) return false;
        if (activeStatus === "expired" && !isExpired) return false;
        return true;
      });
    }

    // Search term filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (discount) =>
          discount.name?.toLowerCase().includes(term) ||
          discount.code?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [discounts, activeStatus, searchTerm]);

  const handleDeactivateCoupon = (batchId) => {
    if (window.confirm("Are you sure you want to deactivate this coupon batch?")) {
      deactivateCoupon(batchId);
    }
  };

  const handleDeleteDiscount = (discountId) => {
    if (window.confirm("Are you sure you want to delete this discount? This action cannot be undone.")) {
      deleteDiscount(discountId);
    }
  };

  const uniqueSellers = useMemo(() => {
    const sellers = new Map();
    couponBatches.forEach((batch) => {
      if (batch.seller && !batch.global) {
        const sellerId = batch.seller._id || batch.seller;
        const sellerName = batch.seller.name || batch.seller.email || "Unknown Seller";
        if (!sellers.has(sellerId)) {
          sellers.set(sellerId, { id: sellerId, name: sellerName });
        }
      }
    });
    return Array.from(sellers.values());
  }, [couponBatches]);

  return (
    <Container>
      <Header>
        <Title>
          <FaTicketAlt />
          Coupons & Discounts Management
        </Title>
        <Subtitle>Manage all coupons and discounts created by sellers</Subtitle>
      </Header>

      <TabContainer>
        <TabButton
          active={activeTab === "coupons"}
          onClick={() => setActiveTab("coupons")}
        >
          <FaTicketAlt /> Coupons
        </TabButton>
        <TabButton
          active={activeTab === "discounts"}
          onClick={() => setActiveTab("discounts")}
        >
          <FaTag /> Discounts
        </TabButton>
      </TabContainer>

      <ControlsContainer>
        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder={
              activeTab === "coupons"
                ? "Search coupons by name or seller..."
                : "Search discounts by name or code..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        {activeTab === "coupons" && (
          <SellerFilter>
            <Select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
            >
              <option value="all">All Sellers</option>
              <option value="global">Global Coupons</option>
              {uniqueSellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </Select>
          </SellerFilter>
        )}

        <StatusFilter>
          {statusOptions.map((status) => (
            <StatusButton
              key={status.id}
              active={activeStatus === status.id}
              onClick={() => setActiveStatus(status.id)}
            >
              {status.label}
            </StatusButton>
          ))}
        </StatusFilter>
      </ControlsContainer>

      {activeTab === "coupons" ? (
        <>
          {couponsLoading ? (
            <LoadingState>
              <LoadingSpinner />
              <p>Loading coupons...</p>
            </LoadingState>
          ) : filteredCoupons.length === 0 ? (
            <EmptyState>
              <FaTicketAlt />
              <h3>No coupons found</h3>
              <p>No coupon batches match your search criteria</p>
            </EmptyState>
          ) : (
            <CouponsContainer>
              {filteredCoupons.map((batch) => (
                <CouponCard key={batch._id}>
                  <CouponHeader>
                    <CouponInfo>
                      <CouponName>
                        {batch.name}
                        {batch.global && (
                          <GlobalBadge>
                            <FaGlobe /> Global
                          </GlobalBadge>
                        )}
                      </CouponName>
                      <CouponMeta>
                        <MetaItem>
                          <FaUser />{" "}
                          {batch.global
                            ? "Platform"
                            : batch.seller?.name || batch.seller?.email || "Unknown Seller"}
                        </MetaItem>
                        <MetaItem>
                          <FaCalendarAlt /> Created: {formatDate(batch.createdAt)}
                        </MetaItem>
                        <MetaItem>
                          Valid: {formatDate(batch.validFrom)} - {formatDate(batch.expiresAt)}
                        </MetaItem>
                      </CouponMeta>
                    </CouponInfo>
                    <CouponActions>
                      <DiscountBadge>
                        {batch.discountType === "percentage"
                          ? `${batch.discountValue}% Off`
                          : `GH₵${batch.discountValue} Off`}
                      </DiscountBadge>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeactivateCoupon(batch._id)}
                        iconOnly
                        ariaLabel="Deactivate coupon"
                      >
                        <FaBan />
                      </Button>
                    </CouponActions>
                  </CouponHeader>
                  <CouponStats>
                    <StatItem>
                      <StatLabel>Total Coupons</StatLabel>
                      <StatValue>{batch.coupons?.length || 0}</StatValue>
                    </StatItem>
                    <StatItem>
                      <StatLabel>Used</StatLabel>
                      <StatValue>
                        {batch.coupons?.filter((c) => c.used).length || 0}
                      </StatValue>
                    </StatItem>
                    <StatItem>
                      <StatLabel>Status</StatLabel>
                      <StatValue>
                        {batch.isActive ? "Active" : "Inactive"}
                      </StatValue>
                    </StatItem>
                  </CouponStats>
                </CouponCard>
              ))}
            </CouponsContainer>
          )}
        </>
      ) : (
        <>
          {discountsLoading ? (
            <LoadingState>
              <LoadingSpinner />
              <p>Loading discounts...</p>
            </LoadingState>
          ) : filteredDiscounts.length === 0 ? (
            <EmptyState>
              <FaTag />
              <h3>No discounts found</h3>
              <p>No discounts match your search criteria</p>
            </EmptyState>
          ) : (
            <DiscountsContainer>
              {filteredDiscounts.map((discount) => (
                <DiscountCard key={discount._id || discount.id}>
                  <DiscountHeader>
                    <DiscountInfo>
                      <DiscountName>{discount.name}</DiscountName>
                      <DiscountCode>
                        <FaTag /> {discount.code}
                      </DiscountCode>
                      <DiscountMeta>
                        <MetaItem>
                          <FaUser /> Seller: {discount.seller?.name || "Unknown"}
                        </MetaItem>
                        <MetaItem>
                          <FaCalendarAlt /> {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                        </MetaItem>
                      </DiscountMeta>
                    </DiscountInfo>
                    <DiscountActions>
                      <DiscountValue>
                        {discount.type === "percentage" ? (
                          <FaPercentage />
                        ) : (
                          <FaDollarSign />
                        )}
                        {discount.type === "percentage"
                          ? `${discount.value}% Off`
                          : `GH₵${discount.value} Off`}
                      </DiscountValue>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteDiscount(discount._id || discount.id)}
                        iconOnly
                        ariaLabel="Delete discount"
                      >
                        <FaTrash />
                      </Button>
                    </DiscountActions>
                  </DiscountHeader>
                  <DiscountStatus active={discount.active}>
                    {discount.active ? "Active" : "Inactive"}
                  </DiscountStatus>
                </DiscountCard>
              ))}
            </DiscountsContainer>
          )}
        </>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  margin: 0;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 1.5rem;
  gap: 0.5rem;
`;

const TabButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: ${(props) => (props.active ? "var(--color-primary-500, #007bff)" : "#666")};
  border-bottom: 3px solid
    ${(props) => (props.active ? "var(--color-primary-500, #007bff)" : "transparent")};
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    color: var(--color-primary-500, #007bff);
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
  max-width: 400px;
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const SellerFilter = styled.div`
  min-width: 200px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const StatusFilter = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const StatusButton = styled.button`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  background-color: ${(props) => (props.active ? "#dbeafe" : "#f3f4f6")};
  color: ${(props) => (props.active ? "#1d4ed8" : "#4b5563")};

  &:hover {
    background-color: #e5e7eb;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;

  p {
    margin-top: 1rem;
    color: #6b7280;
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

const CouponsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CouponCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
`;

const CouponHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const CouponInfo = styled.div`
  flex: 1;
`;

const CouponName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const GlobalBadge = styled.span`
  padding: 4px 8px;
  background: #3b82f6;
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CouponMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CouponActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const DiscountBadge = styled.div`
  padding: 8px 16px;
  background-color: #d1fae5;
  color: #065f46;
  border-radius: 24px;
  font-weight: 700;
  font-size: 0.875rem;
  white-space: nowrap;
`;

const CouponStats = styled.div`
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const StatValue = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
`;

const DiscountsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DiscountCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
`;

const DiscountHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const DiscountInfo = styled.div`
  flex: 1;
`;

const DiscountName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const DiscountCode = styled.div`
  color: #3b82f6;
  font-weight: 500;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const DiscountMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const DiscountActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const DiscountValue = styled.div`
  font-weight: 600;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const DiscountStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
  width: fit-content;
  background-color: ${(props) => (props.active ? "#d1fae5" : "#fee2e2")};
  color: ${(props) => (props.active ? "#065f46" : "#b91c1c")};
`;

export default AdminCouponDiscountPage;

