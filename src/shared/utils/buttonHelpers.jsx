import { LoadingSpinner } from "../components/LoadingSpinner";

/**
 * Helper function to render button content with loading spinner
 * Usage:
 * {renderButtonContent(isLoading, "Save Changes", <FaSave />)}
 */
export const renderButtonContent = (isLoading, text, icon = null) => {
  if (isLoading) {
    return (
      <>
        <LoadingSpinner size="sm" color="currentColor" />
        <span>{text || "Loading..."}</span>
      </>
    );
  }
  
  return (
    <>
      {icon && <span>{icon}</span>}
      {text && <span>{text}</span>}
    </>
  );
};

/**
 * Helper to get loading state from mutation
 * Supports both isLoading (v4) and isPending (v5)
 */
export const getLoadingState = (mutation) => {
  return mutation?.isLoading || mutation?.isPending || false;
};

