import React from "react";
import { Outlet } from "react-router-dom";

const EazShopLayout = () => {
  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ marginBottom: "16px" }}>EazShop Admin</h1>
      <p style={{ marginBottom: "24px", color: "#64748b" }}>
        This section is under active development. You can still navigate between the
        available EazShop admin pages.
      </p>
      <Outlet />
    </div>
  );
};

export default EazShopLayout;

