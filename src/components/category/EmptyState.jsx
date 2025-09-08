import styled from "styled-components";

export default function EmptyState({ setShowForm }) {
  return (
    <EmptyStat>
      <EmptyIcon>📁</EmptyIcon>
      <EmptyTitle>No Categories Found</EmptyTitle>
      <EmptyText>Try adjusting your filters or create a new category</EmptyText>
      <AddButton onClick={() => setShowForm(true)}>
        + Add New Category
      </AddButton>
    </EmptyStat>
  );
}
const EmptyStat = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: #bdc3c7;
`;

const EmptyTitle = styled.h3`
  color: #2c3e50;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-bottom: 2rem;
`;

const AddButton = styled.button`
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #2980b9;
  }
`;
