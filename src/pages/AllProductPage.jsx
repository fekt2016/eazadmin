import styled from "styled-components";
// import { Search, MoreVert, Visibility, Edit, Delete } from '@mui/icons-material';
import { FiEdit, FiEye, FiSearch, FiTrash2 } from "react-icons/fi";
import useProduct from "../hook/useProduct";
import { useMemo, useState } from "react";
import { LoadingSpinner } from "../components/LoadingSpinner";

export default function AllProductPage() {
  const { getProducts } = useProduct();
  const { data, isLoading: productLoading, error: productError } = getProducts;

  const products = useMemo(() => data?.results || [], [data]);
  console.log("products", products);
  // const [products, setProducts] = useState([]);
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

  const handleDelete = (productId) => {
    console.log("productId", productId);
    // setProducts(products.filter((product) => product.id !== productId));
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  if (productLoading) return <LoadingSpinner />;
  if (productError) return <div>Error: {productError.message}</div>;
  return (
    <DashboardContainer>
      <Header>
        <Title>All Products</Title>
        <Controls>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              // onChange={(e) => console.log(e.target.value)}
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
            <HeaderCell>ACTIONS</HeaderCell>
          </HeaderRow>
        </TableHeader>

        <TableBody>
          {currentProducts.map((product) => {
            console.log("product", product);
            return (
              <TableRow key={product.id}>
                <TableCell>
                  <ProductImage src={product.imageCover} alt={product.name} />
                </TableCell>
                <TableCell>
                  <ProductName>{product.name}</ProductName>
                  <ProductId>ID: {product.id}</ProductId>
                </TableCell>
                <TableCell>
                  <SellerInfo>{product.seller?.shopName || "N/A"}</SellerInfo>
                </TableCell>
                {/* <TableCell>₵{product.price.toFixed(2)}</TableCell> */}
                <TableCell>
                  <StockIndicator stock={product.totalStock}>
                    {product.totalStock > 0
                      ? product.totalStock
                      : "Out of stock"}
                  </StockIndicator>
                </TableCell>
                <TableCell>
                  <CategoryInfo>
                    {product.parentCategory?.name ||
                      product.parentCategory?.name ||
                      "Uncategorized"}
                  </CategoryInfo>
                </TableCell>
                <TableCell>
                  <StatusPill status={product.status}>
                    {product.status.replace("-", " ")}
                  </StatusPill>
                </TableCell>
                <TableCell>
                  <ActionButtons>
                    <ActionButton title="View">
                      <FiEye />
                    </ActionButton>
                    <ActionButton title="Edit">
                      <FiEdit />
                    </ActionButton>
                    <ActionButton
                      title="Delete"
                      danger
                      onClick={() => handleDelete(product.id)}
                    >
                      <FiTrash2 />
                    </ActionButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            );
          })}
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
    </DashboardContainer>
  );
}

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

const ProductId = styled.div`
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.2rem;
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

const SellerInfo = styled.div`
  font-weight: 500;
  color: #1e293b;
`;

const CategoryInfo = styled.div`
  font-weight: 500;
  color: #1e293b;
  text-transform: capitalize;
`;
