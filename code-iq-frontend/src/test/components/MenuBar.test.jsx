import MenuBar from "../../components/MenuBar";
import { UserProvider, UserContext } from "../../contexts/UserContext.tsx";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUser = {
  id: "1",
  githubId: 1,
  username: "testuser",
  email: "testuser@example.com",
  avatarUrl: "https://avatars.githubusercontent.com/testuser",
};

describe("MenuBar", () => {
  let originalWindowLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      enumerable: true,
      value: new URL(window.location.href),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      enumerable: true,
      value: originalWindowLocation,
    });
  });

  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <UserProvider>
          <MenuBar />
        </UserProvider>
      </MemoryRouter>
    );
  });
  it("navigates to home page on logo click", () => {
    render(
      <MemoryRouter>
        <UserProvider>
          <MenuBar />
        </UserProvider>
      </MemoryRouter>
    );
    const logo = screen.getByText("CodeIQ");
    act(() => {
      logo.click();
    });
    expect(window.location.pathname).toBe("/");
  });

  describe("when user does not exist", () => {
    it("renders a signin button", () => {
      render(
        <MemoryRouter>
          <UserContext.Provider value={{ user: null }}>
            <MenuBar />
          </UserContext.Provider>
        </MemoryRouter>
      );
      const signinButton = screen.getByText("Sign in with GitHub");
      expect(signinButton).toBeInTheDocument();
    });

    it("calls handleSignIn on signin button click", () => {
      render(
        <MemoryRouter>
          <UserContext.Provider value={{ user: null }}>
            <MenuBar />
          </UserContext.Provider>
        </MemoryRouter>
      );
      const signinButton = screen.getByText("Sign in with GitHub");
      act(() => {
        signinButton.click();
      });
      expect(window.location.href).toContain(
        "github.com/login/oauth/authorize"
      );
    });
  });

  describe("when user exists", () => {
    it("renders a dashboard button", () => {
      render(
        <MemoryRouter>
          <UserContext.Provider value={{ user: mockUser }}>
            <MenuBar />
          </UserContext.Provider>
        </MemoryRouter>
      );
      const dashboardButton = screen.getByText("Dashboard");
      expect(dashboardButton).toBeInTheDocument();
    });

    it("navigates to dashboard on dashboard button click", () => {
      render(
        <MemoryRouter>
          <UserContext.Provider value={{ user: mockUser }}>
            <MenuBar />
          </UserContext.Provider>
          <Routes>
            <Route
              path="/dashboard"
              element={<div>Welcome to the Dashboard!</div>}
            />
          </Routes>
        </MemoryRouter>
      );
      const dashboardButton = screen.getByText("Dashboard");
      act(() => {
        dashboardButton.click();
      });
      expect(screen.getByText("Welcome to the Dashboard!")).toBeInTheDocument();
    });

    it("renders a profile button", () => {
      render(
        <MemoryRouter>
          <UserContext.Provider value={{ user: mockUser }}>
            <MenuBar />
          </UserContext.Provider>
        </MemoryRouter>
      );
      const profileButton = screen.getByText(mockUser.username);
      expect(profileButton).toBeInTheDocument();
    });

    it("renders a logout button on profile click", () => {
      render(
        <MemoryRouter>
          <UserContext.Provider value={{ user: mockUser }}>
            <MenuBar />
          </UserContext.Provider>
        </MemoryRouter>
      );
      const profileButton = screen.getByText(mockUser.username);
      act(() => {
        profileButton.click();
      });
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });
  });
});
