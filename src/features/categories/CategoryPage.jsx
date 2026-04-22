import { useMemo, useState } from "react";
import { compressImage } from '../../shared/utils/imageCompressor';
import styled from "styled-components";
import useCategory from '../../shared/hooks/useCategory';
import CategoryTree from '../../shared/components/category/CategoryTree';
import HeaderSection from '../../shared/components/category/HeaderSection';
import CategoryForm from '../../shared/components/category/CategoryForm';
import Breadcrumb from '../../shared/components/category/Breadcrumb';
import CategoryListView from '../../shared/components/category/CategoryListView';
import EmptyState from '../../shared/components/category/EmptyState';
import useProduct from '../../shared/hooks/useProduct';
import { LoadingSpinner, LoadingContainer } from '../../shared/components/LoadingSpinner';
import { ConfirmationModal } from '../../shared/components/Modal/ConfirmationModal';
import { normalizeApiResponse } from "../../shared/utils/apiUtils";

export default function CategoryPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [filters, setFilters] = useState({
    status: "ALL",
    search: "",
    viewMode: "list",
    parentFilter: "ALL",
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Active",
    parentCategory: null,
    image: null,
    attributes: [],
    shippingContribution: { dropship: 0, express: 0 },
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({ ...prev, [name]: value }));
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  // Wrapper function to handle filter changes from buttons/links
  // This ensures the page resets when filters change programmatically
  const handleFilterUpdate = (newFilters) => {
    setFilters((prev) => {
      const updated = typeof newFilters === 'function' ? newFilters(prev) : { ...prev, ...newFilters };
      // Reset to first page when parentFilter changes
      if (updated.parentFilter !== prev.parentFilter) {
        setCurrentPage(1);
      }
      return updated;
    });
  };

  const { getCategories, updateCategory, createCategory, deleteCategory } =
    useCategory();

  const { getProductCountByCategory } = useProduct();
  const { data: productCountByCategory } = getProductCountByCategory;

  // Add handleDelete function
  const handleDelete = (categoryId) => {
    setCategoryToDelete(categoryId);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory.mutate(categoryToDelete, {
        onSettled: () => setCategoryToDelete(null)
      });
    }
  };

  const handleUpdateCategory = ({ id, formData }) => {
    updateCategory.mutate({ id, formData });
  };

  const { data, isLoading: isGettingCategories } = getCategories;

  const categories = useMemo(() => {
    const cats = normalizeApiResponse(data) || [];

    // Check for exact "Electronics" category name (case-insensitive)
    const electronicsExact = cats.find(c =>
      c.name && c.name.toLowerCase().trim() === 'electronics'
    );

    // Check for categories containing "electron" (partial match)
    const electronicsPartial = cats.filter(c =>
      c.name && c.name.toLowerCase().includes('electron')
    );

    return cats;
  }, [data]);

  // Get top-level categories - memoized
  const topLevelCategories = useMemo(() => {
    const topLevel = categories.filter((cat) => {
      // Handle both object and string/null parentCategory
      const hasParent = cat.parentCategory !== null &&
        cat.parentCategory !== undefined &&
        cat.parentCategory !== '' &&
        !(typeof cat.parentCategory === 'object' &&
          Object.keys(cat.parentCategory || {}).length === 0);

      return !hasParent;
    });

    // Sort alphabetically
    const sorted = topLevel.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return sorted;
  }, [categories]);

  // Filter categories based on filters - memoized
  const filteredCategories = useMemo(() => {
    const searchTerm = filters.search ? filters.search.trim().toLowerCase() : '';
    const searchResults = [];
    const nonMatchingCategories = [];

    const filtered = categories.filter((cat) => {
      if (filters.status !== "ALL" && cat.status !== filters.status) {
        return false;
      }

      if (searchTerm) {
        // Normalize category name - handle whitespace, null/undefined, and normalize spaces
        const categoryName = String(cat.name || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' '); // Normalize multiple spaces to single space

        // PRIMARY: Check if search term matches category name (includes handles partial matches)
        const matchesName = categoryName.includes(searchTerm);

        // SECONDARY: Also try word boundary matching for better results
        // e.g., "electronic" should match "Electronics"
        const words = categoryName.split(/\s+/);
        const matchesWord = words.some(word => word.includes(searchTerm) || searchTerm.includes(word));

        // Only match by category name (name includes or word matching)
        const matches = matchesName || matchesWord;

        // Log detailed match information for each category
        const matchInfo = {
          categoryName: cat.name,
          categoryNameOriginal: cat.name,
          categoryNameNormalized: categoryName,
          categoryId: cat._id,
          searchTerm,
          matchesName,
          matchesWord,
          words: words,
          finalMatch: matches,
        };

        if (matches) {
          searchResults.push(matchInfo);
        } else {
          nonMatchingCategories.push(matchInfo);
        }

        // Show category ONLY if it matches the category name field
        if (!matches) {
          return false;
        }
      }

      // Filter by parent category
      if (filters.parentFilter !== "ALL") {
        if (filters.parentFilter === "TOP_LEVEL") {
          // Check if category is top-level (no parentCategory)
          // Use the SAME logic as topLevelCategories to ensure consistency
          // Handle various formats: null, undefined, empty string, empty object
          const hasParent = cat.parentCategory !== null &&
            cat.parentCategory !== undefined &&
            cat.parentCategory !== '' &&
            !(typeof cat.parentCategory === 'object' &&
              Object.keys(cat.parentCategory || {}).length === 0);

          // If it has a parent, filter it out
          if (hasParent) {
            return false;
          }
        } else {
          // Filter by specific parent category ID
          // Normalize both IDs to strings for reliable comparison
          let parentId = null;

          if (cat.parentCategory) {
            if (typeof cat.parentCategory === 'object' && cat.parentCategory !== null) {
              // Populated object or ObjectId instance
              parentId = cat.parentCategory._id ||
                cat.parentCategory.id ||
                (cat.parentCategory.toString && cat.parentCategory.toString()) ||
                cat.parentCategory;
            } else {
              // String/ObjectId
              parentId = cat.parentCategory;
            }
          }

          // Normalize both IDs to strings for comparison
          const parentIdStr = parentId?.toString ? parentId.toString() : String(parentId || '');
          const filterIdStr = filters.parentFilter?.toString ? filters.parentFilter.toString() : String(filters.parentFilter || '');

          // Debug logging in development - log ALL attempts, not just matches
          if (process.env.NODE_ENV === 'development') {
            console.debug('[CategoryPage] Parent filter check:', {
              categoryName: cat.name,
              categoryId: cat._id,
              parentCategory: cat.parentCategory,
              parentCategoryType: typeof cat.parentCategory,
              parentId: parentId,
              parentIdStr,
              filterIdStr,
              filterValue: filters.parentFilter,
              matches: parentIdStr === filterIdStr,
            });
          }

          if (parentIdStr !== filterIdStr) {
            return false;
          }
        }
      }

      return true;
    });

    return filtered;
  }, [categories, filters.status, filters.search, filters.parentFilter]);

  // Pagination - memoized
  const totalPages = useMemo(() => {
    return Math.ceil(filteredCategories.length / itemsPerPage);
  }, [filteredCategories.length, itemsPerPage]);

  const currentCategories = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredCategories, currentPage, itemsPerPage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Edit category
  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowForm(true);
    setImagePreview(category.image);

    setFormData({
      name: category.name,
      description: category.description,
      status: category.status,
      parentCategory: category.parentCategory,
      image: category.image,
      shippingContribution: category.shippingContribution || { dropship: 0, express: 0 },
    });
  };

  const handleSubmit = async (e, formDataWithAttributes) => {
    e.preventDefault();

    try {
      const form = new FormData();

      // 1. Handle regular form data
      const fields = ["name", "description", "status", "parentCategory"];
      fields.forEach((field) => {
        const value = formDataWithAttributes[field];
        if (value !== undefined && value !== null && value !== "") {
          form.append(field, value);
        }
      });

      // Specifically append the nested object as a JSON string so multer/express handles it properly
      if (formDataWithAttributes.shippingContribution) {
        form.append('shippingContribution', JSON.stringify(formDataWithAttributes.shippingContribution));
      }
      // 3. Handle attributes
      if (
        formDataWithAttributes.attributes &&
        formDataWithAttributes.attributes.length > 0
      ) {
        form.append(
          "attributes",
          JSON.stringify(formDataWithAttributes.attributes)
        );
      }

      // 4. Handle image
      if (formDataWithAttributes.image) {
        if (formDataWithAttributes.image instanceof Blob) {
          try {
            const compressedImage = await compressImage(
              formDataWithAttributes.image
            );
            form.append("image", compressedImage);
          } catch (error) {
            console.error("Image compression error:", error);
            form.append("image", formDataWithAttributes.image);
          }
        } else if (typeof formDataWithAttributes.image === "string") {
          form.append("image", formDataWithAttributes.image);
        }
      }

      // 5. Submit the form
      if (editingCategory) {
        updateCategory.mutate(
          {
            id: editingCategory._id,
            formData: form,
          },
          {
            onSuccess: () => resetForm(),
            onError: (error) => {
              console.error("Failed to update category status:", error);
            },
          }
        );
      } else {
        createCategory.mutate(form, {
          onSuccess: () => resetForm(),
        });
      }
    } catch (error) {
      if (error.response.data.errors) {
        const errors = error.response.data.errors.reduce((acc, error) => {
          acc[error.path] = error.msg;
          return acc;
        }, {});
        setFormErrors(errors);
      }
    }
  };

  // Reset form function
  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      status: "Active",
      parentCategory: null,
      image: null,
      shippingContribution: { dropship: 0, express: 0 },
    });
    setImagePreview(null);
    setFormErrors({});
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      status: "Active",
      parentCategory: null,
      shippingContribution: { dropship: 0, express: 0 },
    });
    setFormErrors({});
  };

  if (isGettingCategories)
    return (
      <LoadingContainer>
        <LoadingSpinner />;
      </LoadingContainer>
    );

  return (
    <Container>
      <HeaderSection
        filters={filters}
        filteredCategories={filteredCategories}
        setFilters={setFilters}
        handleFilterChange={handleFilterChange}
        topLevelCategories={topLevelCategories}
        setShowForm={setShowForm}
      />

      <CategoryForm
        categories={categories}
        showForm={showForm}
        editingCategory={editingCategory}
        handleSubmit={handleSubmit}
        formData={formData}
        handleInputChange={handleInputChange}
        formErrors={formErrors}
        setFormData={setFormData}
        imagePreview={imagePreview}
        topLevelCategories={topLevelCategories}
        setImagePreview={setImagePreview}
        cancelForm={cancelForm}
        createCategory={createCategory}
        updateCategory={updateCategory}
      />

      <Breadcrumb
        filters={filters}
        setFilters={setFilters}
        categories={categories}
      />
      {filters.viewMode === "tree" ? (
        <CategoriesTree>
          <CategoryTree
            categoriesTree={filteredCategories}
            categories={categories}
            setShowForm={setShowForm}
            setFilters={setFilters}
            setImagePreview={setImagePreview}
            setEditingCategory={setEditingCategory}
            setFormData={setFormData}
            level={0}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDelete}
            productCountByCategory={productCountByCategory}
          />
        </CategoriesTree>
      ) : currentCategories.length > 0 ? (
        <CategoryListView
          currentCategories={currentCategories}
          categories={categories}
          setFilters={handleFilterUpdate}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          updateCategory={updateCategory}
        />
      ) : (
        <EmptyState setShowForm={setShowForm} />
      )}
      {filters.viewMode === "list" &&
        filteredCategories.length > itemsPerPage && (
          <Pagination>
            <PaginationButton
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </PaginationButton>

            <PageInfo>
              Page {currentPage} of {totalPages}
            </PageInfo>

            <PaginationButton
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </PaginationButton>
          </Pagination>
        )}

      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        confirmText="Delete"
        confirmColor="#dc2626"
      />
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  padding: 2rem;
  background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
  min-height: 100vh;
  font-family: var(--font-body);

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const CategoriesTree = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 3rem;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(
    135deg,
    var(--color-primary-600) 0%,
    var(--color-primary-800) 100%
  );
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(187, 108, 2, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(187, 108, 2, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }
`;

const PageInfo = styled.span`
  font-size: 1.1rem;
  color: #475569;
  font-weight: 600;
  padding: 0 1rem;
`;
// import { useState } from "react";
// import { compressImage } from '../../shared/utils/imageCompressor';
// import styled from "styled-components";
// import useCategory from '../../shared/hooks/useCategory';
// import CategoryTree from '../shared/components/category/CategoryTree';
// import HeaderSection from '../shared/components/category/ HeaderSection';
// import CategoryForm from '../shared/components/category/CategoryForm';
// import Breadcrumb from '../shared/components/category/Breadcrumb';
// import CategoryListView from '../shared/components/category/CategoryListView';
// import EmptyState from '../shared/components/category/EmptyState';
// import useProduct from '../../shared/hooks/useProduct';
// import VariantsOptions from '../shared/components/category/VariantsOptions';

// const CategoryManagement = () => {
//   const [showForm, setShowForm] = useState(false);
//   const [editingCategory, setEditingCategory] = useState(null);
//   const [formErrors, setFormErrors] = useState({});
//   const [imagePreview, setImagePreview] = useState(null);
//   const itemsPerPage = 8;
//   const [currentPage, setCurrentPage] = useState(1);
//   const [filters, setFilters] = useState({
//     status: "ALL",
//     search: "",
//     viewMode: "tree",
//     parentFilter: "ALL",
//   });
//   const [showVariantForm, setShowVariantForm] = useState(false); // New state for variant form
//   const [variantFormCategory, setVariantFormCategory] = useState(null); // New state for category in variant form

//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     status: "Active",
//     parentCategory: null,
//   });

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   const { getCategories, updateCategory, createCategory, deleteCategory } =
//     useCategory();
//   const { getProductCountByCategory } = useProduct();
//   const { data: productCountByCategory } = getProductCountByCategory;

//   const handleDelete = (categoryId) => {
//     if (window.confirm("Are you sure you want to delete this category?")) {
//       deleteCategory.mutate(categoryId);
//     }
//   };

//   const handleUpdateCategory = ({ id, formData }) => {
//     updateCategory.mutate({ id, formData });
//   };

//   const { data, isLoading: isGettingCategories } = getCategories;
//   const { results = [] } = data || {};

//   const categories = results || [];

//   // Get top-level categories
//   const topLevelCategories = categories
//     .filter((cat) => cat.parentCategory === null)
//     .sort((a, b) => a.name.localeCompare(b.name));

//   // Filter categories based on filters
//   const filteredCategories = categories.filter((cat) => {
//     if (filters.status !== "ALL" && cat.status !== filters.status) {
//       return false;
//     }

//     if (filters.search) {
//       const searchLower = filters.search.toLowerCase();
//       if (
//         !cat.name.toLowerCase().includes(searchLower) &&
//         !(
//           cat.description && cat.description.toLowerCase().includes(searchLower)
//         )
//       ) {
//         return false;
//       }
//     }

//     if (filters.parentFilter !== "ALL") {
//       if (filters.parentFilter === "TOP_LEVEL") {
//         if (cat.parentCategory !== null) return false;
//       } else {
//         if (cat.parentCategory !== filters.parentFilter) return false;
//       }
//     }

//     return true;
//   });

//   // Pagination
//   const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;

//   const currentCategories = filteredCategories.slice(
//     indexOfFirstItem,
//     indexOfLastItem
//   );

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));

//     if (formErrors[name]) {
//       setFormErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   // Edit category
//   const handleEdit = (category) => {
//     setEditingCategory(category);
//     setShowForm(true);
//     setImagePreview(category.image);

//     setFormData({
//       name: category.name,
//       description: category.description,
//       status: category.status,
//       parentCategory: category.parentCategory,
//       image: category.image,
//     });
//   };

//   // NEW: Open variant options form
//   const handleEditVariants = (category) => {
//     setVariantFormCategory(category);
//     setShowVariantForm(true);
//   };

//   // NEW: Save variant options
//   const handleSaveVariants = (updatedCategory) => {
//     updateCategory.mutate({
//       id: updatedCategory._id,
//       formData: {
//         variantOptions: updatedCategory.variantOptions,
//         options: Array.from(updatedCategory.options.entries()),
//       },
//     });
//     setShowVariantForm(false);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const form = new FormData();

//     // Handle regular form data
//     Object.keys(formData).forEach((key) => {
//       if (key !== "image" && formData[key]) {
//         form.append(key, formData[key]);
//       }
//     });

//     // Handle variant options
//     if (formData.variantOptions) {
//       form.append("variantOptions", JSON.stringify(formData.variantOptions));
//     }
//     if (formData.options) {
//       form.append("options", JSON.stringify(Array.from(formData.options.entries())));
//     }

//     if (formData.image && formData.image instanceof Blob) {
//       const compressedImage = await compressImage(formData.image);
//       form.append("image", compressedImage, formData.image.name);
//     }

//     if (editingCategory) {
//       updateCategory.mutate(
//         {
//           id: editingCategory._id,
//           formData: form,
//         },
//         {
//           onSuccess: () => resetForm(),
//         }
//       );
//     } else {
//       createCategory.mutate(form, {
//         onSuccess: () => resetForm(),
//       });
//     }
//   };

//   // Reset form function
//   const resetForm = () => {
//     setShowForm(false);
//     setEditingCategory(null);
//     setFormData({
//       name: "",
//       description: "",
//       status: "Active",
//       parentCategory: null,
//       image: null,
//     });
//     setImagePreview(null);
//     setFormErrors({});
//   };

//   const cancelForm = () => {
//     setShowForm(false);
//     setEditingCategory(null);
//     setFormData({
//       name: "",
//       description: "",
//       status: "Active",
//       parentCategory: null,
//     });
//     setFormErrors({});
//   };

//   if (isGettingCategories) return <div>...Loading</div>;

//   return (
//     <Container>
//       <HeaderSection
//         filters={filters}
//         filteredCategories={filteredCategories}
//         setFilters={setFilters}
//         handleFilterChange={handleFilterChange}
//         topLevelCategories={topLevelCategories}
//         setShowForm={setShowForm}
//       />

//       <CategoryForm
//         showForm={showForm}
//         editingCategory={editingCategory}
//         handleSubmit={handleSubmit}
//         formData={formData}
//         handleInputChange={handleInputChange}
//         formErrors={formErrors}
//         setFormData={setFormData}
//         imagePreview={imagePreview}
//         topLevelCategories={topLevelCategories}
//         setImagePreview={setImagePreview}
//         cancelForm={cancelForm}
//       />

//       {/* NEW: Variant Options Form */}
//       {showVariantForm && variantFormCategory && (
//         <VariantFormContainer>
//           <VariantsOptions
//             category={variantFormCategory}
//             onSave={handleSaveVariants}
//             onCancel={() => setShowVariantForm(false)}
//           />
//         </VariantFormContainer>
//       )}

//       <Breadcrumb
//         filters={filters}
//         setFilters={setFilters}
//         categories={categories}
//       />

//       {filters.viewMode === "tree" ? (
//         <CategoriesTree>
//           <CategoryTree
//             categoriesTree={filteredCategories}
//             categories={categories}
//             setShowForm={setShowForm}
//             setFilters={setFilters}
//             setImagePreview={setImagePreview}
//             setEditingCategory={setEditingCategory}
//             setFormData={setFormData}
//             level={0}
//             onUpdateCategory={handleUpdateCategory}
//             onDeleteCategory={handleDelete}
//             productCountByCategory={productCountByCategory}
//             onEditVariants={handleEditVariants} // Pass new handler
//           />
//         </CategoriesTree>
//       ) : currentCategories.length > 0 ? (
//         <CategoryListView
//           currentCategories={currentCategories}
//           categories={categories}
//           setFilters={setFilters}
//           handleEdit={handleEdit}
//           handleEditVariants={handleEditVariants} // Pass new handler
//           handleDelete={handleDelete}
//           updateCategory={updateCategory}
//         />
//       ) : (
//         <EmptyState />
//       )}

//       {filters.viewMode === "list" &&
//         filteredCategories.length > itemsPerPage && (
//           <Pagination>
//             <PaginationButton
//               disabled={currentPage === 1}
//               onClick={() => setCurrentPage((prev) => prev - 1)}
//             >
//               Previous
//             </PaginationButton>

//             <PageInfo>
//               Page {currentPage} of {totalPages}
//             </PageInfo>

//             <PaginationButton
//               disabled={currentPage === totalPages || totalPages === 0}
//               onClick={() => setCurrentPage((prev) => prev + 1)}
//             >
//               Next
//             </PaginationButton>
//           </Pagination>
//         )}
//     </Container>
//   );
// };
// export default CategoryManagement;

// // Styled Components
// const Container = styled.div`
//   padding: 2rem;
//   background-color: #f8f9fa;
//   min-height: 100vh;
//   font-family: var(--font-body);
// `;

// const CategoriesTree = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 1rem;
// `;

// const Pagination = styled.div`
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   margin-top: 2rem;
//   gap: 1rem;
// `;

// const PaginationButton = styled.button`
//   padding: 0.7rem 1.5rem;
//   background-color: var(--color-primary-600);
//   color: white;
//   border: none;
//   border-radius: 8px;
//   font-size: 1rem;
//   font-weight: 500;
//   cursor: pointer;
//   transition: all 0.2s;

//   &:hover:not(:disabled) {
//     background-color: #2980b9;
//     transform: translateY(-2px);
//     box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
//   }

//   &:disabled {
//     background-color: #bdc3c7;
//     cursor: not-allowed;
//     opacity: 0.7;
//   }
// `;

// const PageInfo = styled.span`
//   font-size: 1.1rem;
//   color: #2c3e50;
//   font-weight: 500;
// `;

// // NEW: Container for variant form
// const VariantFormContainer = styled.div`
//   margin: 2rem 0;
//   background: white;
//   border-radius: 12px;
//   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
//   padding: 2rem;
// `;
