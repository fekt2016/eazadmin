import { useCallback } from "react";

const useGetImmediateSubcategories = (categories) => {
  return useCallback(
    (categoryId) => {
      if (!categoryId || !categories || categories.length === 0) {
        return [];
      }
      
      // Normalize categoryId to string for comparison
      const normalizedCategoryId = categoryId?.toString ? categoryId.toString() : String(categoryId);
      
      return categories
        .filter((cat) => {
          if (!cat || !cat.parentCategory) {
            return false;
          }
          
          // Handle various parentCategory formats:
          // 1. Populated object: { _id: '...', name: '...' }
          // 2. ObjectId instance with toString() method
          // 3. String/ObjectId string
          // 4. null/undefined (no parent)
          
          let parentId = null;
          
          if (typeof cat.parentCategory === 'object' && cat.parentCategory !== null) {
            // Populated object or ObjectId instance
            parentId = cat.parentCategory._id || 
                      cat.parentCategory.id || 
                      (cat.parentCategory.toString && cat.parentCategory.toString()) ||
                      cat.parentCategory;
          } else if (cat.parentCategory) {
            // String/ObjectId - could be a string representation or ObjectId instance
            parentId = cat.parentCategory;
          }
          
          // Normalize parentId to string for comparison
          const normalizedParentId = parentId?.toString ? parentId.toString() : String(parentId || '');
          
          // Compare normalized IDs
          const matches = normalizedParentId === normalizedCategoryId;
          
          // Debug logging in development
          if (process.env.NODE_ENV === 'development' && matches) {
            console.debug('[useGetImmediateSubcategories] Found subcategory:', {
              subcategoryName: cat.name,
              subcategoryId: cat._id,
              parentId: normalizedParentId,
              categoryId: normalizedCategoryId,
              match: matches,
            });
          }
          
          return matches;
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },
    [categories]
  );
};

export default useGetImmediateSubcategories;
