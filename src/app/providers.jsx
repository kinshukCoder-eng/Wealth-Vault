import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";
import { ThemeProvider } from "../contexts/ThemeContext";
import { UIProvider } from "../contexts/UIContext";

export function AppProviders({ children }) {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <UIProvider>{children}</UIProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}

export default AppProviders;
