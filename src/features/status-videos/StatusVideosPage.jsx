import React, { useMemo, useState, useCallback } from "react";
import styled from "styled-components";
import { FaVideo, FaSyncAlt, FaChevronDown, FaChevronRight, FaPlay, FaEye, FaTimes } from "react-icons/fa";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import { useGetStatusFeed } from "../../shared/hooks/useStatusFeed";
import { getOptimizedImageUrl, IMAGE_SLOTS } from "../../shared/utils/cloudinaryConfig";

function findStatusInGroups(groups, statusId) {
  if (!groups || !statusId) return null;
  for (const g of groups) {
    const s = (g.statuses || []).find((x) => (x._id || x.id) === statusId);
    if (s) return s;
  }
  return null;
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount, currency = "GHS") {
  if (amount == null || amount === "") return "—";
  return new Intl.NumberFormat("en-GH", { style: "currency", currency }).format(Number(amount));
}

function getViewCount(s) {
  if (s == null) return 0;
  const v = s.viewCount ?? s.views;
  return Math.max(0, Number(v) || 0);
}

export default function StatusVideosPage() {
  const { data: groups, isLoading, error, refetch, isFetching } = useGetStatusFeed();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSellerId, setExpandedSellerId] = useState(null);
  const [playingStatus, setPlayingStatus] = useState(null);
  const [videoError, setVideoError] = useState(false);

  const handleViewVideo = useCallback((s) => {
    setVideoError(false);
    setPlayingStatus(s);
  }, []);

  const handleCloseVideoModal = useCallback(() => {
    setPlayingStatus(null);
    refetch();
  }, [refetch]);

  const filteredGroups = useMemo(() => {
    if (!Array.isArray(groups)) return [];
    if (!searchTerm.trim()) return groups;
    const term = searchTerm.toLowerCase();
    return groups.filter(
      (g) =>
        (g.seller?.shopName || "").toLowerCase().includes(term) ||
        (g.seller?.name || "").toLowerCase().includes(term)
    );
  }, [groups, searchTerm]);

  const totalStatuses = useMemo(
    () => filteredGroups.reduce((acc, g) => acc + (g.statuses?.length || 0), 0),
    [filteredGroups]
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <DashboardContainer>
        <Header>
          <Title>Status Videos</Title>
        </Header>
        <ErrorBox>Failed to load status videos: {error.message}</ErrorBox>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>
          <FaVideo style={{ marginRight: "0.5rem" }} />
          Status Videos
        </Title>
        <HeaderActions>
          <SearchInput
            type="text"
            placeholder="Search by seller name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <RefreshButton onClick={() => refetch()} disabled={isFetching}>
            <FaSyncAlt className={isFetching ? "spin" : ""} />
            {isFetching ? " Refreshing..." : " Refresh"}
          </RefreshButton>
        </HeaderActions>
      </Header>

      <SummaryBar>
        <SummaryItem>
          <strong>{filteredGroups.length}</strong> seller(s)
        </SummaryItem>
        <SummaryItem>
          <strong>{totalStatuses}</strong> status video(s)
        </SummaryItem>
        <SummaryItem>
          <strong>{filteredGroups.reduce((acc, g) => acc + (g.statuses || []).reduce((a, s) => a + (getViewCount(s)), 0), 0).toLocaleString()}</strong> total views
        </SummaryItem>
        <SummaryHint title="Views increment when a buyer watches ≥30% of the video (admin previews do not count)">
          <FaEye style={{ marginRight: "0.25rem" }} /> Views (buyer, ≥30%)
        </SummaryHint>
      </SummaryBar>

      {filteredGroups.length === 0 ? (
        <EmptyState>
          {searchTerm ? "No sellers match your search." : "No status videos yet."}
        </EmptyState>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th style={{ width: "40px" }} />
                <Th>Seller</Th>
                <Th>Videos</Th>
                <Th>Views (total)</Th>
                <Th>Latest</Th>
                <Th style={{ width: "40px" }} />
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => {
                const seller = group.seller || {};
                const statuses = group.statuses || [];
                const sellerId = (seller._id || seller.id || "").toString();
                const isExpanded = expandedSellerId === sellerId;
                const totalViews = statuses.reduce((acc, s) => acc + getViewCount(s), 0);
                const latestDate = statuses.length
                  ? statuses.reduce(
                      (max, s) =>
                        new Date(s.createdAt || 0) > new Date(max || 0) ? s.createdAt : max,
                      null
                    )
                  : null;

                return (
                  <React.Fragment key={sellerId}>
                    <tr>
                      <Td>
                        {seller.avatar ? (
                          <Avatar
                            src={getOptimizedImageUrl(seller.avatar, IMAGE_SLOTS.AVATAR)}
                            alt=""
                          />
                        ) : (
                          <AvatarPlaceholder>
                            {(seller.shopName || seller.name || "?").charAt(0).toUpperCase()}
                          </AvatarPlaceholder>
                        )}
                      </Td>
                      <Td>
                        <SellerName>{seller.shopName || seller.name || "—"}</SellerName>
                        {seller.isVerified && <VerifiedBadge>Verified</VerifiedBadge>}
                      </Td>
                      <Td>{statuses.length}</Td>
                      <Td>{totalViews.toLocaleString()}</Td>
                      <Td>{formatDate(latestDate)}</Td>
                      <Td>
                        <ExpandButton
                          type="button"
                          onClick={() =>
                            setExpandedSellerId(isExpanded ? null : sellerId)
                          }
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                        </ExpandButton>
                      </Td>
                    </tr>
                    {isExpanded && statuses.length > 0 && (
                      <tr key={`${sellerId}-detail`}>
                        <Td colSpan={6} style={{ padding: 0, verticalAlign: "top" }}>
                          <DetailPanel>
                            <DetailTitle>Status videos</DetailTitle>
                            <DetailTable>
                              <thead>
                                <tr>
                                  <DetailTh>Caption</DetailTh>
                                  <DetailTh>Product</DetailTh>
                                  <DetailTh>Views</DetailTh>
                                  <DetailTh>Created</DetailTh>
                                  <DetailTh style={{ width: "90px" }}>Actions</DetailTh>
                                </tr>
                              </thead>
                              <tbody>
                                {statuses.map((s) => (
                                  <tr key={s._id || s.id}>
                                    <DetailTd>
                                      {(s.caption || "—").slice(0, 60)}
                                      {(s.caption || "").length > 60 ? "…" : ""}
                                    </DetailTd>
                                    <DetailTd>
                                      {s.product?.name
                                        ? `${s.product.name} (${formatCurrency(s.product.price)})`
                                        : "—"}
                                    </DetailTd>
                                    <DetailTd>
                                      <ViewCountCell title="Views (buyer watches ≥30%)">
                                        {getViewCount(s).toLocaleString()}
                                      </ViewCountCell>
                                    </DetailTd>
                                    <DetailTd>{formatDate(s.createdAt)}</DetailTd>
                                    <DetailTd>
                                      <ViewVideoButton
                                        type="button"
                                        onClick={() => handleViewVideo(s)}
                                        disabled={!s.videoUrl}
                                        title="Preview video (admin views are not counted)"
                                      >
                                        <FaPlay /> View
                                      </ViewVideoButton>
                                    </DetailTd>
                                  </tr>
                                ))}
                              </tbody>
                            </DetailTable>
                          </DetailPanel>
                        </Td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
        </TableWrapper>
      )}

      {playingStatus && (
        <VideoModalBackdrop onClick={handleCloseVideoModal}>
          <VideoModalContent onClick={(e) => e.stopPropagation()}>
            <VideoModalHeader>
              <VideoModalTitle>Status video</VideoModalTitle>
              <CloseButton type="button" onClick={handleCloseVideoModal} aria-label="Close">
                <FaTimes />
              </CloseButton>
            </VideoModalHeader>
            <VideoWrapper>
              {playingStatus.videoUrl ? (
                <>
                  <VideoPlayer
                    key={String(playingStatus._id || playingStatus.id)}
                    src={playingStatus.videoUrl}
                    controls
                    playsInline
                    autoPlay
                    muted
                    preload="auto"
                    onEnded={() => {}}
                    onError={() => setVideoError(true)}
                    onLoadedData={() => setVideoError(false)}
                  />
                  {videoError && (
                    <VideoErrorOverlay>
                      Video could not be loaded. You can try opening the link in a new tab.
                      <VideoLink href={playingStatus.videoUrl} target="_blank" rel="noopener noreferrer">
                        Open video URL
                      </VideoLink>
                    </VideoErrorOverlay>
                  )}
                </>
              ) : (
                <VideoPlaceholder>No video URL</VideoPlaceholder>
              )}
            </VideoWrapper>
            <VideoMeta>
              <MetaRow>
                <MetaLabel>Views:</MetaLabel>
                <MetaValue>{getViewCount(playingStatus).toLocaleString()}</MetaValue>
              </MetaRow>
              {playingStatus.caption && (
                <MetaRow>
                  <MetaLabel>Caption:</MetaLabel>
                  <MetaValue>{playingStatus.caption}</MetaValue>
                </MetaRow>
              )}
              {playingStatus.product?.name && (
                <MetaRow>
                  <MetaLabel>Product:</MetaLabel>
                  <MetaValue>
                    {playingStatus.product.name}
                    {playingStatus.product.price != null && playingStatus.product.price !== "" && (
                      <> ({formatCurrency(playingStatus.product.price)})</>
                    )}
                  </MetaValue>
                </MetaRow>
              )}
              <MetaRow>
                <MetaLabel>Created:</MetaLabel>
                <MetaValue>{formatDate(playingStatus.createdAt)}</MetaValue>
              </MetaRow>
            </VideoMeta>
          </VideoModalContent>
        </VideoModalBackdrop>
      )}
    </DashboardContainer>
  );
}

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-grey-800, #1e293b);
  margin: 0;
  display: flex;
  align-items: center;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SearchInput = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-grey-200, #e2e8f0);
  border-radius: 8px;
  font-size: 0.875rem;
  min-width: 200px;
`;

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .spin {
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const SummaryBar = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-grey-50, #f8fafc);
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--color-grey-700, #334155);
`;

const SummaryItem = styled.span``;

const SummaryHint = styled.span`
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--color-grey-500, #64748b);
  display: inline-flex;
  align-items: center;
`;

const ErrorBox = styled.div`
  padding: 1rem;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 8px;
`;

const EmptyState = styled.p`
  padding: 2rem;
  text-align: center;
  color: var(--color-grey-500, #64748b);
  font-size: 0.9375rem;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border: 1px solid var(--color-grey-200, #e2e8f0);
  border-radius: 8px;
  background: white;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: var(--color-grey-700, #334155);
  border-bottom: 1px solid var(--color-grey-200, #e2e8f0);
  background: var(--color-grey-50, #f8fafc);
`;

const Td = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-grey-100, #f1f5f9);
  vertical-align: middle;
`;

const Avatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-grey-300, #cbd5e1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
`;

const SellerName = styled.span`
  font-weight: 500;
  color: var(--color-grey-800, #1e293b);
`;

const VerifiedBadge = styled.span`
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  background: #dcfce7;
  color: #166534;
  font-size: 0.7rem;
  border-radius: 999px;
  font-weight: 500;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: var(--color-grey-600, #475569);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  &:hover {
    background: var(--color-grey-100, #f1f5f9);
  }
`;

const DetailPanel = styled.div`
  padding: 1rem 1rem 1rem 3rem;
  background: var(--color-grey-50, #f8fafc);
  border-bottom: 1px solid var(--color-grey-200, #e2e8f0);
`;

const DetailTitle = styled.div`
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--color-grey-700, #334155);
  margin-bottom: 0.5rem;
`;

const DetailTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
`;

const DetailTh = styled.th`
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: var(--color-grey-600, #475569);
  border-bottom: 1px solid var(--color-grey-200, #e2e8f0);
`;

const DetailTd = styled.td`
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-grey-100, #f1f5f9);
  color: var(--color-grey-700, #334155);
`;

const ViewCountCell = styled.span`
  font-weight: 500;
  color: var(--color-grey-800, #1e293b);
`;

const ViewVideoButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  background: var(--color-primary, #2563eb);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const VideoModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const VideoModalContent = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const VideoModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-grey-200, #e2e8f0);
`;

const VideoModalTitle = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-grey-800, #1e293b);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--color-grey-600, #475569);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  &:hover {
    background: var(--color-grey-100, #f1f5f9);
  }
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  background: #000;
  aspect-ratio: 9 / 16;
  max-height: 70vh;
`;

const VideoPlayer = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
`;

const VideoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-grey-400, #94a3b8);
  font-size: 0.875rem;
`;

const VideoErrorOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  font-size: 0.875rem;
  text-align: center;
  gap: 0.75rem;
`;

const VideoLink = styled.a`
  color: #93c5fd;
  text-decoration: underline;
  &:hover {
    color: #bfdbfe;
  }
`;

const VideoMeta = styled.div`
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-grey-100, #f1f5f9);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MetaRow = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const MetaLabel = styled.span`
  color: var(--color-grey-500, #64748b);
  min-width: 100px;
`;

const MetaValue = styled.span`
  color: var(--color-grey-800, #1e293b);
`;
