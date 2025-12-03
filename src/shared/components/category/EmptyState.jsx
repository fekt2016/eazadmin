import styled from "styled-components";
import { FaFolderOpen, FaPlus } from "react-icons/fa";

export default function EmptyState({ setShowForm }) {
  return (
    <EmptyStat>
      <EmptyIconWrapper>
        <FaFolderOpen />
      </EmptyIconWrapper>
      <EmptyTitle>No Categories Found</EmptyTitle>
      <EmptyText>
        No categories match your current filters. Try adjusting your search criteria or create a new category to get started.
      </EmptyText>
      <AddButton onClick={() => setShowForm(true)}>
        <FaPlus /> Add New Category
      </AddButton>
    </EmptyStat>
  );
}

const EmptyStat = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px dashed #e2e8f0;
`;

const EmptyIconWrapper = styled.div`
  font-size: 5rem;
  margin-bottom: 1.5rem;
  color: #cbd5e1;
  display: flex;
  justify-content: center;
`;

const EmptyTitle = styled.h3`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
`;

const EmptyText = styled.p`
  color: #64748b;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;
