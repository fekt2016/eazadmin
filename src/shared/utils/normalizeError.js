// Centralized error normalizer for all admin-facing React apps (Saiisai).
// Maps Axios / fetch / unknown errors to a consistent, user-friendly shape:
// { title: string, message: string, canRetry: boolean }

export const normalizeError = (error, options = {}) => {
  const {
    fallbackTitle = "Unexpected error",
    fallbackMessage = "Something went wrong. Please try again.",
    defaultCanRetry = true,
  } = options;

  if (!error) {
    return {
      title: fallbackTitle,
      message: fallbackMessage,
      canRetry: defaultCanRetry,
    };
  }

  const status = error.status || error.response?.status;
  const lowerMessage = (error.message || "").toLowerCase();
  const hasResponse = !!error.response;

  // TIMEOUT
  if (error.isTimeout || lowerMessage.includes("timeout")) {
    return {
      title: "Request timed out",
      message: "This is taking longer than expected. Please try again.",
      canRetry: true,
    };
  }

  // NETWORK / CONNECTION (no response from server at all)
  if (!hasResponse) {
    return {
      title: "Connection problem",
      message: "We couldn’t connect to the server. Check your internet and try again.",
      canRetry: true,
    };
  }

  // ACCESS DENIED
  if (status === 401 || status === 403) {
    return {
      title: "Access denied",
      message: "You don’t have permission to perform this action.",
      canRetry: false,
    };
  }

  // NOT FOUND
  if (status === 404) {
    return {
      title: "Not found",
      message: "The requested information could not be found.",
      canRetry: false,
    };
  }

  // VALIDATION / UNPROCESSABLE ENTITY
  if (status === 400 || status === 422) {
    return {
      title: "Invalid information",
      message: "Please check your input and try again.",
      canRetry: true,
    };
  }

  // SERVER ERRORS
  if (typeof status === "number" && status >= 500) {
    return {
      title: "Something went wrong",
      message: "We’re having trouble right now. Please try again later.",
      canRetry: true,
    };
  }

  // FALLBACK
  return {
    title: fallbackTitle,
    message: fallbackMessage,
    canRetry: defaultCanRetry,
  };
};

export default normalizeError;

