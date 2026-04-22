import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Button from '../../shared/components/Button';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import {
  useAdminPromos,
  useCancelAdminPromo,
  useUpdateAdminPromo,
} from '../../shared/hooks/useAdminPromos';
import { getOptimizedImageUrl, IMAGE_SLOTS } from '../../shared/utils/cloudinaryConfig';

const STATUS_OPTIONS = [
  { value: '', label: 'All status' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'ended', label: 'Ended' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'flash', label: 'Flash' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'seasonal', label: 'Seasonal' },
];

const formatRange = (start, end) => {
  if (!start || !end) return '—';
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return '—';
  }
  const fmt = new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return `${fmt.format(startDate)} — ${fmt.format(endDate)}`;
};

const isWithinDateRange = (promo, start, end) => {
  if (!start && !end) return true;
  const promoStart = new Date(promo.startDate);
  const promoEnd = new Date(promo.endDate);
  if (Number.isNaN(promoStart.getTime()) || Number.isNaN(promoEnd.getTime())) {
    return false;
  }
  if (start) {
    const startDate = new Date(start);
    if (!Number.isNaN(startDate.getTime()) && promoEnd < startDate) return false;
  }
  if (end) {
    const endDate = new Date(end);
    if (!Number.isNaN(endDate.getTime()) && promoStart > endDate) return false;
  }
  return true;
};

const isVisibleToSellers = (statusValue) =>
  ['scheduled', 'active', 'ended', 'cancelled'].includes(
    String(statusValue || '').toLowerCase(),
  );

export default function PromosListPage() {
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useAdminPromos({
    status,
    type,
    search: search.trim() || undefined,
    page,
    limit,
  });

  const cancelPromoMutation = useCancelAdminPromo();
  const updatePromoMutation = useUpdateAdminPromo();

  const promos = useMemo(() => {
    const list = data?.promos || [];
    return list.filter((promo) => isWithinDateRange(promo, startDate, endDate));
  }, [data?.promos, startDate, endDate]);

  const totalPages = data?.totalPages || 1;

  const handleCancelPromo = async (id) => {
    try {
      await cancelPromoMutation.mutateAsync(id);
      toast.success('Promo cancelled');
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to cancel promo',
      );
    }
  };

  const handleHomepageToggle = async (promo) => {
    try {
      await updatePromoMutation.mutateAsync({
        id: promo._id,
        payload: { showOnHomepage: !promo.showOnHomepage },
      });
      toast.success('Homepage setting updated');
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to update homepage setting',
      );
    }
  };

  return (
    <Page>
      <Header>
        <div>
          <Title>Promos</Title>
          <Subtitle>Manage campaigns, flash deals, and seasonal promos.</Subtitle>
        </div>
        <Link to='/dashboard/promos/new'>
          <Button leftIcon={<FaPlus />}>Create Promo</Button>
        </Link>
      </Header>

      <FilterBar>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setPage(1);
          }}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Input
          type='text'
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder='Search promo by name or slug'
        />

        <Input
          type='date'
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <Input
          type='date'
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </FilterBar>

      {isLoading ? (
        <LoadingSpinner />
      ) : promos.length === 0 ? (
        <EmptyState>
          <EmptyTitle>No promos yet</EmptyTitle>
          <EmptyText>Create your first promo to start campaign curation.</EmptyText>
          <Link to='/dashboard/promos/new'>
            <Button leftIcon={<FaPlus />}>Create your first promo</Button>
          </Link>
        </EmptyState>
      ) : (
        <>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Date range</Th>
                  <Th>Submissions</Th>
                  <Th>Homepage</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {promos.map((promo) => {
                  const submissions =
                    promo?.analytics?.submissionCount ?? promo?.submissionCount ?? 0;
                  const approved =
                    promo?.analytics?.approvedCount ?? promo?.approvedCount ?? 0;
                  const canEdit =
                    promo.status === 'draft' || promo.status === 'scheduled';
                  return (
                    <tr key={promo._id}>
                      <Td>
                        <PromoCell>
                          {promo?.banner?.url ? (
                            <Thumb
                              src={getOptimizedImageUrl(
                                promo.banner.url,
                                IMAGE_SLOTS.TABLE_THUMB,
                              )}
                              alt={promo.name}
                            />
                          ) : (
                            <ThumbFallback>PR</ThumbFallback>
                          )}
                          <div>
                            <PromoName>{promo.name}</PromoName>
                            <PromoSlug>{promo.slug}</PromoSlug>
                          </div>
                        </PromoCell>
                      </Td>
                      <Td>
                        <Badge $variant='type'>{promo.type}</Badge>
                      </Td>
                      <Td>
                        <StatusCell>
                          <Badge $variant={promo.status}>{promo.status}</Badge>
                          <Badge
                            $variant={
                              isVisibleToSellers(promo.status)
                                ? 'sellerVisible'
                                : 'sellerHidden'
                            }
                          >
                            {isVisibleToSellers(promo.status)
                              ? 'Visible to sellers'
                              : 'Hidden from sellers'}
                          </Badge>
                        </StatusCell>
                      </Td>
                      <Td>{formatRange(promo.startDate, promo.endDate)}</Td>
                      <Td>
                        {submissions} / {approved} approved
                      </Td>
                      <Td>
                        <SwitchButton
                          type='button'
                          $active={Boolean(promo.showOnHomepage)}
                          onClick={() => handleHomepageToggle(promo)}
                        >
                          {promo.showOnHomepage ? 'On' : 'Off'}
                        </SwitchButton>
                      </Td>
                      <Td>
                        <Actions>
                          <Link to={`/dashboard/promos/${promo._id}`}>
                            <Button size='xs' variant='secondary'>
                              View
                            </Button>
                          </Link>
                          <Link to={`/dashboard/promos/${promo._id}/edit`}>
                            <Button size='xs' variant='outline' disabled={!canEdit}>
                              Edit
                            </Button>
                          </Link>
                          <Button
                            size='xs'
                            variant='danger'
                            onClick={() => handleCancelPromo(promo._id)}
                            disabled={cancelPromoMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </Actions>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
          <Pagination>
            <Button
              size='xs'
              variant='outline'
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <PageText>
              Page {page} of {totalPages}
            </PageText>
            <Button
              size='xs'
              variant='outline'
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </Pagination>
        </>
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
  margin: 0.3rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

const FilterBar = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.6rem;
`;

const Input = styled.input`
  height: 2.25rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 0.65rem;
  font-size: 0.84rem;
  color: #111827;
  background: #ffffff;
`;

const Select = styled.select`
  height: 2.25rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 0.65rem;
  font-size: 0.84rem;
  color: #111827;
  background: #ffffff;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.7rem 0.8rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 0.8rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.84rem;
  color: #111827;
  vertical-align: middle;
`;

const PromoCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

const Thumb = styled.img`
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const ThumbFallback = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  display: grid;
  place-items: center;
  color: #9ca3af;
  font-size: 0.7rem;
  font-weight: 700;
`;

const PromoName = styled.div`
  font-weight: 600;
  color: #111827;
`;

const PromoSlug = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: capitalize;
  background: ${({ $variant }) => {
    if ($variant === 'active') return '#dcfce7';
    if ($variant === 'scheduled') return '#dbeafe';
    if ($variant === 'cancelled') return '#fee2e2';
    if ($variant === 'type') return '#fef3c7';
    if ($variant === 'sellerVisible') return '#eef2ff';
    if ($variant === 'sellerHidden') return '#fef2f2';
    return '#f3f4f6';
  }};
  color: ${({ $variant }) => {
    if ($variant === 'active') return '#166534';
    if ($variant === 'scheduled') return '#1d4ed8';
    if ($variant === 'cancelled') return '#b91c1c';
    if ($variant === 'type') return '#92400e';
    if ($variant === 'sellerVisible') return '#4338ca';
    if ($variant === 'sellerHidden') return '#b91c1c';
    return '#374151';
  }};
`;

const StatusCell = styled.div`
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SwitchButton = styled.button`
  border: 1px solid ${({ $active }) => ($active ? '#10b981' : '#d1d5db')};
  background: ${({ $active }) => ($active ? '#d1fae5' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#047857' : '#6b7280')};
  border-radius: 999px;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
`;

const Actions = styled.div`
  display: inline-flex;
  gap: 0.35rem;
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
`;

const EmptyTitle = styled.h3`
  margin: 0;
  color: #111827;
`;

const EmptyText = styled.p`
  margin: 0;
  color: #6b7280;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.6rem;
`;

const PageText = styled.span`
  font-size: 0.82rem;
  color: #6b7280;
`;
