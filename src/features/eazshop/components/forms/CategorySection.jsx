import { useEffect, useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import styled from "styled-components";

const CategorySection = ({ categories, parentCategories: parentCategoriesProp }) => {
  const { control, setValue } = useFormContext();
  const parentCategory = useWatch({ control, name: "parentCategory" });
  const subCategory = useWatch({ control, name: "subCategory" });
  
  // Find the selected parent category object to access its subcategories array
  const selectedParentCategoryObj = useMemo(() => {
    if (!parentCategory) return null;
    
    // First try to find in parentCategoriesProp (from dedicated endpoint)
    if (parentCategoriesProp && Array.isArray(parentCategoriesProp)) {
      const found = parentCategoriesProp.find(p => {
        const pId = p._id ? (typeof p._id === 'object' && p._id.toString ? p._id.toString() : String(p._id)) : null;
        const selectedId = parentCategory ? (typeof parentCategory === 'object' && parentCategory.toString ? parentCategory.toString() : String(parentCategory)) : null;
        return pId === selectedId;
      });
      if (found) return found;
    }
    
    // Then try to find in all categories
    if (categories && Array.isArray(categories)) {
      const found = categories.find(c => {
        if (!c) return false;
        const cId = c._id ? (typeof c._id === 'object' && c._id.toString ? c._id.toString() : String(c._id)) : null;
        const selectedId = parentCategory ? (typeof parentCategory === 'object' && parentCategory.toString ? parentCategory.toString() : String(parentCategory)) : null;
        return cId === selectedId;
      });
      if (found) return found;
    }
    
    return null;
  }, [parentCategory, parentCategoriesProp, categories]);

  // Use parentCategories prop if provided (from dedicated endpoint), otherwise filter from all categories
  const parentCategories = useMemo(() => {
    // If parentCategories are provided directly (from /categories/parents endpoint), use them
    if (parentCategoriesProp && Array.isArray(parentCategoriesProp) && parentCategoriesProp.length > 0) {
      const sorted = [...parentCategoriesProp].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase().trim();
        const nameB = (b.name || '').toLowerCase().trim();
        return nameA.localeCompare(nameB);
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[CategorySection] Using parentCategories prop:', sorted.length);
      }
      
      return sorted;
    }
    
    // Otherwise, filter from all categories
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return [];
    }
    
    // Filter parent categories (categories without a parentCategory)
    const parents = categories.filter((cat) => {
      if (!cat) return false;
      
      // A category is a parent if it has no parentCategory
      // Check various formats: null, undefined, empty string, empty object
      const hasParentCategory = cat.parentCategory !== null && 
                                cat.parentCategory !== undefined && 
                                cat.parentCategory !== '' &&
                                !(typeof cat.parentCategory === 'object' && 
                                  Object.keys(cat.parentCategory || {}).length === 0);
      
      return !hasParentCategory;
    });
    
    // Sort alphabetically by name for better UX
    const sorted = parents.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase().trim();
      const nameB = (b.name || '').toLowerCase().trim();
      return nameA.localeCompare(nameB);
    });
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[CategorySection] Category filtering:', {
        totalCategories: categories.length,
        parentCategoriesFound: sorted.length,
        sampleCategories: categories.slice(0, 3).map(c => ({
          name: c.name,
          hasParent: !!c.parentCategory,
          parentType: typeof c.parentCategory,
          parentCategoryValue: c.parentCategory,
        })),
        parentCategoryNames: sorted.map(c => c.name),
      });
    }
    
    return sorted;
  }, [categories, parentCategoriesProp]);

  const subCategories = useMemo(() => {
    if (!parentCategory) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CategorySection] No parent category selected, returning empty subcategories');
      }
      return [];
    }
    
    // Method 1: Try to use subcategories array from the parent category object (if available)
    if (selectedParentCategoryObj && selectedParentCategoryObj.subcategories && Array.isArray(selectedParentCategoryObj.subcategories) && selectedParentCategoryObj.subcategories.length > 0) {
      // Map subcategory IDs to full category objects
      const subsFromParent = selectedParentCategoryObj.subcategories
        .map(subId => {
          const subIdStr = subId ? (typeof subId === 'object' && subId.toString ? subId.toString() : String(subId)) : null;
          return categories?.find(c => {
            if (!c) return false;
            const cIdStr = c._id ? (typeof c._id === 'object' && c._id.toString ? c._id.toString() : String(c._id)) : null;
            return cIdStr === subIdStr;
          });
        })
        .filter(Boolean); // Remove undefined entries
      
      if (subsFromParent.length > 0) {
        const sorted = subsFromParent.sort((a, b) => {
          const nameA = (a.name || '').toLowerCase().trim();
          const nameB = (b.name || '').toLowerCase().trim();
          return nameA.localeCompare(nameB);
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[CategorySection] Using subcategories from parent object:', {
            parentName: selectedParentCategoryObj.name,
            subcategoriesCount: sorted.length,
            subcategoryNames: sorted.map(s => s.name),
          });
        }
        
        return sorted;
      }
    }
    
    // Method 2: Filter by parentCategory field (fallback)
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CategorySection] No categories available for subcategory filtering');
      }
      return [];
    }
    
    // Filter subcategories that belong to the selected parent category
    const subs = categories.filter((cat) => {
      if (!cat) return false;
      
      // A category is a subcategory if it has a parentCategory
      // Handle various formats: ObjectId string, populated object, null, undefined
      if (!cat.parentCategory) return false;
      
      // Extract parent ID from various formats
      let catParentId = null;
      if (typeof cat.parentCategory === 'object' && cat.parentCategory !== null) {
        // Populated object: { _id: '...', name: '...' }
        // Could also be a Mongoose document with toString() method
        catParentId = cat.parentCategory._id || 
                     cat.parentCategory.id || 
                     (cat.parentCategory.toString && cat.parentCategory.toString()) ||
                     cat.parentCategory;
      } else if (cat.parentCategory) {
        // String/ObjectId - could be a string representation or ObjectId instance
        catParentId = cat.parentCategory;
      }
      
      // Normalize both IDs to strings for comparison
      // Handle ObjectId instances that have toString() method
      let catParentIdStr = null;
      if (catParentId) {
        if (typeof catParentId === 'object' && catParentId.toString) {
          catParentIdStr = catParentId.toString();
        } else {
          catParentIdStr = String(catParentId);
        }
      }
      
      let selectedParentIdStr = null;
      if (parentCategory) {
        if (typeof parentCategory === 'object' && parentCategory.toString) {
          selectedParentIdStr = parentCategory.toString();
        } else {
          selectedParentIdStr = String(parentCategory);
        }
      }
      
      // Also check if the category's _id matches (in case parentCategory is stored as _id reference)
      const catIdStr = cat._id ? (typeof cat._id === 'object' && cat._id.toString ? cat._id.toString() : String(cat._id)) : null;
      
      // Match if parent IDs match, or if this is a direct reference
      const matches = catParentIdStr === selectedParentIdStr;
      
      return matches;
    });
    
    // Sort alphabetically by name for better UX
    const sorted = subs.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase().trim();
      const nameB = (b.name || '').toLowerCase().trim();
      return nameA.localeCompare(nameB);
    });
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      // Find all categories with parentCategory to help debug
      const allCategoriesWithParent = categories.filter(c => c && c.parentCategory);
      const categoriesByParent = {};
      allCategoriesWithParent.forEach(cat => {
        let parentId = null;
        if (typeof cat.parentCategory === 'object' && cat.parentCategory !== null) {
          parentId = String(cat.parentCategory._id || cat.parentCategory.id || cat.parentCategory);
        } else if (cat.parentCategory) {
          parentId = String(cat.parentCategory);
        }
        if (parentId) {
          if (!categoriesByParent[parentId]) {
            categoriesByParent[parentId] = [];
          }
          categoriesByParent[parentId].push(cat.name);
        }
      });
      
      // Find Electronic category specifically for debugging
      const electronicCategory = categories.find(c => c && c.name && c.name.toLowerCase().includes('electronic'));
      const electronicSubs = categories.filter(c => {
        if (!c || !c.parentCategory) return false;
        let parentId = null;
        if (typeof c.parentCategory === 'object' && c.parentCategory !== null) {
          parentId = c.parentCategory._id || c.parentCategory.id || (c.parentCategory.toString && c.parentCategory.toString()) || c.parentCategory;
        } else if (c.parentCategory) {
          parentId = c.parentCategory;
        }
        const parentIdStr = parentId ? (typeof parentId === 'object' && parentId.toString ? parentId.toString() : String(parentId)) : null;
        const electronicIdStr = electronicCategory ? (typeof electronicCategory._id === 'object' && electronicCategory._id.toString ? electronicCategory._id.toString() : String(electronicCategory._id)) : null;
        return parentIdStr === electronicIdStr;
      });
      
      console.log('[CategorySection] Subcategory filtering:', {
        selectedParentCategory: parentCategory,
        selectedParentCategoryStr: String(parentCategory),
        selectedParentCategoryType: typeof parentCategory,
        totalCategories: categories.length,
        categoriesWithParent: allCategoriesWithParent.length,
        subCategoriesFound: sorted.length,
        // Electronic category debug info
        electronicCategory: electronicCategory ? {
          name: electronicCategory.name,
          _id: electronicCategory._id,
          _idStr: typeof electronicCategory._id === 'object' && electronicCategory._id.toString ? electronicCategory._id.toString() : String(electronicCategory._id),
          hasSubcategories: electronicSubs.length,
          subcategoryNames: electronicSubs.map(s => s.name),
        } : 'Not found',
        categoriesByParent: Object.keys(categoriesByParent).slice(0, 10).reduce((acc, key) => {
          acc[key] = categoriesByParent[key]; // Show all subcategories per parent
          return acc;
        }, {}),
        sampleSubCategories: sorted.slice(0, 5).map(c => ({
          name: c.name,
          _id: c._id,
          parentCategory: c.parentCategory,
          parentCategoryType: typeof c.parentCategory,
          parentCategoryId: typeof c.parentCategory === 'object' 
            ? (c.parentCategory?._id || c.parentCategory?.id || c.parentCategory)
            : c.parentCategory,
          parentCategoryIdStr: typeof c.parentCategory === 'object' 
            ? String(c.parentCategory?._id || c.parentCategory?.id || c.parentCategory)
            : String(c.parentCategory || ''),
        })),
        allSubCategoryNames: sorted.map(c => c.name),
        // Show a sample of categories that didn't match
        nonMatchingCategories: categories
          .filter(c => c && c.parentCategory)
          .slice(0, 3)
          .map(c => {
            let catParentId = null;
            if (typeof c.parentCategory === 'object' && c.parentCategory !== null) {
              catParentId = String(c.parentCategory._id || c.parentCategory.id || c.parentCategory);
            } else if (c.parentCategory) {
              catParentId = String(c.parentCategory);
            }
            return {
              name: c.name,
              parentId: catParentId,
              matches: catParentId === String(parentCategory),
            };
          }),
      });
    }
    
    return sorted;
  }, [categories, parentCategory, selectedParentCategoryObj]);

  useEffect(() => {
    if (subCategory && subCategories.every((cat) => cat._id !== subCategory)) {
      setValue("subCategory", "");
    }
  }, [subCategories, subCategory, setValue]);

  return (
    <div>
      <FormGroup>
        <Label>
          Parent Category
          {parentCategories.length > 0 && (
            <CategoryCount>({parentCategories.length} available)</CategoryCount>
          )}
        </Label>
        <Controller
          name="parentCategory"
          defaultValue={""}
          control={control}
          rules={{ required: "Please select a parent category" }}
          render={({ field, fieldState: { error } }) => (
            <div>
              <SelectContainer>
                <Select {...field} value={field.value || ""} $hasError={!!error}>
                  <option value="">Select a category</option>
                  {parentCategories.length === 0 ? (
                    <option value="" disabled>
                      No categories available
                    </option>
                  ) : (
                    parentCategories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </Select>
              </SelectContainer>
              {error && <ErrorMessage>{error.message}</ErrorMessage>}
            </div>
          )}
        />
      </FormGroup>

      {parentCategory && (
        <FormGroup>
          <Label>
            Sub Category
            {subCategories.length > 0 && (
              <CategoryCount>({subCategories.length} available)</CategoryCount>
            )}
          </Label>
          <Controller
            name="subCategory"
            defaultValue={""}
            control={control}
            rules={{ 
              required: "Please select a subcategory",
              validate: (value) => {
                if (!value || value === "") {
                  return "Please select a subcategory";
                }
                return true;
              }
            }}
            render={({ field, fieldState: { error } }) => (
              <div>
                <Select {...field} value={field.value || ""} $hasError={!!error}>
                  <option value="">Select a subcategory</option>
                  {subCategories.length === 0 ? (
                    <option value="" disabled>
                      No subcategories available for this category
                    </option>
                  ) : (
                    subCategories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </Select>
                {error && <ErrorMessage>{error.message}</ErrorMessage>}
              </div>
            )}
          />
        </FormGroup>
      )}
    </div>
  );
};

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;
const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 400;
  font-size: 1.0625rem;
  color: #2d3748;
`;
const SelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1.5px solid ${props => props.$hasError ? '#e53e3e' : '#e2e8f0'};
  border-radius: 8px;
  background-color: #fff;
  font-size: 1.0625rem;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 12px;
  padding-right: 2.5rem;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: ${props => props.$hasError ? '#e53e3e' : 'var(--color-primary-600)'};
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(229, 62, 62, 0.1)' : 'rgba(49, 130, 206, 0.1)'};
  }
  
  &:hover {
    border-color: ${props => props.$hasError ? '#e53e3e' : '#cbd5e0'};
  }
  
  /* Ensure all options are visible - native select handles scrolling */
  option {
    padding: 0.5rem;
    background-color: #fff;
    white-space: normal;
  }
  
  /* For very long lists, ensure dropdown is scrollable */
  &[size] {
    overflow-y: auto;
    max-height: 300px;
  }
`;

const CategoryCount = styled.span`
  font-size: 1rem;
  font-weight: 400;
  color: #718096;
  margin-left: 0.5rem;
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  font-weight: 400;
  padding: 0.5rem;
  background: #fed7d7;
  border-radius: 4px;
  border-left: 3px solid #e53e3e;
`;

export default CategorySection;
