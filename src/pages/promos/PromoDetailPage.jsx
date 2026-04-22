import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import Button from '../../shared/components/Button';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import {
  useAdminPromo,
  usePromoSubmissions,
  useReviewPromoSubmission,
} from '../../shared/hooks/useAdminPromos';
import { formatCurrency } from '../../shared/utils/helpers';
import {
  getOptimizedImageUrl,
  IMAGE_SLOTS,
} from '../../shared/utils/cloudinaryConfig';

const TAB_OPTIONS = ['overview', 'submissions', 'analytics'];

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function PromoDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: promo, isLoading: isPromoLoading } = useAdminPromo(id);
  const { data: submissions, isLoading: isSubmissionsLoading } =
    usePromoSubmissions(id, {});
  const reviewMutation = useReviewPromoSubmission();

  const submissionStats = useMemo(() => {
    const rows = submissions || [];
    return {
      total: rows.length,
      pending: rows.filter((item) => item.status === 'pending').length,
      approved: rows.filter((item) => item.status === 'approved').length,
      rejected: rows.filter((item) => item.status === 'rejected').length,
    };
  }, [submissions]);

  const handleApprove = async (submissionId) => {
    try {
      await reviewMutation.mutateAsync({
        submissionId,
        payload: { status: 'approved' },
      });
      toast.success('Submission approved');
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to approve submission',
      );
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await reviewMutation.mutateAsync({
        submissionId: rejectTarget,
        payload: {
          status: 'rejected',
          rejectionReason: rejectionReason.trim(),
        },
      });
      toast.success('Submission rejected');
      setRejectTarget(null);
      setRejectionReason('');
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to reject submission',
      );
    }
  };

  if (isPromoLoading) return <LoadingSpinner />;
  if (!promo) {
    return (
      <EmptyState>
        <h3>Promo not found</h3>
        <p>The promo may have been removed or is unavailable.</p>
        <Link to='/dashboard/promos'>
          <Button variant='outline'>Back to promos</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <Page>
      <Header>
        <div>
          <Title>{promo.name}</Title>
          <Subtitle>{promo.slug}</Subtitle>
        </div>
        <ActionRow>
          <Link to={`/dashboard/promos/${promo._id}/edit`}>
            <Button variant='outline'>Edit promo</Button>
          </Link>
          <Link to='/dashboard/promos'>
            <Button variant='ghost'>Back</Button>
          </Link>
        </ActionRow>
      </Header>

      <Tabs>
        {TAB_OPTIONS.map((tab) => (
          <TabButton
            key={tab}
            type='button'
            $active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </TabButton>
        ))}
      </Tabs>

      {activeTab === 'overview' && (
        <Card>
          {promo?.banner?.url && (
            <Banner
              src={getOptimizedImageUrl(
                promo.banner.url,
                IMAGE_SLOTS.HOME_HERO,
              )}
              alt={promo.name}
            />
          )}
          <Grid>
            <InfoItem>
              <Label>Type</Label>
              <Value>{promo.type}</Value>
            </InfoItem>
            <InfoItem>
              <Label>Status</Label>
              <Value>{promo.status}</Value>
            </InfoItem>
            <InfoItem>
              <Label>Start date</Label>
              <Value>{formatDateTime(promo.startDate)}</Value>
            </InfoItem>
            <InfoItem>
              <Label>End date</Label>
              <Value>{formatDateTime(promo.endDate)}</Value>
            </InfoItem>
            <InfoItem>
              <Label>Min discount</Label>
              <Value>{promo.minDiscountPercent}%</Value>
            </InfoItem>
            <InfoItem>
              <Label>Max products/seller</Label>
              <Value>{promo.maxProductsPerSeller}</Value>
            </InfoItem>
            <InfoItem>
              <Label>Homepage visibility</Label>
              <Value>{promo.showOnHomepage ? 'Shown' : 'Hidden'}</Value>
            </InfoItem>
            <InfoItem>
              <Label>Countdown</Label>
              <Value>{promo.showCountdown ? 'Enabled' : 'Disabled'}</Value>
            </InfoItem>
          </Grid>
        </Card>
      )}

      {activeTab === 'submissions' && (
        <Card>
          <StatsRow>
            <StatCard>
              <Label>Total</Label>
              <Value>{submissionStats.total}</Value>
            </StatCard>
            <StatCard>
              <Label>Pending</Label>
              <Value>{submissionStats.pending}</Value>
            </StatCard>
            <StatCard>
              <Label>Approved</Label>
              <Value>{submissionStats.approved}</Value>
            </StatCard>
            <StatCard>
              <Label>Rejected</Label>
              <Value>{submissionStats.rejected}</Value>
            </StatCard>
          </StatsRow>

          {isSubmissionsLoading ? (
            <LoadingSpinner />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>Seller</Th>
                    <Th>Discount</Th>
                    <Th>Price</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {(submissions || []).map((submission) => (
                    <tr key={submission._id}>
                      <Td>{submission?.product?.name || 'Unknown product'}</Td>
                      <Td>
                        {submission?.seller?.shopName ||
                          submission?.seller?.businessName ||
                          'Unknown seller'}
                      </Td>
                      <Td>
                        {submission.discountType} {submission.discountValue}
                      </Td>
                      <Td>
                        {formatCurrency(submission.regularPrice)} {'->'}{' '}
                        {formatCurrency(submission.promoPrice)}
                      </Td>
                      <Td>
                        <StatusBadge $status={submission.status}>
                          {submission.status}
                        </StatusBadge>
                      </Td>
                      <Td>
                        {submission.status === 'pending' ? (
                          <InlineActions>
                            <Button
                              size='xs'
                              variant='success'
                              onClick={() => handleApprove(submission._id)}
                              disabled={reviewMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              size='xs'
                              variant='danger'
                              onClick={() => setRejectTarget(submission._id)}
                              disabled={reviewMutation.isPending}
                            >
                              Reject
                            </Button>
                          </InlineActions>
                        ) : (
                          '—'
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Card>
          <StatsRow>
            <StatCard>
              <Label>Views</Label>
              <Value>{promo?.analytics?.views ?? 0}</Value>
            </StatCard>
            <StatCard>
              <Label>Clicks</Label>
              <Value>{promo?.analytics?.clicks ?? 0}</Value>
            </StatCard>
            <StatCard>
              <Label>Total sales</Label>
              <Value>{promo?.analytics?.totalSales ?? 0}</Value>
            </StatCard>
            <StatCard>
              <Label>Total revenue</Label>
              <Value>{formatCurrency(promo?.analytics?.totalRevenue ?? 0)}</Value>
            </StatCard>
            <StatCard>
              <Label>Submission count</Label>
              <Value>{promo?.analytics?.submissionCount ?? 0}</Value>
            </StatCard>
            <StatCard>
              <Label>Approved count</Label>
              <Value>{promo?.analytics?.approvedCount ?? 0}</Value>
            </StatCard>
          </StatsRow>
        </Card>
      )}

      {rejectTarget && (
        <RejectOverlay onClick={() => setRejectTarget(null)}>
          <RejectCard onClick={(event) => event.stopPropagation()}>
            <h3>Reject submission</h3>
            <p>Provide a reason for the seller.</p>
            <RejectInput
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder='Reason for rejection'
            />
            <InlineActions>
              <Button
                variant='outline'
                onClick={() => setRejectTarget(null)}
                disabled={reviewMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant='danger'
                onClick={handleReject}
                loading={reviewMutation.isPending}
              >
                Submit rejection
              </Button>
            </InlineActions>
          </RejectCard>
        </RejectOverlay>
      )}
    </Page>
  );
}

const Page = styled.div`
  display: grid;
  gap: 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  margin: 0;
  color: #111827;
  font-size: 1.35rem;
`;

const Subtitle = styled.p`
  margin: 0.35rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const TabButton = styled.button`
  border: 1px solid ${({ $active }) => ($active ? '#e8920a' : '#d1d5db')};
  background: ${({ $active }) => ($active ? '#fdf3e3' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#b45309' : '#6b7280')};
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  cursor: pointer;
`;

const Card = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  display: grid;
  gap: 1rem;
`;

const Banner = styled.img`
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
`;

const Grid = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`;

const InfoItem = styled.div`
  display: grid;
  gap: 0.2rem;
`;

const Label = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const Value = styled.span`
  font-size: 0.92rem;
  color: #111827;
  font-weight: 600;
`;

const StatsRow = styled.div`
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
`;

const StatCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  background: #ffffff;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.65rem 0.8rem;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const Td = styled.td`
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid #f1f5f9;
  color: #111827;
  font-size: 0.84rem;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  text-transform: capitalize;
  font-size: 0.72rem;
  font-weight: 600;
  background: ${({ $status }) => {
    if ($status === 'approved') return '#dcfce7';
    if ($status === 'pending') return '#fef3c7';
    if ($status === 'rejected') return '#fee2e2';
    return '#f3f4f6';
  }};
  color: ${({ $status }) => {
    if ($status === 'approved') return '#166534';
    if ($status === 'pending') return '#92400e';
    if ($status === 'rejected') return '#b91c1c';
    return '#374151';
  }};
`;

const InlineActions = styled.div`
  display: inline-flex;
  gap: 0.4rem;
`;

const RejectOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 1200;
  padding: 1rem;
`;

const RejectCard = styled.div`
  width: min(100%, 420px);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 1rem;
  display: grid;
  gap: 0.7rem;

  h3 {
    margin: 0;
    color: #111827;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 0.84rem;
  }
`;

const RejectInput = styled.textarea`
  min-height: 84px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  font-size: 0.85rem;
  resize: vertical;
`;

const EmptyState = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem 1.25rem;
  text-align: center;
  display: grid;
  gap: 0.5rem;
  justify-items: center;

  h3,
  p {
    margin: 0;
  }
`;
