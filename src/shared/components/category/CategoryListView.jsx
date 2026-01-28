import { useState } from "react";
import styled from "styled-components";
import { useGetSubCategoryCount } from '../../hooks/useGetSubCategoryCount';
import useGetImmediateSubcategories from '../../hooks/useGetImmediateSubcategories';
import useCategory from '../../hooks/useCategory';
import useProduct from '../../hooks/useProduct';
import { LoadingSpinner } from '../LoadingSpinner';

// Separate component for individual category card to allow hooks inside
const CategoryCardComponent = ({
  category,
  categories,
  expandedCategories,
  setExpandedCategories,
  setFilters,
  handleEdit,
  handleDelete,
  getImmediateSubcategories,
  getSubCategoryCount,
  updateCategory,
  useGetProductsByCategory,
}) => {
  const subCount = getSubCategoryCount(category._id);
  const hasChildren = subCount > 0;
  const subcategories = getImmediateSubcategories(category._id);
  const isExpanded = expandedCategories[category._id];
  
  // Fetch products for this category - hooks can be used here since it's a separate component
  const { data: productsData, isLoading: isLoadingProducts } = useGetProductsByCategory(
    category._id,
    { limit: 10, page: 1 }
  );
  
  const products = productsData?.data?.products || productsData?.products || [];
  const totalProducts = productsData?.data?.totalCount || productsData?.totalCount || products.length;

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
    <CategoryCard>
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
          <MetaValue>
            {isLoadingProducts ? (
              <LoadingSpinner size="sm" />
            ) : (
              totalProducts || 0
            )}
          </MetaValue>
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

      {/* Products Section */}
      {!isLoadingProducts && products.length > 0 && (
        <ProductsSection>
          <ProductsLabel>Products in this category ({totalProducts}):</ProductsLabel>
          <ProductsList>
            {products.slice(0, 5).map((product) => (
              <ProductItem key={product._id || product.id}>
                <ProductImage
                  src={product.imageCover || product.image || "https://placehold.co/50x50?text=No+Image"}
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = "https://placehold.co/50x50?text=Error";
                  }}
                />
                <ProductInfo>
                  <ProductName>{product.name}</ProductName>
                  <ProductPrice>GH₵{product.price?.toFixed(2) || "0.00"}</ProductPrice>
                </ProductInfo>
              </ProductItem>
            ))}
            {products.length > 5 && (
              <MoreProductsText>
                +{products.length - 5} more products
              </MoreProductsText>
            )}
          </ProductsList>
        </ProductsSection>
      )}

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
          onClick={() => {
            console.log('[CategoryListView] View All Sub-categories clicked:', {
              categoryId: category._id,
              categoryName: category.name,
              subCount,
              subcategories: subcategories.map(s => ({ name: s.name, _id: s._id })),
            });
            setFilters((prev) => {
              const newFilters = {
                ...prev,
                parentFilter: category._id.toString(),
              };
              console.log('[CategoryListView] Setting filter:', {
                oldFilter: prev.parentFilter,
                newFilter: newFilters.parentFilter,
              });
              return newFilters;
            });
          }}
        >
          View All Sub-categories
        </ViewSubButton>
      )}
    </CategoryCard>
  );
};

const CategoryListView = ({
  currentCategories,
  categories,
  setFilters,
  handleEdit,
  handleDelete,
  // handleEditVariants,
}) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const getImmediateSubcategories = useGetImmediateSubcategories(categories);
  const getSubCategoryCount = useGetSubCategoryCount(categories);
  const { updateCategory } = useCategory();
  const { useGetProductsByCategory } = useProduct();

  return (
    <CategoriesGrid>
      {currentCategories.map((category) => (
        <CategoryCardComponent
          key={category._id}
          category={category}
          categories={categories}
          expandedCategories={expandedCategories}
          setExpandedCategories={setExpandedCategories}
          setFilters={setFilters}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          getImmediateSubcategories={getImmediateSubcategories}
          getSubCategoryCount={getSubCategoryCount}
          updateCategory={updateCategory}
          useGetProductsByCategory={useGetProductsByCategory}
        />
      ))}
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

const ProductsSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #eee;
`;

const ProductsLabel = styled.span`
  display: block;
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 0.75rem;
  font-weight: 600;
`;

const ProductsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
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
`;

const ProductItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  transition: background 0.2s;
  
  &:hover {
    background: #e9ecef;
  }
`;

const ProductImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #dee2e6;
`;

const ProductInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProductName = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.2rem;
`;

const ProductPrice = styled.div`
  font-size: 0.75rem;
  color: #27ae60;
  font-weight: 600;
`;

const MoreProductsText = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: #7f8c8d;
  font-style: italic;
  padding: 0.5rem;
`;
