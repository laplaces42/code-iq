import { useUser } from "../contexts/UserContext.tsx";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import styles from "./MenuBar.module.css";

function MenuBar() {
  const { user, setUser, setAuthStatus } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  async function handleSignIn() {
    sessionStorage.setItem("redirect_uri", window.location.pathname);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.REACT_APP_CLIENT_ID}&scope=repo,read:user`;
  }

  async function handleLogout() {
    try {
      // Clear user data and session on backend
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Update authentication state
      setUser(null);
      setAuthStatus("unauthenticated");
      setShowDropdown(false);
      toast.success("Successfully signed out!");

      // Redirect to home
      window.location.href = "/";
    } catch (error) {
      // Even if backend logout fails, clear frontend state
      toast.error("Sign out failed, but clearing session anyway.");
      setUser(null);
      setAuthStatus("unauthenticated");
      setShowDropdown(false);
      window.location.href = "/";
    }
  }

  function toggleDropdown() {
    setShowDropdown(!showDropdown);
  }

  // Close dropdown when clicking outside
  function handleClickOutside(e) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setShowDropdown(false);
    }
  }

  // Add event listener for clicking outside
  if (showDropdown) {
    document.addEventListener("click", handleClickOutside);
  } else {
    document.removeEventListener("click", handleClickOutside);
  }

  return (
    <nav className={styles.menuBar}>
      <div className={styles.menuContainer}>
        {/* Logo/Brand */}
        <div className={styles.menuBrand}>
          <Link to="/" className={styles.brandLink}>
            <h1 className={styles.brandTitle}>CodeIQ</h1>
          </Link>
        </div>

        {/* User Section */}
        <div className={styles.menuUser}>
          {user ? (
            <>
              <Link to="/dashboard" className={styles.navLink}>
                Dashboard
              </Link>
              <div className={styles.userProfileContainer} ref={dropdownRef}>
                <div className={styles.userProfile} onClick={toggleDropdown}>
                  <img
                    src={user.avatarUrl}
                    alt={`${user.username}'s avatar`}
                    className={styles.userAvatar}
                  />
                  <span className={styles.userUsername}>{user.username}</span>
                  <svg
                    className={styles.dropdownArrow}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </div>
                {showDropdown && (
                  <div className={styles.userDropdown}>
                    <button
                      onClick={handleLogout}
                      className={styles.logoutButton}
                    >
                      <svg
                        className={styles.logoutIcon}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button onClick={handleSignIn} className={styles.signinButton}>
              <svg
                className={styles.githubIcon}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default MenuBar;
