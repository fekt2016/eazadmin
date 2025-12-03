import styled from "styled-components";
import { FaSearch, FaLayerGroup, FaList, FaPlus, FaFilter } from "react-icons/fa";

export default function HeaderSection({
  filters,
  setFilters,
  handleFilterChange,
  setShowForm,
  topLevelCategories,
}) {
  return (
    <Header>
      <HeaderTop>
        <TitleSection>
          <Title>Category Management</Title>
          <Description>
            Organize and manage your product categories with ease
          </Description>
        </TitleSection>
        <AddButton onClick={() => setShowForm(true)}>
          <FaPlus /> Add New Category
        </AddButton>
      </HeaderTop>

      <ActionBar>
        <SearchWrapper>
          <FaSearch />
          <SearchInput
            type="text"
            name="search"
            placeholder="Search categories by name or description..."
            value={filters.search}
            onChange={handleFilterChange}
          />
        </SearchWrapper>

        <FiltersGroup>
          <FilterWrapper>
            <FilterIcon>
              <FaFilter />
            </FilterIcon>
            <FilterSelect
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </FilterSelect>
          </FilterWrapper>

          <FilterWrapper>
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
          </FilterWrapper>
        </FiltersGroup>

        <ViewToggle>
          <ViewOption
            $active={filters.viewMode === "tree"}
            onClick={() =>
              setFilters((prev) => ({ ...prev, viewMode: "tree" }))
            }
          >
            <FaLayerGroup /> Tree View
          </ViewOption>
          <ViewOption
            $active={filters.viewMode === "list"}
            onClick={() =>
              setFilters((prev) => ({ ...prev, viewMode: "list" }))
            }
          >
            <FaList /> List View
          </ViewOption>
        </ViewToggle>
      </ActionBar>
    </Header>
  );
}

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  color: white;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  color: white;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
  letter-spacing: -0.5px;
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  color: #667eea;
  border: none;
  border-radius: 12px;
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ActionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const SearchWrapper = styled.div`
  flex: 1;
  min-width: 280px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  color: #667eea;

  svg {
    flex-shrink: 0;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: #2c3e50;
  outline: none;

  &::placeholder {
    color: #94a3b8;
  }
`;

const FiltersGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
`;

const FilterIcon = styled.div`
  color: #667eea;
  display: flex;
  align-items: center;
`;

const FilterSelect = styled.select`
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: #2c3e50;
  outline: none;
  cursor: pointer;
  min-width: 150px;
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 0.25rem;
  border-radius: 8px;
`;

const ViewOption = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: none;
  background: ${(props) => (props.$active ? "#667eea" : "transparent")};
  color: ${(props) => (props.$active ? "white" : "#2c3e50")};
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.$active ? "#667eea" : "rgba(102, 126, 234, 0.1)")};
  }
`;

