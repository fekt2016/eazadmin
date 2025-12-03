import styled from "styled-components";
import { FiEdit, FiEye, FiSearch, FiTrash2, FiStar, FiCheck, FiX, FiFlag, FiEyeOff } from "react-icons/fi";
import { useMemo, useState } from "react";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import useReview from "../../shared/hooks/useReview";
import { toast } from "react-toastify";

export default function ReviewsPage() {
  const { 
    useGetAllReviews, 
    useDeleteReview,
    useApproveReview,
    useRejectReview,
    useFlagReview,
    useHideReview,
  } = useReview();
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationAction, setModerationAction] = useState(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const [flaggedReason, setFlaggedReason] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const { data, isLoading, error } = useGetAllReviews({ page, limit: 100 });

  const reviews = useMemo(() => {
    if (!data) return [];
    if (data?.data?.reviews) return data.data.reviews;
    if (data?.results) return data.results;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const deleteReviewMutation = useDeleteReview();
  const approveReviewMutation = useApproveReview();
  const rejectReviewMutation = useRejectReview();
  const flagReviewMutation = useFlagReview();
  const hideReviewMutation = useHideReview();

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortedReviews = (items) => {
    const sortableItems = [...items];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested properties
        if (sortConfig.key === "product") {
          aValue = a.product?.name || "";
          bValue = b.product?.name || "";
        } else if (sortConfig.key === "user") {
          aValue = a.user?.name || "";
          bValue = b.user?.name || "";
        } else if (sortConfig.key === "reviewDate" || sortConfig.key === "createdAt") {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  };

  // Filtering
  const filteredReviews = getSortedReviews(reviews).filter((review) => {
    const matchesSearch =
      (review.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.review || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating =
      ratingFilter === "all" || review.rating === parseInt(ratingFilter);

    const matchesStatus =
      statusFilter === "all" || review.status === statusFilter;

    return matchesSearch && matchesRating && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

  const handleDelete = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      try {
        await deleteReviewMutation.mutateAsync(reviewId);
      } catch (error) {
        console.error("Failed to delete review:", error);
      }
    }
  };

  const handleModerationAction = (review, action) => {
    setSelectedReview(review);
    setModerationAction(action);
    setModerationNotes("");
    setFlaggedReason("");
    setShowModerationModal(true);
  };

  const submitModerationAction = async () => {
    if (!selectedReview) return;

    try {
      switch (moderationAction) {
        case "approve":
          await approveReviewMutation.mutateAsync({
            id: selectedReview._id || selectedReview.id,
            moderationNotes,
          });
          break;
        case "reject":
          await rejectReviewMutation.mutateAsync({
            id: selectedReview._id || selectedReview.id,
            moderationNotes,
          });
          break;
        case "flag":
          if (!flaggedReason.trim()) {
            toast.error("Please provide a reason for flagging");
            return;
          }
          await flagReviewMutation.mutateAsync({
            id: selectedReview._id || selectedReview.id,
            flaggedReason,
            moderationNotes,
          });
          break;
        case "hide":
          await hideReviewMutation.mutateAsync({
            id: selectedReview._id || selectedReview.id,
            moderationNotes,
          });
          break;
      }
      setShowModerationModal(false);
      setSelectedReview(null);
      setModerationAction(null);
    } catch (error) {
      console.error("Moderation action failed:", error);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "approved":
        return { bg: "#dcfce7", color: "#166534" };
      case "pending":
        return { bg: "#fef9c3", color: "#854d0e" };
      case "rejected":
        return { bg: "#fee2e2", color: "#b91c1c" };
      case "flagged":
        return { bg: "#fef3c7", color: "#92400e" };
      default:
        return { bg: "#f1f5f9", color: "#64748b" };
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon key={i} filled={i < rating} />
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorContainer>Error: {error.message}</ErrorContainer>;

  return (
    <DashboardContainer>
      <Header>
        <Title>Reviews Management</Title>
        <Controls>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reviews, products, or users..."
            />
          </SearchContainer>
          <FilterSelect
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </FilterSelect>
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="flagged">Flagged</option>
          </FilterSelect>
        </Controls>
      </Header>

      <StatsContainer>
        <StatCard>
          <StatValue>{reviews.length}</StatValue>
          <StatLabel>Total Reviews</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>
            {reviews.length > 0
              ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
              : "0.0"}
          </StatValue>
          <StatLabel>Average Rating</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>
            {reviews.filter((r) => r.rating === 5).length}
          </StatValue>
          <StatLabel>5-Star Reviews</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>
            {reviews.filter((r) => r.rating <= 2).length}
          </StatValue>
          <StatLabel>Low Ratings (≤2)</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>
            {reviews.filter((r) => r.status === "pending").length}
          </StatValue>
          <StatLabel>Pending Reviews</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>
            {reviews.filter((r) => r.status === "flagged").length}
          </StatValue>
          <StatLabel>Flagged Reviews</StatLabel>
        </StatCard>
      </StatsContainer>

      <ReviewTable>
        <TableHeader>
          <HeaderRow>
            <HeaderCell>PRODUCT</HeaderCell>
            <HeaderCell>USER</HeaderCell>
            <SortableHeader onClick={() => requestSort("rating")}>
              RATING
              {sortConfig.key === "rating" &&
                (sortConfig.direction === "ascending" ? "↑" : "↓")}
            </SortableHeader>
            <HeaderCell>TITLE</HeaderCell>
            <HeaderCell>REVIEW</HeaderCell>
            <SortableHeader onClick={() => requestSort("reviewDate")}>
              DATE
              {sortConfig.key === "reviewDate" &&
                (sortConfig.direction === "ascending" ? "↑" : "↓")}
            </SortableHeader>
            <SortableHeader onClick={() => requestSort("status")}>
              STATUS
              {sortConfig.key === "status" &&
                (sortConfig.direction === "ascending" ? "↑" : "↓")}
            </SortableHeader>
            <HeaderCell>VERIFIED</HeaderCell>
            <HeaderCell>ACTIONS</HeaderCell>
          </HeaderRow>
        </TableHeader>

        <TableBody>
          {currentReviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan="9" style={{ textAlign: "center", padding: "3rem" }}>
                <NoResults>No reviews found matching your criteria</NoResults>
              </TableCell>
            </TableRow>
          ) : (
            currentReviews.map((review) => (
              <TableRow key={review._id || review.id}>
                <TableCell>
                  <ProductInfo>
                    <ProductName>
                      {review.product?.name || "Unknown Product"}
                    </ProductName>
                    {review.product?._id && (
                      <ProductId>ID: {review.product._id.slice(-8)}</ProductId>
                    )}
                  </ProductInfo>
                </TableCell>
                <TableCell>
                  <UserInfo>
                    <UserName>{review.user?.name || "Anonymous"}</UserName>
                    {review.user?.photo && (
                      <UserAvatar src={review.user.photo} alt={review.user.name} />
                    )}
                  </UserInfo>
                </TableCell>
                <TableCell>
                  <RatingContainer>
                    {renderStars(review.rating || 0)}
                    <RatingValue>{review.rating || 0}/5</RatingValue>
                  </RatingContainer>
                </TableCell>
                <TableCell>
                  <ReviewTitle>{review.title || "No title"}</ReviewTitle>
                </TableCell>
                <TableCell>
                  <ReviewText>
                    {review.review
                      ? review.review.length > 100
                        ? `${review.review.substring(0, 100)}...`
                        : review.review
                      : "No review text"}
                  </ReviewText>
                </TableCell>
                <TableCell>
                  <DateText>{formatDate(review.reviewDate || review.createdAt)}</DateText>
                </TableCell>
                <TableCell>
                  <StatusBadge 
                    $bg={getStatusBadgeColor(review.status || "pending").bg}
                    $color={getStatusBadgeColor(review.status || "pending").color}
                  >
                    {(review.status || "pending").toUpperCase()}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <VerifiedBadge verified={review.verifiedPurchase}>
                    {review.verifiedPurchase ? "✓ Verified" : "—"}
                  </VerifiedBadge>
                </TableCell>
                <TableCell>
                  <ActionButtons>
                    <ActionButton
                      title="View Details"
                      onClick={() => {
                        setSelectedReview(review);
                        setShowModerationModal(true);
                        setModerationAction("view");
                      }}
                    >
                      <FiEye />
                    </ActionButton>
                    {(review.status === "pending" || review.status === "flagged") && (
                      <ActionButton
                        title="Approve Review"
                        $success
                        onClick={() => handleModerationAction(review, "approve")}
                        disabled={approveReviewMutation.isPending}
                      >
                        <FiCheck />
                      </ActionButton>
                    )}
                    {review.status !== "rejected" && (
                      <ActionButton
                        title="Reject Review"
                        $warning
                        onClick={() => handleModerationAction(review, "reject")}
                        disabled={rejectReviewMutation.isPending}
                      >
                        <FiX />
                      </ActionButton>
                    )}
                    {review.status !== "flagged" && (
                      <ActionButton
                        title="Flag Review"
                        $warning
                        onClick={() => handleModerationAction(review, "flag")}
                        disabled={flagReviewMutation.isPending}
                      >
                        <FiFlag />
                      </ActionButton>
                    )}
                    {review.status === "approved" && (
                      <ActionButton
                        title="Hide Review"
                        onClick={() => handleModerationAction(review, "hide")}
                        disabled={hideReviewMutation.isPending}
                      >
                        <FiEyeOff />
                      </ActionButton>
                    )}
                    <ActionButton
                      title="Delete Review"
                      danger
                      onClick={() => handleDelete(review._id || review.id)}
                      disabled={deleteReviewMutation.isPending}
                    >
                      <FiTrash2 />
                    </ActionButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </ReviewTable>

      {filteredReviews.length > 0 && (
        <Pagination>
          <PageInfo>
            Showing {Math.min(indexOfFirstItem + 1, filteredReviews.length)}-
            {Math.min(indexOfLastItem, filteredReviews.length)} of{" "}
            {filteredReviews.length} reviews
          </PageInfo>
          <PageControls>
            <PageButton
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </PageButton>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PageButton
                key={pageNum}
                active={page === pageNum}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </PageButton>
            ))}
            <PageButton
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </PageButton>
          </PageControls>
        </Pagination>
      )}

      {/* Moderation Modal */}
      {showModerationModal && selectedReview && (
        <ModalOverlay onClick={() => {
          setShowModerationModal(false);
          setSelectedReview(null);
          setModerationAction(null);
        }}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {moderationAction === "view" && "Review Details"}
                {moderationAction === "approve" && "Approve Review"}
                {moderationAction === "reject" && "Reject Review"}
                {moderationAction === "flag" && "Flag Review"}
                {moderationAction === "hide" && "Hide Review"}
              </ModalTitle>
              <CloseButton onClick={() => {
                setShowModerationModal(false);
                setSelectedReview(null);
                setModerationAction(null);
              }}>×</CloseButton>
            </ModalHeader>
            
            {moderationAction === "view" ? (
              <ModalBody>
                <ReviewDetailSection>
                  <DetailLabel>Product:</DetailLabel>
                  <DetailValue>{selectedReview.product?.name || "N/A"}</DetailValue>
                </ReviewDetailSection>
                <ReviewDetailSection>
                  <DetailLabel>User:</DetailLabel>
                  <DetailValue>{selectedReview.user?.name || "Anonymous"}</DetailValue>
                </ReviewDetailSection>
                <ReviewDetailSection>
                  <DetailLabel>Rating:</DetailLabel>
                  <DetailValue>{selectedReview.rating}/5</DetailValue>
                </ReviewDetailSection>
                <ReviewDetailSection>
                  <DetailLabel>Title:</DetailLabel>
                  <DetailValue>{selectedReview.title || "No title"}</DetailValue>
                </ReviewDetailSection>
                <ReviewDetailSection>
                  <DetailLabel>Review:</DetailLabel>
                  <DetailValue>{selectedReview.review || "No review text"}</DetailValue>
                </ReviewDetailSection>
                <ReviewDetailSection>
                  <DetailLabel>Status:</DetailLabel>
                  <StatusBadge 
                    $bg={getStatusBadgeColor(selectedReview.status || "pending").bg}
                    $color={getStatusBadgeColor(selectedReview.status || "pending").color}
                  >
                    {(selectedReview.status || "pending").toUpperCase()}
                  </StatusBadge>
                </ReviewDetailSection>
                {selectedReview.moderationNotes && (
                  <ReviewDetailSection>
                    <DetailLabel>Moderation Notes:</DetailLabel>
                    <DetailValue>{selectedReview.moderationNotes}</DetailValue>
                  </ReviewDetailSection>
                )}
                {selectedReview.flaggedReason && (
                  <ReviewDetailSection>
                    <DetailLabel>Flagged Reason:</DetailLabel>
                    <DetailValue>{selectedReview.flaggedReason}</DetailValue>
                  </ReviewDetailSection>
                )}
              </ModalBody>
            ) : (
              <ModalBody>
                {moderationAction === "flag" && (
                  <ModalInputGroup>
                    <ModalLabel>Flagged Reason *</ModalLabel>
                    <ModalTextArea
                      value={flaggedReason}
                      onChange={(e) => setFlaggedReason(e.target.value)}
                      placeholder="Enter reason for flagging this review..."
                      rows={3}
                    />
                  </ModalInputGroup>
                )}
                <ModalInputGroup>
                  <ModalLabel>Moderation Notes {moderationAction === "flag" ? "(Optional)" : ""}</ModalLabel>
                  <ModalTextArea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    placeholder="Add any notes about this action..."
                    rows={4}
                  />
                </ModalInputGroup>
                <ModalActions>
                  <ModalButton
                    $secondary
                    onClick={() => {
                      setShowModerationModal(false);
                      setSelectedReview(null);
                      setModerationAction(null);
                    }}
                  >
                    Cancel
                  </ModalButton>
                  <ModalButton
                    $primary
                    onClick={submitModerationAction}
                    disabled={
                      (moderationAction === "flag" && !flaggedReason.trim()) ||
                      (moderationAction === "approve" && approveReviewMutation.isPending) ||
                      (moderationAction === "reject" && rejectReviewMutation.isPending) ||
                      (moderationAction === "flag" && flagReviewMutation.isPending) ||
                      (moderationAction === "hide" && hideReviewMutation.isPending)
                    }
                  >
                    {moderationAction === "approve" && "Approve"}
                    {moderationAction === "reject" && "Reject"}
                    {moderationAction === "flag" && "Flag"}
                    {moderationAction === "hide" && "Hide"}
                  </ModalButton>
                </ModalActions>
              </ModalBody>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </DashboardContainer>
  );
}

// Styled Components
const DashboardContainer = styled.div`
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #1e293b;
  margin: 0;
  font-weight: 700;
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;

  &:focus-within {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const SearchIcon = styled(FiSearch)`
  color: #94a3b8;
  font-size: 1.2rem;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  padding: 0.5rem;
  font-size: 1rem;
  min-width: 250px;
  color: #334155;

  &::placeholder {
    color: #94a3b8;
  }
`;

const FilterSelect = styled.select`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  background: white;
  font-size: 1rem;
  cursor: pointer;
  color: #334155;
  transition: all 0.3s ease;

  &:hover {
    border-color: #cbd5e1;
  }

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    outline: none;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ReviewTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
`;

const TableHeader = styled.thead`
  background-color: #f1f5f9;
`;

const HeaderRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;
`;

const SortableHeader = styled.th`
  padding: 1.2rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e2e8f0;
  }
`;

const HeaderCell = styled.th`
  padding: 1.2rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8fafc;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1.2rem 1.5rem;
  color: #334155;
  font-size: 0.95rem;
  vertical-align: middle;
`;

const ProductInfo = styled.div``;

const ProductName = styled.div`
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const ProductId = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserName = styled.div`
  font-weight: 500;
  color: #1e293b;
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StarIcon = styled(FiStar)`
  color: ${({ filled }) => (filled ? "#fbbf24" : "#e2e8f0")};
  fill: ${({ filled }) => (filled ? "#fbbf24" : "none")};
  font-size: 1rem;
`;

const RatingValue = styled.span`
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
`;

const ReviewTitle = styled.div`
  font-weight: 500;
  color: #1e293b;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ReviewText = styled.div`
  color: #64748b;
  max-width: 300px;
  line-height: 1.5;
`;

const DateText = styled.div`
  color: #64748b;
  font-size: 0.875rem;
`;

const VerifiedBadge = styled.span`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.75rem;
  background: ${({ verified }) => (verified ? "#dcfce7" : "#f1f5f9")};
  color: ${({ verified }) => (verified ? "#166534" : "#64748b")};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  background: ${({ danger, $success, $warning }) => 
    danger ? "#fee2e2" : 
    $success ? "#dcfce7" : 
    $warning ? "#fef3c7" : 
    "#f1f5f9"};
  color: ${({ danger, $success, $warning }) => 
    danger ? "#dc2626" : 
    $success ? "#166534" : 
    $warning ? "#92400e" : 
    "#475569"};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;

  &:hover:not(:disabled) {
    background: ${({ danger, $success, $warning }) => 
      danger ? "#fecaca" : 
      $success ? "#bbf7d0" : 
      $warning ? "#fde68a" : 
      "#e2e8f0"};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.75rem;
  background: ${({ $bg }) => $bg || "#f1f5f9"};
  color: ${({ $color }) => $color || "#64748b"};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ReviewDetailSection = styled.div`
  margin-bottom: 1.5rem;
`;

const DetailLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailValue = styled.div`
  font-size: 1rem;
  color: #1e293b;
  line-height: 1.5;
`;

const ModalInputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const ModalLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
`;

const ModalTextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const ModalButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${({ $primary, $secondary }) => {
    if ($primary) {
      return `
        background: #6366f1;
        color: white;
        &:hover:not(:disabled) {
          background: #4f46e5;
        }
      `;
    }
    if ($secondary) {
      return `
        background: #f1f5f9;
        color: #475569;
        &:hover:not(:disabled) {
          background: #e2e8f0;
        }
      `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NoResults = styled.div`
  color: #64748b;
  font-size: 1rem;
`;

const ErrorContainer = styled.div`
  padding: 2rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  margin: 2rem;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageInfo = styled.div`
  color: #64748b;
  font-size: 0.875rem;
`;

const PageControls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PageButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: ${({ active }) => (active ? "#6366f1" : "white")};
  color: ${({ active }) => (active ? "white" : "#475569")};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;

  &:hover:not(:disabled) {
    border-color: #6366f1;
    background: ${({ active }) => (active ? "#6366f1" : "#f8fafc")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

