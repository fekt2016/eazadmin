import styled from "styled-components";

export default function HeaderSection({
  filters,
  setFilters,
  handleFilterChange,
  setShowForm,
  topLevelCategories,
}) {
  return (
    <Header>
      <Title>Category Management</Title>
      <Description>
        Manage hierarchical product categories for your e-commerce platform
      </Description>
      <ActionBar>
        <ViewToggle>
          <ViewOption
            $active={filters.viewMode === "tree"}
            onClick={() =>
              setFilters((prev) => ({ ...prev, viewMode: "tree" }))
            }
          >
            Tree View
          </ViewOption>
          <ViewOption
            $active={filters.viewMode === "list"}
            onClick={() =>
              setFilters((prev) => ({ ...prev, viewMode: "list" }))
            }
          >
            List View
          </ViewOption>
        </ViewToggle>

        <SearchInput
          type="text"
          name="search"
          placeholder="Search categories..."
          value={filters.search}
          onChange={handleFilterChange}
        />
        <StatusFilter>
          <FilterLabel>Status:</FilterLabel>
          <FilterSelect
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </FilterSelect>
        </StatusFilter>

        <ParentFilter>
          <FilterLabel>Parent:</FilterLabel>
          <FilterSelect
            name="parentFilter"
            value={filters.parentFilter}
            onChange={handleFilterChange}
          >
            <option value="ALL">All Categories</option>
            <option value="TOP_LEVEL">Top Level Only</option>
            <optgroup label="Top Level Categories">
              {topLevelCategories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </optgroup>
          </FilterSelect>
        </ParentFilter>
        <AddButton onClick={() => setShowForm(true)}>
          + Add New Category
        </AddButton>
      </ActionBar>
    </Header>
  );
}

const AddButton = styled.button`
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background-color: #3a5af5;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #2c3e50;
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const Description = styled.p`
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
`;

const ActionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-top: 1.5rem;
`;

const ViewToggle = styled.div`
  display: flex;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
`;

const ViewOption = styled.div`
  padding: 0.7rem 1.2rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  background-color: ${(props) => (props.$active ? "#4a6cf7" : "white")};
  color: ${(props) => (props.$active ? "white" : "#7f8c8d")};
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.$active ? "#3a5af5" : "#f8f9fa")};
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 250px;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const StatusFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ParentFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-size: 0.9rem;
  color: #34495e;
  font-weight: 500;
`;

const FilterSelect = styled.select`
  padding: 0.7rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  font-size: 0.95rem;
  cursor: pointer;
  min-width: 160px;
`;
