import styles from "./App.module.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import RepositoryDashboard from "./pages/RepositoryDashboard";
import InstallationComplete from "./pages/InstallationComplete";
import MenuBar from "./components/MenuBar";
import { UserProvider, useUser } from "./contexts/UserContext.tsx";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

function App() {
  // Validate required environment variables
  useEffect(() => {
    const requiredEnvVars = ["REACT_APP_CLIENT_ID", "REACT_APP_BACKEND_URL"];
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      console.error(
        `❌ Required environment variables missing: ${missingVars.join(", ")}`
      );
      // In a real app, you might want to show an error UI instead
    }
  }, []);

  return (
    <BrowserRouter>
      <UserProvider>
        <div className={styles.App}>
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 2000, // Default expiration time for all toasts (4 seconds)
              style: {
                borderRadius: "8px",
                background: "#333",
                color: "#fff",
                fontSize: "16px",
              },
              success: {
                duration: 2000, // Success toast expiration (override global)
                style: {
                  background: "#4CAF50",
                  color: "#fff",
                },
              },
              error: {
                duration: 2000, // Error toast expiration (override global)
                style: {
                  background: "#FF5733",
                  color: "#fff",
                },
              },
            }}
          />
          <MenuBar />
          <RouteChangeChecker />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/repositories/:repoId"
              element={<RepositoryDashboard />}
            />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/installation-complete"
              element={<InstallationComplete />}
            />
          </Routes>
        </div>
      </UserProvider>
    </BrowserRouter>
  );
}

function RouteChangeChecker() {
  const { user, setUser, setAuthStatus, authStatus } = useUser();

  useEffect(() => {
    // Only run auth check if we haven't already determined auth status
    if (authStatus !== "loading") {
      return;
    }

    async function checkAuth() {
      const jwtResult = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/auth/verify`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (jwtResult.ok) {
        const { userId } = await jwtResult.json();
        if (!user) {
          const userResult = await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/auth/fetch-user`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId }),
            }
          );
          if (userResult.ok) {
            const { user } = await userResult.json();
            setUser(user);
            setAuthStatus("authenticated");
          } else {
            setAuthStatus("unauthenticated");
          }
        } else {
          setAuthStatus("authenticated");
        }
      } else {
        const refreshResult = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (refreshResult.ok) {
          const { userId } = await refreshResult.json();
          if (!user) {
            const userResult = await fetch(
              `${process.env.REACT_APP_BACKEND_URL}/auth/fetch-user`,
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId }),
              }
            );
            if (userResult.ok) {
              const { user } = await userResult.json();
              setUser(user);
              setAuthStatus("authenticated");
            } else {
              setAuthStatus("unauthenticated");
            }
          } else {
            setAuthStatus("authenticated");
          }
        } else {
          setUser(null);
          setAuthStatus("unauthenticated");
        }
      }
    }
    checkAuth();
  }, [user, setUser, setAuthStatus, authStatus]);
  return null;
}

export default App;

// TODO:
// add ui updates to go along with scanner updates
// clean up code
// maybe write tests?
// make scanner a docker container to allow for users to clone repos in areas other than my personal machine
// make it so that multiple users can reference the same snapshot
