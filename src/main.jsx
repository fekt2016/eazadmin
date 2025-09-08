import { lazy } from "react";
import ReactDOM from "react-dom/client";

// import { GlobalStyles } from "./styles/GlobalStyles.js";

const App = lazy(() => import("./App.jsx"));

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
