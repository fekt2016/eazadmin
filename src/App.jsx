import { useMemo } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GlobalStyles from "./shared/styles/GlobalStyles";
import AdminRoutes from "./routes/AdminRoutes";
import ScrollToTop from "./shared/ScrollToTop";
function App() {
  // Use useMemo to prevent creating new QueryClient on every render
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            gcTime: 1000 * 60 * 5, // 5 minutes garbage collection time
          },
        },
      }),
    []
  );
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyles />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ScrollToTop />
        <AdminRoutes />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </QueryClientProvider>
  );
}

export default App;
