import { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext.tsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./AuthCallback.module.css";

function AuthCallback() {
  const code = new URLSearchParams(window.location.search).get("code");
  const { setUser, setAuthStatus } = useUser();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function handleAuthCallback() {
      if (code && !isProcessing) {
        setIsProcessing(true);
        try {
          const response = await fetch("/auth/callback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          });

          if (!response.ok) {
            throw new Error(`Authentication failed: ${response.status}`);
          }

          const { user } = await response.json();

          setUser(user);
          setAuthStatus("authenticated");
          toast.success("Successfully signed in!");
          navigate(sessionStorage.getItem("redirect_uri") || "/dashboard");
        } catch (err) {
          toast.error("Sign in failed. Please try again.");
          setError(err.message);
          setAuthStatus("unauthenticated");
          navigate("/?error=auth_failed");
        } finally {
          setIsProcessing(false);
        }
      }
    }
    handleAuthCallback();
  }, [code, setUser, setAuthStatus, navigate, isProcessing]);

  if (error) {
    return (
      <div className={styles.authCallback}>
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>Authentication Failed</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.errorButton} onClick={() => navigate("/")}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authCallback}>
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <h2 className={styles.loadingTitle}>Completing Authentication</h2>
        <p className={styles.loadingMessage}>
          Please wait while we sign you in...
        </p>
      </div>
    </div>
  );
}
export default AuthCallback;
