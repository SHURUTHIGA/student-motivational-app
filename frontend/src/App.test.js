import { render, screen } from "@testing-library/react";
import { AuthProvider } from "./context/AuthContext";

jest.mock("react-router-dom", () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Navigate: () => null,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  Link: ({ children, to, ...rest }) => <a href={to} {...rest}>{children}</a>,
  useNavigate: () => jest.fn()
}), { virtual: true });

import App from "./App";

test("renders the institution portal home page", () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );

  expect(screen.getAllByText(/astra neet jee coaching portal/i).length).toBeGreaterThan(0);
});
