import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext.tsx";
import RepositoryModal from "../components/Dashboard/RepositoryModal.jsx";
import RepositoryCard from "../components/Dashboard/RepositoryCard.jsx";
import toast from "react-hot-toast";
import styles from "./Dashboard.module.css";

function Dashboard() {
  const { user, authStatus } = useUser();
  const navigate = useNavigate();

  // Modal state
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [newRepoList, setNewRepoList] = useState([]);
  const [repoList, setRepoList] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingInstallation, setLoadingInstallation] = useState(false);
  const [connectingRepo, setConnectingRepo] = useState(null); // Track which repo is being connected
  const [installationId, setInstallationId] = useState(null);

  async function openWindowAndWait(url, windowName = "_blank", features = "") {
    return new Promise((resolve, reject) => {
      const newWindow = window.open(url, windowName, features);

      if (!newWindow) {
        reject(new Error("Popup blocked or failed to open"));
        return;
      }

      // Poll to check if window is closed
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkClosed);
          resolve(true);
        }
      }, 1000);

      // Optional timeout
      setTimeout(() => {
        if (!newWindow.closed) {
          newWindow.close();
          clearInterval(checkClosed);
          reject(new Error("Window timeout"));
        }
      }, 60000); // 1 minute
    });
  }

  async function checkInstallation() {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/repos/check-installation`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInstallationId(data.installationId);
        return data.installationId;
      } else {
        return null;
      }
    } catch (error) {
      toast.error("Failed to check GitHub installation. Please try again.");
      return null;
    }
  }

  async function fetchNewRepos(installationId) {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/repos/fetch-new-repos`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ installationId, userId: user.id }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNewRepoList(data.repos || []);
        return data;
      } else {
        toast.error("Failed to fetch repositories. Please try again.");
        setNewRepoList([]);
        return null;
      }
    } catch (error) {
      toast.error("Failed to connect to GitHub. Please check your connection.");
      setNewRepoList([]);
      return null;
    } finally {
      setLoadingRepos(false);
    }
  }
  async function handleAddRepository() {
    setLoadingRepos(true);
    setShowRepoModal(true);
    const isInstalled = await checkInstallation();

    if (!isInstalled) {
      setLoadingInstallation(true);
      try {
        await openWindowAndWait(
          `${process.env.REACT_APP_APP_URL}/installations/new`,
          "github-install",
          "width=600,height=700,scrollbars=yes,resizable=yes"
        );

        // Re-check installation after window closes
        const newInstallCheck = await checkInstallation();
        if (newInstallCheck) {
          setInstallationId(newInstallCheck);
          await fetchNewRepos(newInstallCheck);
          toast.success("GitHub App installed successfully!");
        } else {
          toast.error("Installation may not have completed. Please try again.");
        }
      } catch (error) {
        toast.error("Installation failed. Please try again.");
      } finally {
        setLoadingInstallation(false);
      }
    } else {
      setInstallationId(isInstalled);
      await fetchNewRepos(isInstalled);
    }
  }

  // Modal handlers
  function handleCloseModal() {
    setShowRepoModal(false);
    setNewRepoList([]);
  }

  async function handleSelectRepository(repository) {
    if (repository.installed) {
      setConnectingRepo(repository.id);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/repos/clone`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              repoName: repository.name,
              repoId: repository.id,
              userId: user?.id,
            }),
          }
        );
        if (response.ok) {
          toast.success(
            `Repository "${repository.name}" connected successfully!`
          );
          // Refresh the repo list
          fetchRepos();
        } else {
          toast.error(
            `Failed to connect repository "${repository.name}". Please try again.`
          );
        }
      } catch (error) {
        toast.error(
          `Failed to connect repository "${repository.name}". Please try again.`
        );
      } finally {
        setConnectingRepo(null);
      }
    } else {
      await openWindowAndWait(
        `https://github.com/settings/installations/${installationId}`,
        "github-install",
        "width=600,height=700,scrollbars=yes,resizable=yes"
      );
      setConnectingRepo(repository.id);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/repos/clone`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              repoName: repository.name,
              repoId: repository.id,
              userId: user?.id,
            }),
          }
        );
        if (response.ok) {
          toast.success(
            `Repository "${repository.name}" connected successfully!`
          );
          // Refresh the repo list
          fetchRepos();
        } else {
          toast.error(
            `Failed to connect repository "${repository.name}". Please try again.`
          );
        }
      } catch (error) {
        toast.error(
          `Failed to connect repository "${repository.name}". Please try again.`
        );
      } finally {
        setConnectingRepo(null);
      }
    }
    setShowRepoModal(false);
  }

  // Load repositories when user is available
  async function fetchRepos() {
    if (!user?.id) return;

    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/repos/fetch-repos`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      }
    );
    if (response.ok) {
      const data = await response.json();
      setRepoList(data.repos || []);
    } else {
      toast.error("Failed to load your repositories. Please refresh the page.");
    }
  }

  useEffect(() => {
    fetchRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      // Redirect to login if user is not authenticated
      navigate("/");
    }
  }, [authStatus, navigate]);

  // Show loading state while checking authentication
  if (authStatus === "loading") {
    return (
      <div className={styles.dashboard}>
        <div className={styles.dashboardContainer}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if unauthenticated (redirect will happen)
  if (authStatus === "unauthenticated" || !user) {
    return null;
  }

  return (
    <div className={styles.dashboard}>
      {/* Repository Modal */}
      <RepositoryModal
        isOpen={showRepoModal}
        onClose={handleCloseModal}
        repositories={newRepoList}
        onSelectRepository={handleSelectRepository}
        loading={loadingRepos}
        connectingRepo={connectingRepo}
        loadingInstallation={loadingInstallation}
      />
      <div className={styles.dashboardContainer}>
        {/* Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.dashboardTitle}>Repository Dashboard</h1>
            <p className={styles.dashboardSubtitle}>
              Monitor code health, security, and knowledge across your
              repositories
            </p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{repoList.length}</span>
              <span className={styles.statLabel}>Repositories</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {repoList.length > 0 &&
                  (() => {
                    const validRepos = repoList.filter(
                      (repo) => repo.scores && repo.scores.overall != null
                    );
                    if (validRepos.length === 0) return "--";
                    const avg =
                      validRepos.reduce(
                        (acc, repo) => acc + repo.scores.overall,
                        0
                      ) / validRepos.length;
                    return avg.toFixed(1);
                  })()}
                {repoList.length === 0 && "--"}
              </span>
              <span className={styles.statLabel}>Avg Score</span>
            </div>
          </div>
        </div>

        {/* Repository Grid */}
        <div className={styles.repositoriesGrid}>
          {repoList.map((repo) => (
            <RepositoryCard repo={repo} />
          ))}
        </div>

        {/* Add Repository Card */}
        <div onClick={handleAddRepository} className={styles.addRepositoryCard}>
          <div className={styles.addRepoContent}>
            <svg
              className={styles.addIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
            </svg>
            <h3>Add New Repository</h3>
            <p>
              Connect a GitHub repository to start monitoring its code quality
            </p>
            <button className={styles.addRepoBtn}>
              <svg
                className={styles.githubIcon}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Connect Repository
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
