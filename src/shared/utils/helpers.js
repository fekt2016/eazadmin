
export const formatCurrency = (value) =>
  `GH₵${Number(value || 0).toFixed(2)}`;

export function formatDate(dateStr) {
  const date = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));

  return date;
}

/** Generate SKU for product variants (EazShop uses id 'eazshop') */
export const generateSKU = ({ seller, variants, category }) => {
  const safeUser = seller || { id: "EAZ" };
  const safeVariants = variants || {};
  const safeCategory = (typeof category === "string" ? category : "UNK") || "UNK";
  try {
    const cate = safeCategory.slice(0, 3).toUpperCase();
    const variantString =
      Object.entries(safeVariants)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([, value]) => String(value).trim())
        .join("-")
        .replace(/\s+/g, "")
        .substring(0, 3)
        .toUpperCase() || "DEF";
    const userId = String(safeUser.id || "EAZ").slice(-3);
    const timestamp = Date.now().toString().slice(-4);
    return `${userId}-${cate}-${variantString}-${timestamp}`;
  } catch (e) {
    return `EAZ-${Date.now().toString().slice(-4)}`;
  }
};

export const randomOrderId = () => {
  const seq = (Math.floor(Math.random() * 100000) + 100000)
    .toString()
    .substring(1);
  const orderId = `EW${seq}`;
  return orderId;
};

export function formatTime(date) {
  const at = Number(new Date(date));
  const dateNow = Number(new Date());

  const calcDayspassed = (date1, date2) =>
    Math.round(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));

  const daysPassed = calcDayspassed(dateNow, at);

  if (daysPassed === 0) return "Today";
  if (daysPassed === 1) return "Yesterday";
  if (daysPassed <= 7) return `${daysPassed} days ago`;
  // else {
  // 	// const now = new Date(date);
  // 	// const day = `${now.getDate()}`.padStart(2, 0);
  // 	// const month = `${now.getMonth() + 1}`.padStart(2, 0);
  // 	// const year = now.getFullYear();
  // 	// return `${day}/${month}/${year}`;
  // }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// export const generateSKU = ({ productName, index }) => {
//   // Handle undefined/empty productName
//   const prefix = productName
//     ? productName.trim().slice(0, 3).toUpperCase()
//     : 'PRO';

//   // Generate random alphanumeric string
//   const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

//   return `${prefix}-${index}-${randomPart}`;
// };

export const getParentName = (parentId, categories) => {
  if (!parentId) return "None";
  const parent = categories.find((cat) => cat._id === parentId);
  return parent ? parent.name : "Unknown";
};

/**
 * Normalize technical errors (Axios / React Query / network)
 * into calm, user-friendly messages for display in the UI.
 *
 * IMPORTANT:
 * - Never surface raw error objects, stack traces or HTTP codes to users.
 * - Keep wording non-technical and action-oriented.
 */
export const getUserFriendlyErrorMessage = (
  error,
  fallbackMessage = "Something went wrong. Please try again."
) => {
  if (!error) return fallbackMessage;

  // Axios interceptor in api.js may already decorate the error
  const status = error.status || error.response?.status;
  const message = (error.message || "").toLowerCase();

  // Timeout
  if (error.isTimeout || message.includes("timeout")) {
    return "This is taking longer than expected. Please try again.";
  }

  // Pure network / connection issues (no response object)
  if (!error.response) {
    return "We couldn’t connect to the server. Check your internet and try again.";
  }

  // Auth / permission issues
  if (status === 401 || status === 403) {
    return "You don’t have permission to perform this action.";
  }

  // Not found
  if (status === 404) {
    return "The requested information could not be found.";
  }

  // Server-side errors
  if (typeof status === "number" && status >= 500) {
    return "Something went wrong on our side. Please try again later.";
  }

  // Fallback – avoid exposing raw server copy
  return fallbackMessage;
};


// utils/phoneValidation.js
// Ghana mobile: MTN 024/054/055/059/025; Telecel 020/050; AT 023/026/027/056/057
const networks = {
  MTN: ['24', '54', '55', '59', '25'],
  Telecel: ['20', '50'],
  AirtelTigo: ['23', '26', '27', '56', '57'],
};

export const validateGhanaPhone = (phone) => {
  const cleanedPhone = phone.replace(/\D/g, "");

  // Validate length
  if (cleanedPhone.length < 10 || cleanedPhone.length > 12) {
    return { valid: false, message: "Number must be 10 digits" };
  }

  // Handle both local (0xx) and intl (233xx) formats
  let localNumber = cleanedPhone;

  if (cleanedPhone.startsWith("233")) {
    localNumber = "0" + cleanedPhone.substring(3);
  }

  // Validate Ghanaian format
  if (!/^0(20|23|24|25|26|27|50|54|55|56|57|59)\d{7}$/.test(localNumber)) {
    return { valid: false, message: "Invalid Ghanaian number format" };
  }

  // Extract prefix
  const prefix = localNumber.substring(1, 3);

  // Identify network
  let network = "";
  for (const [net, prefixes] of Object.entries(networks)) {
    if (prefixes.includes(prefix)) {
      network = net;
      break;
    }
  }

  if (!network) {
    return { valid: false, message: "Unsupported network provider" };
  }

  // Format to E.164 standard
  const formattedPhone = `+233${localNumber.substring(1)}`;

  return {
    valid: true,
    formatted: formattedPhone,
    network,
  };
};
export const validateGhanaPhoneNumberOnly = (phone) => {
  // Remove all non-digit characters except leading '+'
  const cleanedPhone = phone.replace(/\D/g, "");

  // Check for valid Ghana formats:
  // 1. Local format: 0XXXXXXXXX (10 digits)
  // 2. International format: 233XXXXXXXXX (12 digits)
  // 3. International format with +: +233XXXXXXXXX (13 characters including '+')
  const localRegex = /^0\d{9}$/; // 0 followed by 9 digits
  const intlRegex = /^233\d{9}$/; // 233 followed by 9 digits
  const intlPlusRegex = /^\+233\d{9}$/; // +233 followed by 9 digits

  if (
    !localRegex.test(cleanedPhone) &&
    !intlRegex.test(cleanedPhone) &&
    !intlPlusRegex.test(phone)
  ) {
    return "Please enter a valid Ghana phone number";
  }

  return "";
};
