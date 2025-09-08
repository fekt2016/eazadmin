import { useCallback } from "react";

const useGetImmediateSubcategories = (categories) => {
  return useCallback(
    (categoryId) => {
      return categories
        .filter((cat) => {
          // Handle both string and object parentCategory values
          const parentId =
            typeof cat.parentCategory === "object"
              ? cat.parentCategory?._id
              : cat.parentCategory;
          return parentId === categoryId;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    [categories]
  );
};

export default useGetImmediateSubcategories;
