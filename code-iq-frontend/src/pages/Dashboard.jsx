import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext.tsx";
import RepositoryModal from "../components/RepositoryModal.jsx";
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
          body: JSON.stringify({ installationId }),
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
      await fetchNewRepos(isInstalled);
    }
  }

  // Modal handlers
  function handleCloseModal() {
    setShowRepoModal(false);
    setNewRepoList([]);
  }

  async function scanFullRepo(snapshotId) {
    // TODO: Implement repository scanning logic
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/scan/start`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ snapshotId }),
    });
  }

  async function handleSelectRepository(repository) {
    // TODO: Implement repository connection logic
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
          // const data = await response.json();
          // await scanFullRepo(data.snapshotId);
          toast.success(
            `Repository "${repository.name}" connected successfully!`
          );
          // Refresh the repo list
          fetchRepos();
          // Optionally, refresh the repo list or show success message
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

  const getStatusColor = (status) => {
    switch (status) {
      case "excellent":
        return "#48bb78";
      case "good":
        return "#4299e1";
      case "warning":
        return "#ed8936";
      case "critical":
        return "#f56565";
      default:
        return "#a0aec0";
    }
  };

  const getLanguageColor = (language) => {
    const colors = {
      TypeScript: "#3178c6",
      JavaScript: "#f7df1e",
      Python: "#3776ab",
      Java: "#ed8b00",
      "Node.js": "#339933",
      "React Native": "#61dafb",
      Go: "#00add8",
      Rust: "#000000",
    };
    return colors[language] || "#a0aec0";
  };

  // const getCIStatusIcon = (status) => {
  //   switch (status) {
  //     case "passing":
  //       return "✔";
  //     case "failing":
  //       return "✖";
  //     case "pending":
  //       return "◐";
  //     default:
  //       return "?";
  //   }
  // };

  // const getCIStatusColor = (status) => {
  //   switch (status) {
  //     case "passing":
  //       return "#48bb78";
  //     case "failing":
  //       return "#f56565";
  //     case "pending":
  //       return "#ed8936";
  //     default:
  //       return "#a0aec0";
  //   }
  // };

  const getTrendIcon = (trend) => {
    if (trend > 0) return "↗";
    if (trend < 0) return "↘";
    return "→";
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return "#48bb78";
    if (trend < 0) return "#f56565";
    return "#a0aec0";
  };

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
      <div className="dashboard">
        <div className="dashboard-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
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
                  (
                    repoList.reduce(
                      (acc, repo) => acc + repo.scores.overall,
                      0
                    ) / repoList.length
                  ).toFixed(1)}
                {repoList.length === 0 && "--"}
              </span>
              <span className={styles.statLabel}>Avg Score</span>
            </div>
            {/* <div className={styles.statCard}>
              <span className={styles.statValue}>
                {repositories.reduce(
                  (acc, repo) => acc + repo.criticalAlerts,
                  0
                )}
              </span>
              <span className={styles.statLabel}>Critical Alerts</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {
                  repositories.filter((repo) => repo.ciStatus === "failing")
                    .length
                }
              </span>
              <span className={styles.statLabel}>Failing Builds</span>
            </div> */}
          </div>
        </div>

        {/* Repository Grid */}
        <div className={styles.repositoriesGrid}>
          {repoList.map((repo) => (
            <div key={repo.id} className={styles.repositoryCard}>
              <div className={styles.repoHeader}>
                <div className={styles.repoInfo}>
                  <h3 className={styles.repoName}>{repo.name}</h3>
                  <p className={styles.repoDescription}>{repo.description}</p>
                </div>
                <div className={styles.repoMeta}>
                  {/* <span
                    className={styles.languageTag}
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  >
                    {repo.language}
                  </span> */}
                  {/* <div
                    className={styles.statusIndicator}
                    style={{ backgroundColor: getStatusColor(repo.status) }}
                  ></div> */}
                </div>
              </div>

              {/* <div className={styles.repoStats}>
                <div className={styles.repoInfoRow}>
                  <div className={styles.ciStatus}>
                    <span
                      className={styles.ciIcon}
                      style={{ color: getCIStatusColor(repo.ciStatus) }}
                    >
                      {getCIStatusIcon(repo.ciStatus)}
                    </span>
                    <span className={styles.ciText}>CI {repo.ciStatus}</span>
                  </div>
                  <div className={styles.lastCommit}>
                    <span className={styles.commitTime}>
                      {repo.lastCommit.timestamp}
                    </span>
                    <span className={styles.commitAuthor}>
                      by {repo.lastCommit.author}
                    </span>
                  </div>
                </div>

                {repo.criticalAlerts > 0 && (
                  <div className={styles.criticalAlerts}>
                    <span className={styles.alertIcon}>🛡️</span>
                    <span className={styles.alertCount}>
                      {repo.criticalAlerts} critical alerts
                    </span>
                  </div>
                )}
              </div> */}

              <div className={styles.scoreSection}>
                <div className={styles.overallScore}>
                  <span className={styles.scoreLabel}>Overall Score</span>
                  <div className={styles.scoreWithTrend}>
                    <span
                      className={styles.scoreValue}
                      style={{ color: getStatusColor(repo.status) }}
                    >
                      {repo.scores.overall.toFixed(1)}/10
                    </span>
                    <span
                      className={styles.trendIndicator}
                      style={{ color: getTrendColor(repo.scores.trend) }}
                    >
                      {getTrendIcon(repo.scores.trend)}{" "}
                      {Math.abs(repo.scores.trend).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className={styles.detailedScores}>
                  <div className={styles.scoreBar}>
                    <span className={styles.scoreName}>Health</span>
                    <div className={styles.progressBar}>
                      <div
                        className={`${styles.progressFill} ${styles.health}`}
                        style={{ width: `${repo.scores.health * 10}%` }}
                      ></div>
                    </div>
                    <span className={styles.scoreNumber}>
                      {repo.scores.health.toFixed(1)}
                    </span>
                  </div>

                  <div className={styles.scoreBar}>
                    <span className={styles.scoreName}>Security</span>
                    <div className={styles.progressBar}>
                      <div
                        className={`${styles.progressFill} ${styles.security}`}
                        style={{ width: `${repo.scores.security * 10}%` }}
                      ></div>
                    </div>
                    <span className={styles.scoreNumber}>
                      {repo.scores.security.toFixed(1)}
                    </span>
                  </div>

                  <div className={styles.scoreBar}>
                    <span className={styles.scoreName}>Knowledge</span>
                    <div className={styles.progressBar}>
                      <div
                        className={`${styles.progressFill} ${styles.knowledge}`}
                        style={{ width: `${repo.scores.knowledge * 10}%` }}
                      ></div>
                    </div>
                    <span className={styles.scoreNumber}>
                      {repo.scores.knowledge.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.repoFooter}>
                <div className={styles.repoActions}>
                  <button
                    className={styles.actionBtnPrimary}
                    onClick={() => navigate(`/repositories/${repo.id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className={styles.actionBtnSecondary}
                    title="Open in GitHub"
                    onClick={() =>
                      window.open(`https://github.com/${repo.name}`)
                    }
                  >
                    <svg
                      className={styles.githubIcon}
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                  </button>
                  <button
                    className={styles.actionBtnSecondary}
                    title="Re-scan now"
                  >
                    <svg
                      className={styles.refreshIcon}
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M8 3a5 5 0 104.546 2.914.5.5 0 00-.908-.417A4 4 0 118 4v1z" />
                      <path d="M8 4.466V.534a.25.25 0 01.41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 018 4.466z" />
                    </svg>
                  </button>
                </div>

                <div className={styles.repoMetadata}>
                  <div className={styles.activityBadge}>
                    <span
                      className={
                        styles[
                          `activityStatus${
                            repo.activityStatus.charAt(0).toUpperCase() +
                            repo.activityStatus.slice(1)
                          }`
                        ]
                      }
                    >
                      {repo.activityStatus}
                    </span>
                  </div>
                  <span
                    className={styles.languageTag}
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  >
                    {repo.language}
                  </span>
                </div>
              </div>
            </div>
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
