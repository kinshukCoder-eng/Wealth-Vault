import React from "react";
import { RouterProvider } from "react-router-dom";
import AppProviders from "./app/providers";
import router from "./app/router";
import "./index.css";
import "./premium.css";

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
