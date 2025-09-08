import styled from "styled-components";
import { useGetSubCategoryCount } from "../../hook/useGetSubCategoryCount";
import useGetImmediateSubcategories from "../../hook/useGetImmediateSubcategories";
import useCategory from "../../hook/useCategory";

const CategoryListView = ({
  currentCategories,
  categories,
  setFilters,
  handleEdit,
  handleDelete,
  // handleEditVariants,
}) => {
  const getImmediateSubcategories = useGetImmediateSubcategories(categories);
  const getSubCategoryCount = useGetSubCategoryCount(categories);
  const { updateCategory } = useCategory();

  const handleToggleStatus = (category) => {
    const newStatus = category.status === "active" ? "inactive" : "active";
    updateCategory.mutate(
      {
        id: category._id,
        formData: { status: newStatus },
      },
      {
        onSuccess: () => {
          // Optionally, you can refresh or reset state here
        },
        onError: (error) => {
          console.error("Failed to update category status:", error);
          // You might want to show an error message to the user here
        },
      }
    );
  };

  return (
    <CategoriesGrid>
      {currentCategories.map((category) => {
        const subCount = getSubCategoryCount(category._id);
        const hasChildren = subCount > 0;
        const subcategories = getImmediateSubcategories(category._id);

        return (
          <CategoryCard key={category._id}>
            <CategoryImageContainer>
              {category.image ? (
                <CategoryImage
                  src={category?.image}
                  alt={category?.name}
                  onError={(e) => {
                    console.log("error", e);
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/150x150?text=Error";
                  }}
                />
              ) : (
                "No Image"
              )}
            </CategoryImageContainer>
            <CategoryHeader>
              <CategoryName>{category.name}</CategoryName>
              <StatusBadge $status={category.status}>
                {category.status.charAt(0).toUpperCase() +
                  category.status.slice(1)}
              </StatusBadge>
            </CategoryHeader>

            <CategoryDescription>{category.description}</CategoryDescription>

            <CategoryMeta>
              <MetaItem>
                <MetaLabel>Products:</MetaLabel>
                <MetaValue>{category.products || 0}</MetaValue>
              </MetaItem>

              <MetaItem>
                <MetaLabel>Sub-categories:</MetaLabel>
                <MetaValue>{subCount}</MetaValue>
              </MetaItem>

              <MetaItem>
                <MetaLabel>Parent:</MetaLabel>
                <MetaValue>
                  {category.parentId
                    ? categories.find((c) => c._id === category.parentId)
                        ?.name || "None"
                    : "None"}
                </MetaValue>
              </MetaItem>

              <MetaItem>
                <MetaLabel>Created:</MetaLabel>
                <MetaValue>
                  {new Date(category.createdAt).toLocaleDateString()}
                </MetaValue>
              </MetaItem>
            </CategoryMeta>

            {hasChildren && (
              <SubcategorySection>
                <SubcategoryLabel>Subcategories:</SubcategoryLabel>
                <SubcategoryList>
                  {subcategories.map((sub) => (
                    <SubcategoryItem
                      key={sub._id}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          parentFilter: sub._id.toString(),
                        }))
                      }
                    >
                      {sub.name}
                    </SubcategoryItem>
                  ))}
                </SubcategoryList>
              </SubcategorySection>
            )}

            <CategoryActions>
              <ActionButton onClick={() => handleEdit(category)}>
                Edit
              </ActionButton>

              <ActionButton
                $status={category.status}
                onClick={() => handleToggleStatus(category)}
              >
                {category.status === "active" ? "Deactivate" : "Activate"}
              </ActionButton>

              <DeleteButton onClick={() => handleDelete(category._id)}>
                Delete
              </DeleteButton>
            </CategoryActions>

            {hasChildren && (
              <ViewSubButton
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    parentFilter: category._id.toString(),
                  }))
                }
              >
                View All Sub-categories
              </ViewSubButton>
            )}
          </CategoryCard>
        );
      })}
    </CategoriesGrid>
  );
};

export default CategoryListView;

// Styled Components
const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const CategoryCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.12);
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CategoryName = styled.h3`
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
`;

const StatusBadge = styled.span`
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  background-color: ${(props) =>
    props.$status === "active"
      ? "rgba(39, 174, 96, 0.1)"
      : "rgba(231, 76, 60, 0.1)"};
  color: ${(props) => (props.$status === "active" ? "#27ae60" : "#e74c3c")};
`;

const CategoryDescription = styled.p`
  color: #7f8c8d;
  font-size: 0.95rem;
  line-height: 1.5;
  flex-grow: 1;
  margin-bottom: 1.5rem;
`;

const CategoryMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetaLabel = styled.span`
  font-size: 0.85rem;
  color: #95a5a6;
  margin-bottom: 0.2rem;
`;

const MetaValue = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: #2c3e50;
`;

const SubcategorySection = styled.div`
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px dashed #eee;
`;

const SubcategoryLabel = styled.span`
  display: block;
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const SubcategoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const SubcategoryItem = styled.span`
  padding: 0.4rem 0.8rem;
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(52, 152, 219, 0.2);
    transform: translateY(-2px);
  }
`;

const CategoryActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  border-top: 1px solid #eee;
  padding-top: 1.2rem;
`;

const ActionButton = styled.button`
  padding: 0.6rem 1rem;
  background-color: transparent;
  color: #3498db;
  border: 1px solid #3498db;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(52, 152, 219, 0.1);
  }
`;

const DeleteButton = styled.button`
  padding: 0.6rem 1rem;
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(231, 76, 60, 0.2);
  }
`;

const ViewSubButton = styled.button`
  padding: 0.6rem 1rem;
  background-color: rgba(155, 89, 182, 0.1);
  color: #9b59b6;
  border: 1px solid rgba(155, 89, 182, 0.3);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;

  &:hover {
    background-color: rgba(155, 89, 182, 0.2);
  }
`;

const CategoryImageContainer = styled.div`
  width: 100%;
  height: 200px;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f8f9fa;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
    pointer-events: none;
  }
`;

const CategoryImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;

  ${CategoryCard}:hover & {
    transform: scale(1.05);
  }
`;
