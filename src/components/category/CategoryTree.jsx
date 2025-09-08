import { useCallback, useState, useMemo } from "react";
import styled from "styled-components";
import { getParentName } from "../../utils/helpers";
import useGetImmediateSubcategories from "../../hook/useGetImmediateSubcategories";
import { useGetSubCategoryCount } from "../../hook/useGetSubCategoryCount";
import { FixedSizeList as List } from "react-window";

const CategoryTree = function ({
  categories,
  categoriesTree,
  parentCategory = null,
  setShowForm,
  level = 0,
  setFilters,
  setImagePreview,
  setEditingCategory,
  setFormData,
  onUpdateCategory,
  onDeleteCategory,
  productCountByCategory,
  // onEditVariants,
}) {
  const [activeTab, setActiveTab] = useState(null);
  const [showSubcategoriesModal, setShowSubcategoriesModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const productCounts = useMemo(
    () => productCountByCategory?.data?.productCounts || {},
    [productCountByCategory]
  );

  const getImmediateSubcategories = useGetImmediateSubcategories(categories);
  const getSubCategoryCount = useGetSubCategoryCount(categories);

  const parentCategories = categoriesTree
    .filter((cat) => {
      const parentId =
        typeof cat.parentCategory === "object"
          ? cat.parentCategory?._id
          : cat.parentCategory;

      return parentId === undefined || parentId === null;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Add debug logging
  // console.log("CategoryTree Debug:", {
  //   parentCategory,
  //   categoriesTree,
  //   parentCate,
  //   categories,
  // });

  // Edit category
  const handleEdit = useCallback(
    (category) => {
      setEditingCategory(category);
      setShowForm(true);
      setImagePreview(category.image);
      setShowSubcategoriesModal(false);

      setFormData({
        name: category.name,
        description: category.description,
        status: category.status,
        parentCategory: category.parentCategory,
        image: category.image,
      });

      // Scroll to form section after a short delay to ensure form is rendered
      setTimeout(() => {
        const formSection = document.querySelector(".form-section");
        if (formSection) {
          formSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    },
    [setEditingCategory, setShowForm, setImagePreview, setFormData]
  );

  const handleToggleStatus = useCallback(
    (category) => {
      const newStatus = category.status === "Active" ? "Inactive" : "Active";
      onUpdateCategory({
        id: category._id,
        formData: { status: newStatus },
      });
    },
    [onUpdateCategory]
  );

  const handleDelete = useCallback(
    (categoryId) => {
      if (window.confirm("Are you sure you want to delete this category?")) {
        onDeleteCategory(categoryId);
      }
    },
    [onDeleteCategory]
  );

  const handleViewSubcategories = useCallback((category) => {
    setSelectedCategory(category);
    setShowSubcategoriesModal(true);
  }, []);

  const renderCategory = useCallback(
    ({ index, style }) => {
      const category = parentCategories[index];
      console.log("Category:", category);
      const counts = productCounts.find(
        (item) => item.parentCategory === category.name
      );
      const subCount = getSubCategoryCount(category._id);
      const hasChildren = subCount > 0;
      const subcategories = getImmediateSubcategories(category._id);
      const isActive = activeTab === category._id;

      // console.log("Category Debug:", {
      //   categoryName: category.name,
      //   hasChildren,
      //   subCount,
      //   subcategories,
      //   isActive,
      //   activeTab,
      // });

      return (
        <div style={style}>
          <CategoryCard
            level={level}
            onClick={() => {
              console.log("Card clicked:", category.name);
              if (hasChildren) {
                setActiveTab(isActive ? null : category._id);
              }
            }}
          >
            <CategoryImageContainer>
              {category.image ? (
                <>
                  <CategoryImage src={category.image} alt={category.name} />
                  <ImagePlaceholder
                    className="image-error"
                    style={{ display: "none" }}
                  >
                    Failed to load image
                  </ImagePlaceholder>
                </>
              ) : (
                <ImagePlaceholder>No image available</ImagePlaceholder>
              )}
            </CategoryImageContainer>
            <CategoryContent>
              <CategoryHeader>
                <CategoryName>{category.name}</CategoryName>
                <StatusBadge $status={category.status}>
                  {category.status}
                </StatusBadge>
              </CategoryHeader>
              <CategoryDescription>{category.description}</CategoryDescription>
              <CategoryMeta>
                <MetaItem>
                  <MetaLabel>Products:</MetaLabel>
                  <MetaValue>{counts?.count || 0}</MetaValue>
                </MetaItem>

                <MetaItem>
                  <MetaLabel>Sub-categories:</MetaLabel>
                  <MetaValue>{subCount}</MetaValue>
                </MetaItem>

                <MetaItem>
                  <MetaLabel>Parent:</MetaLabel>
                  <MetaValue>
                    {getParentName(category._id, categories)}
                  </MetaValue>
                </MetaItem>

                <MetaItem>
                  <MetaLabel>Created:</MetaLabel>
                  <MetaValue>{category.createdAt}</MetaValue>
                </MetaItem>
              </CategoryMeta>
              {hasChildren && (
                <SubcategorySection>
                  {isActive && subcategories.length > 0 && (
                    <SubcategoryList>
                      {subcategories.map((sub) => (
                        <SubcategoryItem
                          key={sub._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters((prev) => ({
                              ...prev,
                              parentFilter: sub._id,
                            }));
                          }}
                        >
                          {sub.name}
                        </SubcategoryItem>
                      ))}
                    </SubcategoryList>
                  )}
                </SubcategorySection>
              )}
              <CategoryActions>
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(category);
                  }}
                >
                  Edit
                </ActionButton>
                <ActionButton
                  $status={category.status}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(category);
                  }}
                >
                  {category.status === "Active" ? "Deactivate" : "Activate"}
                </ActionButton>
                <DeleteButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(category._id);
                  }}
                >
                  Delete
                </DeleteButton>
                {hasChildren && (
                  <ViewSubButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewSubcategories(category);
                    }}
                  >
                    View Sub-categories
                  </ViewSubButton>
                )}
              </CategoryActions>
            </CategoryContent>
          </CategoryCard>
        </div>
      );
    },
    [
      parentCategories,
      level,
      categories,
      productCounts,
      getSubCategoryCount,
      getImmediateSubcategories,
      setFilters,
      activeTab,
      handleEdit,
      handleDelete,
      handleToggleStatus,
      handleViewSubcategories,
    ]
  );

  if (parentCategories.length === 0 && parentCategory === null) {
    return (
      <EmptyState>
        <EmptyIcon>📁</EmptyIcon>
        <EmptyTitle>No Categories Found</EmptyTitle>
        <EmptyText>
          Try adjusting your filters or create a new category
        </EmptyText>
        <AddButton onClick={() => setShowForm(true)}>
          + Add New Category
        </AddButton>
      </EmptyState>
    );
  }

  return (
    <>
      <VirtualizedList
        height={800}
        itemCount={parentCategories.length}
        itemSize={400}
        width="100%"
      >
        {renderCategory}
      </VirtualizedList>

      {showSubcategoriesModal && selectedCategory && (
        <ModalOverlay onClick={() => setShowSubcategoriesModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Subcategories</ModalTitle>
              <CloseButton onClick={() => setShowSubcategoriesModal(false)}>
                ×
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <CategoryHeaderSection>
                <CategoryHeaderImageContainer>
                  {selectedCategory.image ? (
                    <CategoryHeaderImage
                      src={selectedCategory.image}
                      alt={selectedCategory.name}
                    />
                  ) : (
                    <CategoryHeaderImagePlaceholder>
                      No image available
                    </CategoryHeaderImagePlaceholder>
                  )}
                </CategoryHeaderImageContainer>
                <CategoryNameHeader>{selectedCategory.name}</CategoryNameHeader>
              </CategoryHeaderSection>
              <SubcategoriesSection>
                <SubcategoriesGrid>
                  {getImmediateSubcategories(selectedCategory._id).map(
                    (sub) => (
                      <CategoryCard
                        key={sub._id}
                        level={1}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            parentFilter: sub._id,
                          }));
                          setShowSubcategoriesModal(false);
                        }}
                      >
                        <CategoryImageContainer>
                          {sub.image ? (
                            <>
                              <CategoryImage src={sub.image} alt={sub.name} />
                              <ImagePlaceholder
                                className="image-error"
                                style={{ display: "none" }}
                              >
                                Failed to load image
                              </ImagePlaceholder>
                            </>
                          ) : (
                            <ImagePlaceholder>
                              No image available
                            </ImagePlaceholder>
                          )}
                        </CategoryImageContainer>
                        <CategoryContent>
                          <CategoryHeader>
                            <CategoryName>{sub.name}</CategoryName>
                            <StatusBadge $status={sub.status}>
                              {sub.status}
                            </StatusBadge>
                          </CategoryHeader>
                          <CategoryDescription>
                            {sub.description}
                          </CategoryDescription>
                          <CategoryMeta>
                            <MetaItem>
                              <MetaLabel>Products:</MetaLabel>
                              <MetaValue>
                                {productCounts.find(
                                  (item) => item.parentCategory === sub.name
                                )?.count || 0}
                              </MetaValue>
                            </MetaItem>
                            <MetaItem>
                              <MetaLabel>Sub-categories:</MetaLabel>
                              <MetaValue>
                                {getSubCategoryCount(sub._id)}
                              </MetaValue>
                            </MetaItem>
                            <MetaItem>
                              <MetaLabel>Parent:</MetaLabel>
                              <MetaValue>
                                {getParentName(sub._id, categories)}
                              </MetaValue>
                            </MetaItem>
                            <MetaItem>
                              <MetaLabel>Created:</MetaLabel>
                              <MetaValue>{sub.createdAt}</MetaValue>
                            </MetaItem>
                          </CategoryMeta>
                          <CategoryActions>
                            <ActionButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(sub);
                              }}
                            >
                              Edit
                            </ActionButton>
                            <ActionButton
                              $status={sub.status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(sub);
                              }}
                            >
                              {sub.status === "Active"
                                ? "Deactivate"
                                : "Activate"}
                            </ActionButton>
                            <DeleteButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(sub._id);
                              }}
                            >
                              Delete
                            </DeleteButton>
                          </CategoryActions>
                        </CategoryContent>
                      </CategoryCard>
                    )
                  )}
                </SubcategoriesGrid>
              </SubcategoriesSection>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default CategoryTree;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #222;
  margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  color: #666;
  margin-bottom: 1rem;
`;

const AddButton = styled.button`
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #1565c0;
  }
`;

const ActionButton = styled.button`
  background: #f5f5f5;
  color: ${({ $status }) => ($status === "Active" ? "#1976d2" : "#757575")};
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-left: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
  &:hover {
    background: #e3e3e3;
  }
`;

const DeleteButton = styled.button`
  background: #ffeaea;
  color: #d32f2f;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-left: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
  &:hover {
    background: #ffd6d6;
  }
`;

const ViewSubButton = styled.button`
  background: #f0f4ff;
  color: #2a4dff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-top: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
  &:hover {
    background: #dbeafe;
  }
`;

const CategoryActions = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
  gap: 0.5rem;
`;

const SubcategoryList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const SubcategorySection = styled.div`
  margin-top: 1rem;
  padding-left: 1rem;
  border-left: 2px solid #e3e3e3;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  ${SubcategoryList} {
    animation: slideDown 0.3s ease-out;
  }
`;

const SubcategoryItem = styled.div`
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    background: #e3eafe;
    transform: translateY(-2px);
  }
`;

const MetaValue = styled.span`
  font-weight: 500;
  color: #333;
`;

const MetaLabel = styled.span`
  font-weight: 400;
  color: #888;
  margin-right: 0.5rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const CategoryMeta = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const CategoryName = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
  color: #222;
`;

const CategoryDescription = styled.div`
  font-size: 1rem;
  color: #555;
  margin-bottom: 0.75rem;
`;

const CategoryCard = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  padding: 1.5rem;
  margin: 1rem 0;
  transition: all 0.2s;
  border-left: 4px solid #1976d2;
  position: relative;
  display: flex;
  gap: 1.5rem;
  width: 100%;
  max-width: 100%;
  opacity: 1;
  cursor: ${({ level }) => (level === 0 ? "pointer" : "default")};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  ${({ level }) =>
    level === 1 &&
    `
    max-width: 100%;
    margin: 0.5rem 0;
    padding: 1.5rem;
  `}
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25em 0.75em;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  background: ${({ $status }) =>
    $status === "Active" ? "#e3fcec" : "#ffeaea"};
  color: ${({ $status }) => ($status === "Active" ? "#388e3c" : "#d32f2f")};
  margin-left: 0.75rem;
`;

const CategoryImageContainer = styled.div`
  width: 150px;
  height: 150px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CategoryImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  opacity: ${({ $isLoading }) => ($isLoading ? 0.5 : 1)};

  &:hover {
    transform: scale(1.05);
  }
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #666;
  font-size: 0.9rem;
  text-align: center;
  padding: 1rem;
`;

const CategoryContent = styled.div`
  flex: 1;
`;

const VirtualizedList = styled(List)`
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  > div {
    padding: 1rem;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 95%;
  max-width: 1200px;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
`;

const SubcategoriesSection = styled.div`
  margin-top: 2rem;
  padding: 0 1rem;
`;

const SubcategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-top: 1.5rem;
  padding: 0 1rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const CategoryHeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
`;

const CategoryHeaderImageContainer = styled.div`
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f5f5f5;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const CategoryHeaderImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CategoryHeaderImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #666;
  font-size: 0.9rem;
  text-align: center;
  padding: 1rem;
`;

const CategoryNameHeader = styled.h1`
  font-size: 2.2rem;
  color: #2c3e50;
  margin: 0;
`;
