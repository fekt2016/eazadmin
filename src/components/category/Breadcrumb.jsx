import styled from "styled-components";
import { getParentName } from "../../utils/helpers";

export default function Breadcrumb({ filters, setFilters, categories }) {
  return (
    <Breadcrumbs>
      <BreadcrumbItem
        $active={filters.parentFilter === "ALL"}
        onClick={() => setFilters((prev) => ({ ...prev, parentFilter: "ALL" }))}
      >
        All Categories
      </BreadcrumbItem>
      {filters.parentFilter !== "ALL" &&
        filters.parentFilter !== "TOP_LEVEL" && (
          <>
            <BreadcrumbDivider>›</BreadcrumbDivider>
            <BreadcrumbItem
              $active={true}
              onClick={() =>
                setFilters((prev) => ({ ...prev, parentFilter: "TOP_LEVEL" }))
              }
            >
              {getParentName(filters.parentFilter, categories)}
            </BreadcrumbItem>
          </>
        )}
    </Breadcrumbs>
  );
}
const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.8rem 1.2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
`;

const BreadcrumbItem = styled.div`
  font-size: 0.95rem;
  color: ${(props) => (props.$active ? "#3498db" : "#7f8c8d")};
  font-weight: ${(props) => (props.$active ? "500" : "normal")};
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #2980b9;
    text-decoration: underline;
  }
`;

const BreadcrumbDivider = styled.div`
  color: #bdc3c7;
`;
