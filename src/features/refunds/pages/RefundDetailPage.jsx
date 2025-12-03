import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaArrowLeft, FaUser, FaStore, FaBox, FaFileAlt, FaLink } from 'react-icons/fa';
import { useAdminRefund } from '../hooks/useAdminRefunds';
import RefundStatusBadge from '../components/RefundStatusBadge';
import RefundActionPanel from '../components/RefundActionPanel';
import RefundTimeline from '../components/RefundTimeline';
import { PATHS } from '../../../routes/routhPath';
import { formatDate } from '../../../shared/utils/helpers';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background: #f3f4f6;
  border: none;
  border-radius: 0.6rem;
  font-size: 1.4rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  &:hover {
    background: #e5e7eb;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.div`
  font-size: 1.4rem;
  color: #6b7280;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  margin-top: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 0.8rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const CardTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoLabel = styled.div`
  font-size: 1.3rem;
  color: #6b7280;
  font-weight: 500;
`;

const InfoValue = styled.div`
  font-size: 1.5rem;
  color: #1f2937;
  font-weight: 600;
`;

const LinkButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #6366f1;
  text-decoration: none;
  font-size: 1.4rem;
  font-weight: 600;
  &:hover {
    text-decoration: underline;
  }
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.6rem;
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.3rem;
`;

const ItemMeta = styled.div`
  font-size: 1.3rem;
  color: #6b7280;
`;

const ItemPrice = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
`;

const ReasonText = styled.div`
  font-size: 1.4rem;
  color: #374151;
  line-height: 1.6;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.6rem;
  margin-top: 1rem;
`;

const AmountDisplay = styled.div`
  font-size: 2.4rem;
  font-weight: 800;
  color: #059669;
  margin: 1rem 0;
`;

export default function RefundDetailPage() {
  const { refundId } = useParams();
  const navigate = useNavigate();
  const { data: refundData, isLoading, error } = useAdminRefund(refundId);

  const refund = refundData?.data?.refund || refundData?.data || refundData;

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (error || !refund) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h2>Error loading refund</h2>
          <p>{error?.message || 'Refund not found'}</p>
          <BackButton onClick={() => navigate(-1)}>Go Back</BackButton>
        </div>
      </PageContainer>
    );
  }

  const orderId = refund._id || refund.orderId;
  const order = refund.order || refund;
  const buyer = refund.user || order.user;
  const seller = refund.seller || order.sellerOrder?.[0]?.seller;

  // Build timeline from refund history
  const timeline = [];
  if (refund.refundRequestDate) {
    timeline.push({
      type: 'requested',
      title: 'Refund Requested',
      message: `Buyer requested refund of GH₵${(refund.refundAmount || refund.totalPrice || 0).toFixed(2)}`,
      timestamp: refund.refundRequestDate,
      amount: refund.refundAmount || refund.totalPrice,
    });
  }
  if (refund.refundStatus === 'approved' && refund.refundProcessedAt) {
    timeline.push({
      type: 'approved',
      title: 'Refund Approved',
      message: `Admin approved refund of GH₵${(refund.refundAmount || refund.totalPrice || 0).toFixed(2)}`,
      timestamp: refund.refundProcessedAt,
      amount: refund.refundAmount || refund.totalPrice,
    });
  }
  if (refund.refundStatus === 'rejected' && refund.refundProcessedAt) {
    timeline.push({
      type: 'rejected',
      title: 'Refund Rejected',
      message: refund.refundRejectionReason || 'Refund request was rejected',
      timestamp: refund.refundProcessedAt,
    });
  }
  if (refund.refundStatus === 'completed') {
    timeline.push({
      type: 'completed',
      title: 'Refund Completed',
      message: 'Refund has been processed and credited to buyer wallet',
      timestamp: refund.refundProcessedAt || new Date(),
    });
  }

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </BackButton>
        <HeaderContent>
          <Title>Refund Request #{refund.orderNumber || refund._id?.slice(-8)}</Title>
          <Subtitle>
            <RefundStatusBadge status={refund.refundStatus || 'pending'} />
          </Subtitle>
        </HeaderContent>
      </Header>

      <ContentGrid>
        <LeftColumn>
          {/* Order Info Card */}
          <Card>
            <CardTitle>
              <FaBox /> Order Information
            </CardTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Order ID</InfoLabel>
                <InfoValue>
                  <LinkButton to={`/dashboard/${PATHS.ORDER_DETAIL.replace(':id', orderId)}`}>
                    {refund.orderNumber || orderId?.slice(-8)} <FaLink />
                  </LinkButton>
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Order Date</InfoLabel>
                <InfoValue>{formatDate(refund.createdAt || order.createdAt)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Payment Method</InfoLabel>
                <InfoValue>{refund.paymentMethod || order.paymentMethod || 'N/A'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Total Order Amount</InfoLabel>
                <InfoValue>GH₵{(refund.totalPrice || order.totalPrice || 0).toFixed(2)}</InfoValue>
              </InfoItem>
            </InfoGrid>

            {order.orderItems && order.orderItems.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <CardTitle style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Order Items</CardTitle>
                <ItemsList>
                  {order.orderItems.map((item, index) => (
                    <ItemRow key={index}>
                      <ItemInfo>
                        <ItemName>{item.product?.name || 'Product'}</ItemName>
                        <ItemMeta>Qty: {item.quantity} × GH₵{item.price?.toFixed(2) || '0.00'}</ItemMeta>
                      </ItemInfo>
                      <ItemPrice>GH₵{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</ItemPrice>
                    </ItemRow>
                  ))}
                </ItemsList>
              </div>
            )}
          </Card>

          {/* Buyer Info Card */}
          <Card>
            <CardTitle>
              <FaUser /> Buyer Information
            </CardTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Name</InfoLabel>
                <InfoValue>{buyer?.name || 'N/A'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>{buyer?.email || 'N/A'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Phone</InfoLabel>
                <InfoValue>{buyer?.phone || 'N/A'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Actions</InfoLabel>
                <InfoValue>
                  {buyer?._id && (
                    <LinkButton to={`/dashboard/${PATHS.USERDETAIL.replace(':id', buyer._id)}`}>
                      View Profile <FaLink />
                    </LinkButton>
                  )}
                </InfoValue>
              </InfoItem>
            </InfoGrid>
          </Card>

          {/* Seller Info Card */}
          {seller && (
            <Card>
              <CardTitle>
                <FaStore /> Seller Information
              </CardTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>Name/Shop</InfoLabel>
                  <InfoValue>{seller.name || seller.shopName || 'N/A'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue>{seller.email || 'N/A'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Actions</InfoLabel>
                  <InfoValue>
                    {seller._id && (
                      <LinkButton to={`/dashboard/${PATHS.SELLERDETAIL.replace(':id', seller._id)}`}>
                        View Profile <FaLink />
                      </LinkButton>
                    )}
                  </InfoValue>
                </InfoItem>
              </InfoGrid>
            </Card>
          )}

          {/* Refund Request Details */}
          <Card>
            <CardTitle>
              <FaFileAlt /> Refund Request Details
            </CardTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Requested Amount</InfoLabel>
                <AmountDisplay>GH₵{(refund.refundAmount || refund.totalPrice || 0).toFixed(2)}</AmountDisplay>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Refund Reason</InfoLabel>
                <InfoValue>{refund.refundReason || 'N/A'}</InfoValue>
              </InfoItem>
            </InfoGrid>
            {refund.refundReasonText && (
              <ReasonText>{refund.refundReasonText}</ReasonText>
            )}
            {refund.refundRequestDate && (
              <InfoItem style={{ marginTop: '1rem' }}>
                <InfoLabel>Requested On</InfoLabel>
                <InfoValue>{formatDate(refund.refundRequestDate)}</InfoValue>
              </InfoItem>
            )}
          </Card>

          {/* Timeline */}
          <RefundTimeline timeline={timeline} />
        </LeftColumn>

        <RightColumn>
          {/* Admin Action Panel */}
          <RefundActionPanel refund={refund} />
        </RightColumn>
      </ContentGrid>
    </PageContainer>
  );
}

