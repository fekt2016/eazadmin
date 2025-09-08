import { useCallback } from "react";

export const useGetSubCategoryCount = (categories) => {
  return useCallback(
    (categoryId) => {
      return categories.filter((cat) => {
        const parentId =
          typeof cat.parentCategory === "object"
            ? cat.parentCategory?._id
            : cat.parentCategory;
        return parentId === categoryId;
      }).length;
    },
    [categories]
  );
};
