import styled from "styled-components";
// import { Search, MoreVert, Visibility, Edit, Delete } from '@mui/icons-material';
import { FiEdit, FiEye, FiSearch, FiTrash2, FiCheck, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import useProduct from "../../shared/hooks/useProduct";
import { useEazShop } from "../../shared/hooks/useEazShop";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import { PATHS } from "../../routes/routePath";
import { toast } from "react-toastify";
import { FaAward } from "react-icons/fa";
import { ConfirmationModal } from "../../shared/components/Modal/ConfirmationModal";
import { getOptimizedImageUrl, IMAGE_SLOTS } from "../../shared/utils/cloudinaryConfig";
import OptimizedImage from "../../shared/components/OptimizedImage";
import React, { memo, useCallback, useMemo, useState } from "react";
import { PageHeader, PageTitle, HeaderActions } from "../../shared/components/page/PageHeader";

const T = {
  primary: 'var(--color-primary-600)',
  primaryLight: 'var(--color-primary-500)',
  primaryBg: 'var(--color-primary-100)',
  border: 'var(--color-border)',
  cardBg: 'var(--color-card-bg)',
  bodyBg: 'var(--color-body-bg)',
  text: 'var(--color-grey-900)',
  textMuted: 'var(--color-grey-500)',
  textLight: 'var(--color-grey-400)',
  radius: 'var(--border-radius-xl)',
  radiusSm: 'var(--border-radius-md)',
  shadow: 'var(--shadow-sm)',
  shadowMd: 'var(--shadow-md)',
};

// Helper function to calculate total stock from variants
const calculateTotalStock = (product) => {
  if (product.totalStock !== undefined && product.totalStock !== null) {
    return product.totalStock;
  }
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce((sum, variant) => {
      return sum + (variant.stock || 0);
    }, 0);
  }
  return 0;
};

// Memoized Product Row Component
const ProductRow = memo(({
  product,
  onApprove,
  onReject,
  onView,
  onEdit,
  onMarkEazShop,
  onDelete,
  approvePending,
  rejectPending,
  markEazShopPending,
  deletePending
}) => {
  const productId = product.id || product._id;

  return (
    <TableRow key={productId}>
      <TableCell>
        <div className="table-thumb-container" style={{ width: '50px' }}>
          <OptimizedImage
            src={product.imageCover || (product.images && product.images[0])}
            slot={IMAGE_SLOTS.TABLE_THUMB}
            aspectRatio="1/1"
            alt={product.name}
            radius="8px"
          />
        </div>
      </TableCell>
      <TableCell>
        <ProductName>{product.name}</ProductName>
      </TableCell>
      <TableCell>
        <SellerInfo>{product.seller?.shopName || product.seller?.name || "N/A"}</SellerInfo>
      </TableCell>
      <TableCell>
        <PriceInfo>₵{product.price?.toFixed(2) || "0.00"}</PriceInfo>
      </TableCell>
      <TableCell>
        <StockIndicator stock={product.totalStock || calculateTotalStock(product)}>
          {(product.totalStock || calculateTotalStock(product)) > 0
            ? (product.totalStock || calculateTotalStock(product))
            : "Out of stock"}
        </StockIndicator>
      </TableCell>
      <TableCell>
        <CategoryInfo>
          {product.parentCategory?.name ||
            product.subCategory?.name ||
            "Uncategorized"}
        </CategoryInfo>
      </TableCell>
      <TableCell>
        <StatusPill status={product.status}>
          {product.status?.replace("-", " ") || "active"}
        </StatusPill>
      </TableCell>
      <TableCell>
        {product.isPreOrder ? (
          <PreOrderBadge>
            {product.preOrderOriginCountry ? `Pre-Order (${product.preOrderOriginCountry})` : 'Pre-Order'}
          </PreOrderBadge>
        ) : (
          <span style={{ color: '#94a3b8' }}>Regular</span>
        )}
      </TableCell>
      <TableCell>
        <ModerationPill status={product.moderationStatus || "pending"}>
          {product.moderationStatus || "pending"}
        </ModerationPill>
      </TableCell>
      <TableCell>
        <ActionButtons>
          {product.moderationStatus === "pending" && (
            <>
              <ActionButton
                title="Approve Product"
                $approve
                onClick={() => onApprove(product.id || product._id, product.name)}
                disabled={approvePending}
              >
                <FiCheck />
              </ActionButton>
              <ActionButton
                title="Reject Product"
                $reject
                onClick={() => onReject(product.id || product._id, product.name)}
                disabled={rejectPending}
              >
                <FiX />
              </ActionButton>
            </>
          )}
          <ActionButton
            title="View"
            onClick={() => onView(product.id || product._id)}
          >
            <FiEye />
          </ActionButton>
          <ActionButton
            title="Edit"
            onClick={() => onEdit(product.id || product._id)}
          >
            <FiEdit />
          </ActionButton>
          {!product.isEazShopProduct && (
            <ActionButton
              title="Mark as Saiisai Product"
              onClick={() => onMarkEazShop(product.id || product._id)}
              $eazshop
              disabled={markEazShopPending}
            >
              <FaAward />
            </ActionButton>
          )}
          <ActionButton
            title="Delete"
            danger
            onClick={() => onDelete(product.id || product._id)}
            disabled={deletePending}
          >
            {deletePending ? "..." : <FiTrash2 />}
          </ActionButton>
        </ActionButtons>
      </TableCell>
    </TableRow>
  );
});

export default function AllProductPage() {
  const navigate = useNavigate();
  const { getProducts, approveProduct, rejectProduct, deleteProduct } = useProduct();
  const { data, isLoading: productLoading, error: productError } = getProducts;

  const { useMarkProductAsEazShop } = useEazShop();
  const markAsEazShopMutation = useMarkProductAsEazShop();

  const products = useMemo(() => {
    // Handle different response structures
    if (!data) {
      return [];
    }

    // Backend returns: { status: 'success', results: number, total: number, data: { data: products[] } }
    // Check for nested data.data.data (from getAllProduct controller)
    if (data.data?.data && Array.isArray(data.data.data)) {
      return data.data.data;
    }

    // Check for data.data.products
    if (data.data?.products && Array.isArray(data.data.products)) {
      return data.data.products;
    }

    // Check for data.products
    if (data.products && Array.isArray(data.products)) {
      return data.products;
    }

    // Check for data.results (if it's an array, not just a count)
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    }

    // Check if data itself is an array
    if (Array.isArray(data)) {
      return data;
    }

    // Check for data.data as array
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  }, [data]);
  // const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [moderationFilter, setModerationFilter] = useState("all"); // New filter for moderation status
  const [activeTab, setActiveTab] = useState("all"); // Tab: "all", "approved", "unapproved"
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [rejectModal, setRejectModal] = useState({ open: false, productId: null, productName: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [actionModalConfig, setActionModalConfig] = useState({ isOpen: false, type: null, payload: null });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  const getSortedProducts = (items) => {
    const sortableItems = [...items];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  };
  // Filtering
  const filteredProducts = getSortedProducts(products).filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.seller?.shopName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (product.parentCategory?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (product.subCategory?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || (product.status || "active") === statusFilter;
    const matchesModeration =
      moderationFilter === "all" || (product.moderationStatus || "pending") === moderationFilter;

    // Tab filtering - handle null/undefined moderationStatus
    const moderationStatus = (product.moderationStatus || "").toLowerCase();
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "approved" && (moderationStatus === "approved")) ||
      (activeTab === "unapproved" && (moderationStatus === "pending" || moderationStatus === "rejected" || !moderationStatus));

    return matchesSearch && matchesStatus && matchesModeration && matchesTab;
  });

  // Pagination
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleDelete = useCallback((productId) => {
    if (!productId) {
      toast.error("Product ID is missing");
      return;
    }
    setActionModalConfig({ isOpen: true, type: 'delete', payload: productId });
  }, []);

  const handleMarkAsEazShop = useCallback((productId) => {
    setActionModalConfig({ isOpen: true, type: 'markEazShop', payload: productId });
  }, []);

  const handleApproveProduct = useCallback((productId, productName) => {
    setActionModalConfig({ isOpen: true, type: 'approve', payload: { id: productId, name: productName } });
  }, []);

  const confirmAction = async () => {
    const { type, payload } = actionModalConfig;
    if (!type || !payload) return;

    try {
      if (type === 'delete') {
        const result = await deleteProduct.mutateAsync(payload);
        const message = result?.message || result?.data?.note || "Product removed from marketplace";
        toast.success(message);
      } else if (type === 'markEazShop') {
        await markAsEazShopMutation.mutateAsync(payload);
        toast.success("Product marked as Saiisai product!");
      } else if (type === 'approve') {
        await approveProduct.mutateAsync({ productId: payload.id, notes: "" });
        toast.success("Product approved successfully!");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to perform action";
      toast.error(`Failed: ${errorMessage}`);
      console.error(`Action error [${type}]:`, error);
    } finally {
      setActionModalConfig({ isOpen: false, type: null, payload: null });
    }
  };

  const handleRejectProduct = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await rejectProduct.mutateAsync({
        productId: rejectModal.productId,
        reason: rejectReason,
        notes: rejectReason
      });
      toast.success("Product rejected successfully!");
      setRejectModal({ open: false, productId: null, productName: "" });
      setRejectReason("");
    } catch (error) {
      toast.error("Failed to reject product: " + (error.response?.data?.message || error.message || "Unknown error"));
    }
  };

  const openRejectModal = (productId, productName) => {
    setRejectModal({ open: true, productId, productName });
    setRejectReason("");
  };

  const closeRejectModal = () => {
    setRejectModal({ open: false, productId: null, productName: "" });
    setRejectReason("");
  };

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  if (productLoading) return <LoadingSpinner />;
  if (productError) {
    return (
      <DashboardContainer>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Error loading products</h2>
          <p>{productError.message}</p>
        </div>
      </DashboardContainer>
    );
  }

  // Count products by tab - handle null/undefined moderationStatus
  const approvedCount = products.filter(p => {
    const status = (p.moderationStatus || "").toLowerCase();
    return status === "approved";
  }).length;
  const unapprovedCount = products.filter(p => {
    const status = (p.moderationStatus || "").toLowerCase();
    return status === "pending" || status === "rejected" || !status;
  }).length;

  return (
    <DashboardContainer>
      <PageHeader>
        <div>
          <PageTitle>All Products</PageTitle>
        </div>
        <HeaderActions>
          <Controls>
            <SearchContainer>
              <SearchIcon />
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
              />
            </SearchContainer>
            <FilterSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="outOfStock">Out of Stock</option>
            </FilterSelect>
            <FilterSelect
              value={moderationFilter}
              onChange={(e) => setModerationFilter(e.target.value)}
            >
              <option value="all">All Moderation</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </FilterSelect>
          </Controls>
        </HeaderActions>
      </PageHeader>

      {/* Tabs */}
      <TabsContainer>
        <TabButton
          $active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        >
          All Products ({products.length})
        </TabButton>
        <TabButton
          $active={activeTab === "approved"}
          onClick={() => setActiveTab("approved")}
        >
          Approved ({approvedCount})
        </TabButton>
        <TabButton
          $active={activeTab === "unapproved"}
          onClick={() => setActiveTab("unapproved")}
        >
          Unapproved ({unapprovedCount})
        </TabButton>
      </TabsContainer>

      <ProductTable>
        <TableHeader>
          <HeaderRow>
            <HeaderCell>IMAGE</HeaderCell>
            <SortableHeader onClick={() => requestSort("name")}>
              PRODUCT
              {sortConfig.key === "name" &&
                (sortConfig.direction === "ascending" ? "↑" : "↓")}
            </SortableHeader>
            <SortableHeader onClick={() => requestSort("vendor")}>
              SELLER
              {sortConfig.key === "vendor" &&
                (sortConfig.direction === "ascending" ? "↑" : "↓")}
            </SortableHeader>
            <SortableHeader onClick={() => requestSort("price")}>
              PRICE
              {sortConfig.key === "price" &&
                (sortConfig.direction === "ascending" ? "↑" : "↓")}
            </SortableHeader>
            <SortableHeader onClick={() => requestSort("stock")}>
              STOCK
              {sortConfig.key === "stock" &&
                (sortConfig.direction === "ascending" ? "↑" : "↓")}
            </SortableHeader>
            <HeaderCell>CATEGORY</HeaderCell>
            <HeaderCell>STATUS</HeaderCell>
            <HeaderCell>PRE-ORDER</HeaderCell>
            <HeaderCell>MODERATION</HeaderCell>
            <HeaderCell>ACTIONS</HeaderCell>
          </HeaderRow>
        </TableHeader>

        <TableBody>
          {currentProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} style={{ textAlign: 'center', padding: '2rem' }}>
                No products found. {products.length === 0 ? 'No products loaded from API.' : `Filtered from ${products.length} total products.`}
              </TableCell>
            </TableRow>
          ) : (
            currentProducts.map((product) => (
              <ProductRow
                key={product.id || product._id}
                product={product}
                onApprove={handleApproveProduct}
                onReject={openRejectModal}
                onView={(id) => navigate(`/dashboard/${PATHS.PRODUCTDETAILS.replace(':id', id)}`)}
                onEdit={(id) => navigate(`/dashboard/${PATHS.PRODUCTDETAILS.replace(':id', id)}`)}
                onMarkEazShop={handleMarkAsEazShop}
                onDelete={handleDelete}
                approvePending={approveProduct.isPending}
                rejectPending={rejectProduct.isPending}
                markEazShopPending={markAsEazShopMutation.isPending}
                deletePending={deleteProduct.isPending}
              />
            ))
          )}
        </TableBody>
      </ProductTable>
      {filteredProducts.length === 0 ? (
        <NoResults>No products found matching your criteria</NoResults>
      ) : (
        <Pagination>
          <PageInfo>
            Showing {Math.min(indexOfFirstItem + 1, filteredProducts.length)}-
            {Math.min(indexOfLastItem, filteredProducts.length)} of{" "}
            {filteredProducts.length} products
          </PageInfo>
          <PageControls>
            <PageButton
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </PageButton>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <PageButton
                  key={pageNum}
                  active={page === pageNum}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </PageButton>
              )
            )}
            <PageButton
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </PageButton>
          </PageControls>
        </Pagination>
      )}

      {/* Reject Product Modal */}
      {rejectModal.open && (
        <ModalOverlay onClick={closeRejectModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Reject Product</ModalTitle>
              <CloseButton onClick={closeRejectModal}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <p>Product: <strong>{rejectModal.productName}</strong></p>
              <p style={{ marginBottom: "1rem", color: "#64748b" }}>
                Please provide a reason for rejecting this product:
              </p>
              <RejectTextarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason (e.g., Product violates guidelines, Incomplete information, etc.)"
                rows={4}
              />
            </ModalBody>
            <ModalFooter>
              <ModalButton $cancel onClick={closeRejectModal}>
                Cancel
              </ModalButton>
              <ModalButton
                $confirm
                onClick={handleRejectProduct}
                disabled={!rejectReason.trim() || rejectProduct.isPending}
              >
                {rejectProduct.isPending ? "Rejecting..." : "Reject Product"}
              </ModalButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      <ConfirmationModal
        isOpen={actionModalConfig.isOpen}
        onClose={() => setActionModalConfig({ isOpen: false, type: null, payload: null })}
        onConfirm={confirmAction}
        title={
          actionModalConfig.type === 'delete' ? 'Remove Product' :
            actionModalConfig.type === 'markEazShop' ? 'Mark as Saiisai Product' :
              'Approve Product'
        }
        message={
          actionModalConfig.type === 'delete' ? 'Are you sure you want to remove this product from the marketplace?\n\nThis will archive the product (soft delete). If the product has order history, it will be preserved for records. Only products with zero orders can be permanently deleted.' :
            actionModalConfig.type === 'markEazShop' ? 'Mark this product as an Official Store product?' :
              `Approve product "${actionModalConfig.payload?.name}"?`
        }
        confirmText={actionModalConfig.type === 'delete' ? 'Remove' : 'Approve'}
        confirmColor={actionModalConfig.type === 'delete' ? '#dc2626' : actionModalConfig.type === 'approve' ? '#10b981' : '#bb6c02'}
      />
    </DashboardContainer>
  );
}

const DashboardContainer = styled.div`
  padding: 2rem;
  background-color: ${T.bodyBg};
  min-height: 100vh;
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: ${T.cardBg};
  border-radius: ${T.radiusSm};
  padding: 0.5rem 1rem;
  box-shadow: ${T.shadow};
  border: 1.5px solid ${T.border};
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &:focus-within {
    border-color: ${T.primary};
    box-shadow: 0 0 0 3px ${T.primaryBg};
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
  border: 1.5px solid ${T.border};
  border-radius: ${T.radiusSm};
  padding: 0.5rem 1rem;
  background: ${T.cardBg};
  font-size: 1rem;
  cursor: pointer;
  color: ${T.text};
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &:hover {
    border-color: ${T.primary};
  }

  &:focus {
    border-color: ${T.primary};
    box-shadow: 0 0 0 3px ${T.primaryBg};
    outline: none;
  }
`;

const ProductTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${T.cardBg};
  border: 1px solid ${T.border};
  border-radius: ${T.radius};
  overflow: hidden;
  box-shadow: ${T.shadow};
`;

const TableHeader = styled.thead`
  background-color: ${T.bodyBg};
`;

const HeaderRow = styled.tr`
  border-bottom: 1px solid ${T.border};
`;

const SortableHeader = styled.th`
  padding: 1rem 1.4rem;
  text-align: left;
  font-weight: 600;
  font-size: var(--text-xs);
  color: ${T.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid ${T.border};

  &:hover {
    background-color: ${T.bodyBg};
  }
`;

const HeaderCell = styled.th`
  padding: 1rem 1.4rem;
  text-align: left;
  font-weight: 600;
  font-size: var(--text-xs);
  color: ${T.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid ${T.border};
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${T.border};
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${T.bodyBg};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1.2rem 1.5rem;
  color: ${T.text};
  font-size: 0.95rem;
`;

const ProductName = styled.div`
  font-weight: 500;
  color: #1e293b;
`;

const ProductId = styled.div`
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.2rem;
`;

const PriceInfo = styled.div`
  font-weight: 600;
  color: #059669;
  font-size: 0.95rem;
`;

const StockIndicator = styled.span`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.85rem;
  background: ${({ stock }) =>
    stock > 20 ? "#dcfce7" : stock > 0 ? "#fef9c3" : "#fee2e2"};
  color: ${({ stock }) =>
    stock > 20 ? "#166534" : stock > 0 ? "#854d0e" : "#b91c1c"};
`;

const StatusPill = styled.span`
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.85rem;
  text-transform: capitalize;
  background: ${({ status }) =>
    status === "active"
      ? "#dcfce7"
      : status === "inactive"
        ? "#f1f5f9"
        : "#fee2e2"};
  color: ${({ status }) =>
    status === "active"
      ? "#166534"
      : status === "inactive"
        ? "#475569"
        : "#b91c1c"};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: ${({ danger, $eazshop, $approve, $reject }) =>
    danger ? "#fee2e2" :
      $eazshop
        ? "linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-800) 100%)"
        :
        $approve ? "#dcfce7" :
          $reject ? "#fee2e2" :
            "var(--color-primary-50)"};
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ danger, $eazshop, $approve, $reject }) =>
    danger ? "#b91c1c" :
      $eazshop ? "white" :
        $approve ? "#166534" :
          $reject ? "#b91c1c" :
            "var(--color-primary-600)"};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ danger, $eazshop, $approve, $reject }) =>
    danger ? "#fecaca" :
      $eazshop
        ? "linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-900) 100%)"
        :
        $approve ? "#bbf7d0" :
          $reject ? "#fecaca" :
            "var(--color-primary-100)"};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    font-size: 1.1rem;
  }
`;

const ModerationPill = styled.span`
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.85rem;
  text-transform: capitalize;
  background: ${({ status }) =>
    status === "approved"
      ? "#dcfce7"
      : status === "rejected"
        ? "#fee2e2"
        : "#fef9c3"};
  color: ${({ status }) =>
    status === "approved"
      ? "#166534"
      : status === "rejected"
        ? "#b91c1c"
        : "#854d0e"};
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
  max-width: 500px;
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
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #64748b;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const RejectTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  color: #334155;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
`;

const ModalButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${({ $cancel }) =>
    $cancel
      ? `
    background: #f1f5f9;
    color: #475569;
    
    &:hover {
      background: #e2e8f0;
    }
  `
      : `
    background: #dc2626;
    color: white;
    
    &:hover:not(:disabled) {
      background: #b91c1c;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  margin-top: 1rem;
  color: #94a3b8;
  font-size: 1.1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
`;

const PageInfo = styled.div`
  color: #64748b;
  font-size: 0.9rem;
`;

const PageControls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  background: white;
  padding: 0 1rem;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
`;

const TabButton = styled.button`
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid ${({ $active }) => ($active ? "#6366f1" : "transparent")};
  color: ${({ $active }) => ($active ? "#6366f1" : "#64748b")};
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  bottom: -2px;

  &:hover {
    color: #6366f1;
    background: #f8fafc;
  }
`;

const PageButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background: ${({ active }) => (active ? "#6366f1" : "white")};
  color: ${({ active }) => (active ? "white" : "#334155")};
  border-radius: 8px;
  cursor: pointer;
  font-weight: ${({ active }) => (active ? "600" : "normal")};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ active }) => (active ? "#4f46e5" : "#f1f5f9")};
    border-color: #cbd5e1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ProductImage styled component replaced by OptimizedImage */
const ProductImage = styled.div`
  width: 50px;
  height: 50px;
`;

const SellerInfo = styled.div`
  font-weight: 500;
  color: #1e293b;
`;

const CategoryInfo = styled.div`
  font-weight: 500;
  color: #1e293b;
  text-transform: capitalize;
`;

const PreOrderBadge = styled.span`
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.85rem;
  background: var(--color-primary-100);
  color: var(--color-primary-700);
`;
