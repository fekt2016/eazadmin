import styled from "styled-components";
import { FiEdit, FiEye, FiSearch, FiTrash2, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useEazShop } from "../../shared/hooks/useEazShop";
import { useMemo, useState } from "react";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import { PATHS } from "../../routes/routhPath";
import { toast } from "react-toastify";

const EAZSHOP_SELLER_ID = "6970b22eaba06cadfd4b8035";

function getShopName(product) {
  if (product.isEazShopProduct === true) return "Saiisai";
  const sellerId = product.seller?._id?.toString?.() ?? product.seller?.toString?.() ?? "";
  if (sellerId === EAZSHOP_SELLER_ID) return "Saiisai";
  if (product.seller && typeof product.seller === "object") {
    return product.seller.shopName || product.seller.name || "—";
  }
  return "—";
}

export default function EazShopProductsPage() {
  const navigate = useNavigate();
  const { useGetEazShopProducts } = useEazShop();
  const { data, isLoading, error } = useGetEazShopProducts();
  console.log('📦 [EazShopProductsPage] Data:', data);

  const products = useMemo(() => {
    console.log('📦 [EazShopProductsPage] Raw data from hook:', data);
    if (!data) {
      console.log('⚠️ [EazShopProductsPage] No data received');
      return [];
    }
    // Data should already be an array from the hook, but handle edge cases
    if (Array.isArray(data)) {
      console.log('✅ [EazShopProductsPage] Data is array, length:', data.length);
      return data;
    }
    // Fallback for different response structures
    if (data?.data?.products && Array.isArray(data.data.products)) {
      console.log('✅ [EazShopProductsPage] Found products at data.data.products:', data.data.products.length);
      return data.data.products;
    }
    if (data?.products && Array.isArray(data.products)) {
      console.log('✅ [EazShopProductsPage] Found products at data.products:', data.products.length);
      return data.products;
    }
    console.warn('⚠️ [EazShopProductsPage] Could not extract products from data:', data);
    return [];
  }, [data]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
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
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.parentCategory?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (product.subCategory?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || (product.status || "active") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    console.error('❌ [EazShopProductsPage] Error loading products:', error);
    return (
      <ErrorContainer>
        <ErrorTitle>Error Loading Products</ErrorTitle>
        <ErrorMessage>{error.message || 'Failed to load Saiisai products'}</ErrorMessage>
        <ErrorDetails>
          Please check the browser console for more details.
        </ErrorDetails>
      </ErrorContainer>
    );
  }

  // Debug: Log when we have data but no products
  if (data && products.length === 0) {
    console.warn('⚠️ [EazShopProductsPage] Data exists but no products extracted:', {
      data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      productsLength: products.length,
      dataKeys: data ? Object.keys(data) : [],
    });
  }

  return (
    <DashboardContainer>
      <Header>
        <TitleContainer>
          <Title>Saiisai Products</Title>
          <Subtitle>Manage Saiisai (company store) products. Use “Add product” to create new items.</Subtitle>
        </TitleContainer>
        <HeaderActions>
          <AddProductButton
            onClick={() => navigate(`/dashboard/${PATHS.EAZSHOP_PRODUCTS_NEW}`)}
            title="Create a new Saiisai product"
          >
            <FiPlus /> Add product
          </AddProductButton>
        </HeaderActions>
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
        </Controls>
      </Header>

      <ProductTable>
        <TableHeader>
          <HeaderRow>
            <HeaderCell>IMAGE</HeaderCell>
            <SortableHeader onClick={() => requestSort("name")}>
              PRODUCT
              {sortConfig.key === "name" &&
                (sortConfig.direction === "ascending" ? "↑" : "↓")}
            </SortableHeader>
            <SortableHeader onClick={() => requestSort("price")}>
              PRICE
              {sortConfig.key === "price" &&
                (sortConfig.direction === "ascending" ? "↑" : "↓")}
            </SortableHeader>
            <SortableHeader onClick={() => requestSort("totalStock")}>
              STOCK
              {sortConfig.key === "totalStock" &&
                (sortConfig.direction === "ascending" ? "↑" : "↓")}
            </SortableHeader>
            <HeaderCell>CATEGORY</HeaderCell>
            <HeaderCell>STATUS</HeaderCell>
            <HeaderCell>ACTIONS</HeaderCell>
          </HeaderRow>
        </TableHeader>

        <TableBody>
          {currentProducts.map((product) => (
            <TableRow key={product._id || product.id}>
              <TableCell>
                <ProductImage
                  src={product.imageCover || product.images?.[0]}
                  alt={product.name}
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect fill='%23e2e8f0' width='50' height='50'/%3E%3C/svg%3E";
                  }}
                />
              </TableCell>
              <TableCell>
                <ProductName>{product.name}</ProductName>
                <ShopName>{getShopName(product)}</ShopName>
              </TableCell>
              <TableCell>
                <PriceInfo>
                  ₵{product.price?.toFixed(2) || "0.00"}
                </PriceInfo>
              </TableCell>
              <TableCell>
                <StockIndicator stock={product.totalStock || 0}>
                  {product.totalStock > 0
                    ? product.totalStock
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
                <StatusPill status={product.status || "active"}>
                  {(product.status || "active").replace("-", " ")}
                </StatusPill>
              </TableCell>
              <TableCell>
                <ActionButtons>
                  <ActionButton
                    title="View"
                    onClick={() =>
                      navigate(
                        `/dashboard/${PATHS.PRODUCTDETAILS.replace(
                          ":id",
                          product._id || product.id
                        )}`
                      )
                    }
                  >
                    <FiEye />
                  </ActionButton>
                  <ActionButton
                    title="Edit"
                    onClick={() =>
                      navigate(
                        `/dashboard/${PATHS.PRODUCTDETAILS.replace(
                          ":id",
                          product._id || product.id
                        )}`
                      )
                    }
                  >
                    <FiEdit />
                  </ActionButton>
                </ActionButtons>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </ProductTable>

      {filteredProducts.length === 0 ? (
        <NoResultsContainer>
          <NoResultsIcon>📦</NoResultsIcon>
          <NoResultsTitle>
            {products.length === 0
              ? "No Saiisai Products Found"
              : "No Products Match Your Filters"}
          </NoResultsTitle>
          <NoResultsMessage>
            {products.length === 0
              ? "You haven't created any Saiisai products yet. Create your first Saiisai product to get started!"
              : `Try adjusting your search or filter. You have ${products.length} total Saiisai products.`}
          </NoResultsMessage>
          {products.length === 0 && (
            <NoResultsAction>
              <CreateButton onClick={() => navigate(`/dashboard/${PATHS.EAZSHOP_PRODUCTS_NEW}`)}>
                Create EazShop Product
              </CreateButton>
            </NoResultsAction>
          )}
        </NoResultsContainer>
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
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const TitleContainer = styled.div`
  flex: 1;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AddProductButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
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

const ProductTable = styled.table`
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
`;

const ProductName = styled.div`
  font-weight: 500;
  color: #1e293b;
`;

const ShopName = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.2rem;
`;

const PriceInfo = styled.div`
  font-weight: 600;
  color: #1e293b;
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
  background: ${({ danger }) => (danger ? "#fee2e2" : "#eff6ff")};
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ danger }) => (danger ? "#b91c1c" : "#2563eb")};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ danger }) => (danger ? "#fecaca" : "#dbeafe")};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 1.1rem;
  }
`;

const NoResultsContainer = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  margin-top: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
`;

const NoResultsIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const NoResultsTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
`;

const NoResultsMessage = styled.p`
  font-size: 1rem;
  color: #64748b;
  margin: 0 0 2rem 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
`;

const NoResultsAction = styled.div`
  margin-top: 1.5rem;
`;

const CreateButton = styled.button`
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
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

const ProductImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
`;

const CategoryInfo = styled.div`
  font-weight: 500;
  color: #1e293b;
  text-transform: capitalize;
`;

const ErrorContainer = styled.div`
  padding: 2rem;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  margin: 2rem;
  border: 1px solid #fecaca;
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #991b1b;
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  color: #b91c1c;
`;

const ErrorDetails = styled.p`
  font-size: 0.9rem;
  margin: 0;
  color: #dc2626;
  opacity: 0.8;
`;

