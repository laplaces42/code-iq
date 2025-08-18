import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart3,
  FolderOpen,
  Search,
  Trophy,
  AlertTriangle,
  Folder,
  FileText,
  Bot,
  RotateCcw,
  ArrowLeft,
  Github,
  Eye,
  History,
  Bug,
  Settings,
  Trash2,
  Bell,
  Clock,
  FolderSync,
} from "lucide-react";
import styles from "./RepositoryDashboard.module.css";

function RepositoryDashboard() {
  const { repoId } = useParams();
  const navigate = useNavigate();

  // Main state
  const [repository, setRepository] = useState(null);
  const [fileSnapshots, setFileSnapshots] = useState([]);
  const [activeScans, setActiveScans] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [activeWorkspaceView, setActiveWorkspaceView] = useState("dashboard"); // 'dashboard', 'files', 'scans', 'prs', 'settings'
  const [selectedFile, setSelectedFile] = useState(null);
  const [scoreFilter, setScoreFilter] = useState("overall"); // 'overall', 'health', 'security', 'knowledge'

  // File explorer state
  const [currentPath, setCurrentPath] = useState(""); // Current folder path
  const [fileTree, setFileTree] = useState({}); // Full file tree structure

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      type: "assistant",
      content:
        "Welcome to your codebase intelligence assistant! I can help you understand your code health metrics, navigate files, and provide insights about your repository.",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Settings state
  const [settings, setSettings] = useState({
    syncFrequency: "daily", // 'manual', 'daily', 'weekly'
    notifications: {
      scoreDrops: true,
      newIssues: true,
      scanComplete: false,
    },
    autoScan: {
      onPush: true,
      onPR: true,
      scheduled: false,
    },
    dataRetention: "90", // days
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRepo, setDeletingRepo] = useState(false);

  // Mock data for development - replace with actual API calls
  useEffect(() => {
    async function fetchRepoInfo() {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/repos/fetch-repo-info/${repoId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch repository data");
        }
        const data = await response.json();
        setRepository(data.repo);
        setFileSnapshots(data.files);
        setActiveScans(data.scans);
      } catch (error) {
        toast.error("Failed to load repository data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    fetchRepoInfo();
  }, [repoId]);

  // Build file tree structure from flat file list
  useEffect(() => {
    if (fileSnapshots.length > 0) {
      const tree = {};

      fileSnapshots.forEach((file) => {
        const parts = file.filePath.split("/");
        let current = tree;

        // Build the nested structure
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isFile = i === parts.length - 1;

          if (!current[part]) {
            current[part] = {
              type: isFile ? "file" : "folder",
              path: parts.slice(0, i + 1).join("/"),
              name: part,
              data: isFile ? file : null,
              children: isFile ? null : {},
            };
          }

          if (!isFile) {
            current = current[part].children;
          }
        }
      });

      setFileTree(tree);
    }
  }, [fileSnapshots]);

  // Get current directory contents based on currentPath
  const getCurrentDirectoryContents = () => {
    if (!currentPath) {
      // Root directory
      return Object.values(fileTree);
    }

    // Navigate to the current path
    const parts = currentPath.split("/");
    let current = fileTree;

    for (const part of parts) {
      if (current[part] && current[part].children) {
        current = current[part].children;
      } else {
        return []; // Path not found
      }
    }

    return Object.values(current);
  };

  // Navigate to a folder
  const navigateToFolder = (folderPath) => {
    setCurrentPath(folderPath);
  };

  // Go back to parent directory
  const goBack = () => {
    if (currentPath) {
      const parts = currentPath.split("/");
      parts.pop();
      setCurrentPath(parts.join("/"));
    }
  };

  // Get breadcrumb path for navigation
  const getBreadcrumbs = () => {
    const baseCrumbs = !currentPath
      ? [repository.name]
      : [repository.name, ...currentPath.split("/")];

    // Add selected file to breadcrumbs if viewing a file
    if (selectedFile) {
      return [...baseCrumbs, selectedFile.filePath.split("/").pop()];
    }

    return baseCrumbs;
  };

  // Get file icon - unified icon for all files
  const getFileIcon = (fileName) => {
    return <FileText size={16} />;
  };

  // Helper functions
  const calculateOverallScore = (file) => {
    if (!file) return 0;
    return (file.healthScore + file.securityScore + file.knowledgeScore) / 3;
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "#10b981"; // green
    if (score >= 6) return "#f59e0b"; // yellow
    if (score >= 4) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Needs Work";
    return "Critical";
  };

  const sortedFiles = [...fileSnapshots].sort((a, b) => {
    const scoreA =
      scoreFilter === "overall"
        ? calculateOverallScore(a)
        : a[`${scoreFilter}Score`];
    const scoreB =
      scoreFilter === "overall"
        ? calculateOverallScore(b)
        : b[`${scoreFilter}Score`];
    return scoreB - scoreA;
  });

  const topFiles = sortedFiles.slice(0, 5);
  const bottomFiles = sortedFiles.slice(-5).reverse();

  // Chat handlers
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = {
      type: "user",
      content: chatInput,
      timestamp: new Date(),
    };
    const assistantResponse = {
      type: "assistant",
      content: generateContextualResponse(chatInput),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage, assistantResponse]);
    setChatInput("");
  };

  const generateContextualResponse = (input) => {
    const context = getContextualInfo();

    if (input.toLowerCase().includes("score")) {
      return `Based on your current ${activeWorkspaceView} view, I can see your repository has a health score of ${repository?.healthScore?.toFixed(
        1
      )}, security score of ${repository?.securityScore?.toFixed(
        1
      )}, and knowledge score of ${repository?.knowledgeScore?.toFixed(
        1
      )}. ${context}`;
    }

    if (input.toLowerCase().includes("file")) {
      return `You're currently viewing ${
        fileSnapshots.length
      } analyzed files. ${
        selectedFile
          ? `The selected file "${
              selectedFile.filePath
            }" has scores: Health ${selectedFile.healthScore?.toFixed(
              1
            )}, Security ${selectedFile.securityScore?.toFixed(
              1
            )}, Knowledge ${selectedFile.knowledgeScore?.toFixed(1)}.`
          : "Click on any file to see detailed metrics."
      } ${context}`;
    }

    if (input.toLowerCase().includes("scan")) {
      const recentScan = activeScans[0];
      return `Your latest scan shows ${recentScan?.status} status. You have ${
        activeScans.filter((s) => s.status === "completed").length
      } completed scans and ${
        activeScans.filter((s) => s.status === "running").length
      } currently running. ${context}`;
    }

    return `I'm analyzing your "${repository?.name}" repository. Currently viewing: ${activeWorkspaceView}. ${context} How can I help you understand your codebase better?`;
  };

  const getContextualInfo = () => {
    switch (activeWorkspaceView) {
      case "dashboard":
        return `Focus area: Overall repository health analysis with ${scoreFilter} score filtering.`;
      case "files":
        return `Focus area: File-level analysis of ${fileSnapshots.length} files.`;
      case "scans":
        return `Focus area: Scan history and monitoring.`;
      case "settings":
        return `Focus area: Repository configuration and preferences.`;
      default:
        return "Exploring repository metrics and insights.";
    }
  };

  // Settings handlers
  const updateSettings = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    // TODO: Save to backend
    toast.success(`Settings updated successfully!`);
    setChatMessages((prev) => [
      ...prev,
      {
        type: "assistant",
        content: `Updated ${key} setting successfully!`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleDeleteRepository = async () => {
    setDeletingRepo(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/repos/${repoId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        toast.success("Repository removed successfully! Redirecting...");
        setChatMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content:
              "Repository removed successfully. Redirecting to dashboard...",
            timestamp: new Date(),
          },
        ]);

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        throw new Error("Failed to delete repository");
      }
    } catch (error) {
      toast.error("Failed to remove repository. Please try again.");
      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "Failed to remove repository. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setDeletingRepo(false);
    }
    setShowDeleteConfirm(false);
  };

  // File actions
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setChatMessages((prev) => [
      ...prev,
      {
        type: "assistant",
        content: `Added "${
          file.filePath
        }" to chat context. This file has health: ${file.healthScore?.toFixed(
          1
        )}, security: ${file.securityScore?.toFixed(
          1
        )}, knowledge: ${file.knowledgeScore?.toFixed(
          1
        )}. What would you like to know about it?`,
        timestamp: new Date(),
      },
    ]);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading repository insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Left Workspace Panel (2/3 width) */}
      <div className={styles.workspacePanel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.repoInfo}>
            <div className={styles.breadcrumb}>
              <button
                onClick={() => navigate("/dashboard")}
                className={styles.breadcrumbLink}
              >
                Dashboard
              </button>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>
                {repository?.name}
              </span>
            </div>
            <h1 className={styles.repoName}>{repository?.fullName}</h1>
            <p className={styles.repoDescription}>{repository?.description}</p>
            <div className={styles.repoMeta}>
              <span className={styles.language}>{repository?.language}</span>
            </div>
          </div>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${
                activeWorkspaceView === "dashboard" ? styles.active : ""
              }`}
              onClick={() => setActiveWorkspaceView("dashboard")}
            >
              <BarChart3 size={16} /> Dashboard
            </button>
            <button
              className={`${styles.toggleBtn} ${
                activeWorkspaceView === "files" ? styles.active : ""
              }`}
              onClick={() => setActiveWorkspaceView("files")}
            >
              <FolderOpen size={16} /> Files
            </button>
            <button
              className={`${styles.toggleBtn} ${
                activeWorkspaceView === "scans" ? styles.active : ""
              }`}
              onClick={() => setActiveWorkspaceView("scans")}
            >
              <Search size={16} /> Scans
            </button>
            <button
              className={`${styles.toggleBtn} ${
                activeWorkspaceView === "settings" ? styles.active : ""
              }`}
              onClick={() => setActiveWorkspaceView("settings")}
            >
              <Settings size={16} /> Settings
            </button>
          </div>
        </div>

        {/* Workspace Content */}
        <div className={styles.workspaceContent}>
          {/* Dashboard View */}
          {activeWorkspaceView === "dashboard" && (
            <div className={styles.dashboardView}>
              {/* Repository Score Cards */}
              <div className={styles.scoresSection}>
                <h2>Repository Health Overview</h2>
                <div className={styles.scoresGrid}>
                  <div className={styles.scoreCard}>
                    <div className={styles.scoreHeader}>
                      <h3>Overall Score</h3>
                      <div
                        className={styles.trend}
                        data-positive={repository?.trend > 0}
                      >
                        {repository?.trend > 0
                          ? "↗"
                          : repository?.trend < 0
                          ? "↘"
                          : "→"}{" "}
                        {Math.abs(repository?.trend || 0).toFixed(1)}
                      </div>
                    </div>
                    <div
                      className={styles.scoreValue}
                      style={{
                        color: getScoreColor(calculateOverallScore(repository)),
                      }}
                    >
                      {calculateOverallScore(repository).toFixed(1)}
                    </div>
                    <div className={styles.scoreLabel}>
                      {getScoreLabel(calculateOverallScore(repository))}
                    </div>
                  </div>

                  <div className={styles.scoreCard}>
                    <div className={styles.scoreHeader}>
                      <h3>Health Score</h3>
                    </div>
                    <div
                      className={styles.scoreValue}
                      style={{
                        color: getScoreColor(repository?.healthScore || 0),
                      }}
                    >
                      {repository?.healthScore?.toFixed(1) || "0.0"}
                    </div>
                    <div className={styles.scoreLabel}>
                      {getScoreLabel(repository?.healthScore || 0)}
                    </div>
                    <div className={styles.scoreDetails}>
                      Code quality, complexity, coverage
                    </div>
                  </div>

                  <div className={styles.scoreCard}>
                    <div className={styles.scoreHeader}>
                      <h3>Security Score</h3>
                    </div>
                    <div
                      className={styles.scoreValue}
                      style={{
                        color: getScoreColor(repository?.securityScore || 0),
                      }}
                    >
                      {repository?.securityScore?.toFixed(1) || "0.0"}
                    </div>
                    <div className={styles.scoreLabel}>
                      {getScoreLabel(repository?.securityScore || 0)}
                    </div>
                    <div className={styles.scoreDetails}>
                      Vulnerabilities, secrets, compliance
                    </div>
                  </div>

                  <div className={styles.scoreCard}>
                    <div className={styles.scoreHeader}>
                      <h3>Knowledge Score</h3>
                    </div>
                    <div
                      className={styles.scoreValue}
                      style={{
                        color: getScoreColor(repository?.knowledgeScore || 0),
                      }}
                    >
                      {repository?.knowledgeScore?.toFixed(1) || "0.0"}
                    </div>
                    <div className={styles.scoreLabel}>
                      {getScoreLabel(repository?.knowledgeScore || 0)}
                    </div>
                    <div className={styles.scoreDetails}>
                      Documentation, maintainers, bus factor
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Analysis Controls */}
              <div className={styles.analysisSection}>
                <div className={styles.analysisHeader}>
                  <h2>File Analysis</h2>
                  <div className={styles.filterControls}>
                    <span>Filter by:</span>
                    {["overall", "health", "security", "knowledge"].map(
                      (filter) => (
                        <button
                          key={filter}
                          className={`${styles.filterBtn} ${
                            scoreFilter === filter ? styles.active : ""
                          }`}
                          onClick={() => setScoreFilter(filter)}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Top and Bottom Files */}
                <div className={styles.filesAnalysis}>
                  <div className={styles.filesList}>
                    <h3>
                      <Trophy size={18} /> Top Performing Files
                    </h3>
                    {topFiles.map((file) => (
                      <div
                        key={file.id}
                        className={styles.fileItem}
                        onClick={() => handleFileSelect(file)}
                      >
                        <div className={styles.fileName}>{file.filePath}</div>
                        <div
                          className={styles.fileScore}
                          style={{
                            color: getScoreColor(
                              scoreFilter === "overall"
                                ? calculateOverallScore(file)
                                : file[`${scoreFilter}Score`]
                            ),
                          }}
                        >
                          {scoreFilter === "overall"
                            ? calculateOverallScore(file).toFixed(1)
                            : file[`${scoreFilter}Score`]?.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.filesList}>
                    <h3>
                      <AlertTriangle size={18} /> Files Needing Attention
                    </h3>
                    {bottomFiles.map((file) => (
                      <div
                        key={file.id}
                        className={styles.fileItem}
                        onClick={() => handleFileSelect(file)}
                      >
                        <div className={styles.fileName}>{file.filePath}</div>
                        <div
                          className={styles.fileScore}
                          style={{
                            color: getScoreColor(
                              scoreFilter === "overall"
                                ? calculateOverallScore(file)
                                : file[`${scoreFilter}Score`]
                            ),
                          }}
                        >
                          {scoreFilter === "overall"
                            ? calculateOverallScore(file).toFixed(1)
                            : file[`${scoreFilter}Score`]?.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Explorer View */}
          {activeWorkspaceView === "files" && (
            <div className={styles.filesView}>
              <div className={styles.filesHeader}>
                <h2>
                  <FolderOpen size={20} /> File Explorer
                </h2>
                <div className={styles.filesStats}>
                  <span>{fileSnapshots.length} files analyzed</span>
                  <span>•</span>
                  <span>
                    Average score:{" "}
                    {fileSnapshots.length > 0
                      ? (
                          fileSnapshots.reduce(
                            (acc, file) => acc + calculateOverallScore(file),
                            0
                          ) / fileSnapshots.length
                        ).toFixed(1)
                      : "0.0"}
                  </span>
                </div>
              </div>

              {/* Breadcrumb Navigation */}
              <div className={styles.breadcrumbNav}>
                {getBreadcrumbs().map((crumb, index) => {
                  const isFile =
                    selectedFile && index === getBreadcrumbs().length - 1;
                  const isClickable = !isFile;

                  return (
                    <span key={index} className={styles.breadcrumbItem}>
                      {index > 0 && (
                        <span className={styles.breadcrumbSeparator}>/</span>
                      )}
                      {isClickable ? (
                        <button
                          className={styles.breadcrumbButton}
                          onClick={() => {
                            // Clear selected file when navigating
                            setSelectedFile(null);

                            if (index === 0) {
                              setCurrentPath("");
                            } else {
                              const pathParts = getBreadcrumbs().slice(
                                1,
                                index + 1
                              );
                              // Remove file name if it exists in the path
                              const filteredParts = pathParts.filter(
                                (_, i) =>
                                  !(selectedFile && i === pathParts.length - 1)
                              );
                              setCurrentPath(filteredParts.join("/"));
                            }
                          }}
                        >
                          {crumb}
                        </button>
                      ) : (
                        <span className={styles.breadcrumbCurrent}>
                          {crumb}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* File/Folder List - Hide when file is selected */}
              {!selectedFile && (
                <div className={styles.fileList}>
                  {/* Back button if not in root */}
                  {currentPath && (
                    <div
                      className={`${styles.fileItem} ${styles.folderItem}`}
                      onClick={goBack}
                    >
                      <div className={styles.fileIcon}>
                        <Folder size={16} />
                      </div>
                      <div className={styles.fileName}>..</div>
                      <div className={styles.fileInfo}>Parent Directory</div>
                    </div>
                  )}

                  {/* Current directory contents */}
                  {getCurrentDirectoryContents()
                    .sort((a, b) => {
                      // Folders first, then files
                      if (a.type !== b.type) {
                        return a.type === "folder" ? -1 : 1;
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map((item) => (
                      <div
                        key={item.path}
                        className={`${styles.fileItem} ${
                          item.type === "folder"
                            ? styles.folderItem
                            : styles.fileItemRegular
                        }`}
                        onClick={() => {
                          if (item.type === "folder") {
                            navigateToFolder(item.path);
                          } else {
                            handleFileSelect(item.data);
                          }
                        }}
                      >
                        <div className={styles.fileIcon}>
                          {item.type === "folder" ? (
                            <Folder size={16} />
                          ) : (
                            getFileIcon(item.name)
                          )}
                        </div>
                        <div className={styles.fileName}>{item.name}</div>
                        <div className={styles.filePath}>
                          {item.type === "folder" ? `${item.path}/` : item.path}
                        </div>
                        {item.type === "file" && (
                          <div className={styles.fileScores}>
                            <span className={styles.scoreIndicator}>
                              O: {calculateOverallScore(item.data).toFixed(1)}
                            </span>
                            <span className={styles.scoreIndicator}>
                              H: {item.data.healthScore?.toFixed(1)}
                            </span>
                            <span className={styles.scoreIndicator}>
                              S: {item.data.securityScore?.toFixed(1)}
                            </span>
                            <span className={styles.scoreIndicator}>
                              K: {item.data.knowledgeScore?.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Expanded File Details - Show when file is selected */}
              {selectedFile && (
                <div className={styles.expandedFileDetails}>
                  <div className={styles.expandedHeader}>
                    <div className={styles.fileTitle}>
                      <span className={styles.fileIcon}>
                        {getFileIcon(selectedFile.filePath)}
                      </span>
                      <h3>{selectedFile.filePath.split("/").pop()}</h3>
                    </div>
                    <button
                      className={styles.backToFiles}
                      onClick={() => setSelectedFile(null)}
                    >
                      <ArrowLeft size={16} /> Back to Files
                    </button>
                  </div>

                  <div className={styles.compactScores}>
                    <div className={styles.scoreCard}>
                      <div className={styles.scoreLabel}>Overall</div>
                      <div
                        className={styles.scoreValue}
                        style={{
                          color: getScoreColor(
                            calculateOverallScore(selectedFile)
                          ),
                        }}
                      >
                        {calculateOverallScore(selectedFile).toFixed(1)}
                      </div>
                      <div className={styles.scoreRating}>
                        {getScoreLabel(calculateOverallScore(selectedFile))}
                      </div>
                    </div>

                    <div className={styles.scoreCard}>
                      <div className={styles.scoreLabel}>Health</div>
                      <div
                        className={styles.scoreValue}
                        style={{
                          color: getScoreColor(selectedFile.healthScore),
                        }}
                      >
                        {selectedFile.healthScore?.toFixed(1)}
                      </div>
                      <div className={styles.scoreDescription}>
                        Code quality
                      </div>
                    </div>

                    <div className={styles.scoreCard}>
                      <div className={styles.scoreLabel}>Security</div>
                      <div
                        className={styles.scoreValue}
                        style={{
                          color: getScoreColor(selectedFile.securityScore),
                        }}
                      >
                        {selectedFile.securityScore?.toFixed(1)}
                      </div>
                      <div className={styles.scoreDescription}>
                        Vulnerabilities
                      </div>
                    </div>

                    <div className={styles.scoreCard}>
                      <div className={styles.scoreLabel}>Knowledge</div>
                      <div
                        className={styles.scoreValue}
                        style={{
                          color: getScoreColor(selectedFile.knowledgeScore),
                        }}
                      >
                        {selectedFile.knowledgeScore?.toFixed(1)}
                      </div>
                      <div className={styles.scoreDescription}>
                        Documentation
                      </div>
                    </div>
                  </div>

                  <div className={styles.fileActions}>
                    <button className={styles.actionButton}>
                      <Bug size={16} /> View Issues
                    </button>
                    <button className={styles.actionButton}>
                      <History size={16} /> View History
                    </button>
                    <button className={styles.actionButton}>
                      <Github size={16} /> Open in GitHub
                    </button>
                    <button className={styles.actionButton}>
                      <Eye size={16} /> View Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scans View */}
          {activeWorkspaceView === "scans" && (
            <div className={styles.scansView}>
              <div className={styles.scansHeader}>
                <h2>Scan History</h2>
                <button className={styles.newScanBtn}>
                  <RotateCcw size={16} /> Start New Scan
                </button>
              </div>

              <div className={styles.scansList}>
                {activeScans.map((scan) => (
                  <div key={scan.id} className={styles.scanCard}>
                    <div className={styles.scanHeader}>
                      <div
                        className={styles.scanStatus}
                        data-status={scan.status}
                      >
                        {scan.status.charAt(0).toUpperCase() +
                          scan.status.slice(1)}
                      </div>
                      <div className={styles.scanDate}>
                        {new Date(scan.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className={styles.scanDetails}>
                      {scan.completedAt && (
                        <div className={styles.scanDuration}>
                          Duration:{" "}
                          {Math.round(
                            (new Date(scan.completedAt) -
                              new Date(scan.created_at)) /
                              1000 /
                              60
                          )}{" "}
                          minutes
                        </div>
                      )}

                      {scan.states && (
                        <div className={styles.scanStates}>
                          <div className={styles.stateGroup}>
                            <span className={styles.stateLabel}>
                              Completed:
                            </span>
                            <span className={styles.stateValue}>
                              {scan.states.completed?.length || 0}
                            </span>
                          </div>
                          <div className={styles.stateGroup}>
                            <span className={styles.stateLabel}>
                              In Progress:
                            </span>
                            <span className={styles.stateValue}>
                              {scan.states.inProgress?.length || 0}
                            </span>
                          </div>
                          <div className={styles.stateGroup}>
                            <span className={styles.stateLabel}>Failed:</span>
                            <span className={styles.stateValue}>
                              {scan.states.failed?.length || 0}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeWorkspaceView === "settings" && (
            <div className={styles.settingsView}>
              <div className={styles.settingsHeader}>
                <h2>Repository Settings</h2>
              </div>

              <div className={styles.settingsContent}>
                {/* Repository Sync Settings */}
                <div className={styles.settingGroup}>
                  <div className={styles.settingGroupHeader}>
                    <FolderSync size={18} />
                    <h3>Repository Sync</h3>
                  </div>
                  <div className={styles.settingItem}>
                    <label htmlFor="autoSync">
                      <input
                        type="checkbox"
                        id="autoSync"
                        checked={settings.autoSync}
                        onChange={(e) =>
                          updateSettings("autoSync", e.target.checked)
                        }
                      />
                      Automatically sync with GitHub repository
                    </label>
                    <p className={styles.settingDescription}>
                      When enabled, Code IQ will periodically check for updates
                      and sync with your GitHub repository.
                    </p>
                  </div>
                  <div className={styles.settingItem}>
                    <label>Sync Frequency</label>
                    <select
                      value={settings.syncFrequency}
                      onChange={(e) =>
                        updateSettings("syncFrequency", e.target.value)
                      }
                    >
                      <option value="hourly">Every Hour</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="manual">Manual Only</option>
                    </select>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className={styles.settingGroup}>
                  <div className={styles.settingGroupHeader}>
                    <Bell size={18} />
                    <h3>Notifications</h3>
                  </div>
                  <div className={styles.settingItem}>
                    <label htmlFor="scanNotifications">
                      <input
                        type="checkbox"
                        id="scanNotifications"
                        checked={settings.notifications.scans}
                        onChange={(e) =>
                          updateSettings("notifications", {
                            ...settings.notifications,
                            scans: e.target.checked,
                          })
                        }
                      />
                      Notify when scans complete
                    </label>
                  </div>
                  <div className={styles.settingItem}>
                    <label htmlFor="securityAlerts">
                      <input
                        type="checkbox"
                        id="securityAlerts"
                        checked={settings.notifications.security}
                        onChange={(e) =>
                          updateSettings("notifications", {
                            ...settings.notifications,
                            security: e.target.checked,
                          })
                        }
                      />
                      Security vulnerability alerts
                    </label>
                  </div>
                  <div className={styles.settingItem}>
                    <label htmlFor="scoreChanges">
                      <input
                        type="checkbox"
                        id="scoreChanges"
                        checked={settings.notifications.scoreChanges}
                        onChange={(e) =>
                          updateSettings("notifications", {
                            ...settings.notifications,
                            scoreChanges: e.target.checked,
                          })
                        }
                      />
                      Score threshold changes
                    </label>
                  </div>
                </div>

                {/* Scan Settings */}
                <div className={styles.settingGroup}>
                  <div className={styles.settingGroupHeader}>
                    <Clock size={18} />
                    <h3>Scan Behavior</h3>
                  </div>
                  <div className={styles.settingItem}>
                    <label htmlFor="autoScan">
                      <input
                        type="checkbox"
                        id="autoScan"
                        checked={settings.autoScan}
                        onChange={(e) =>
                          updateSettings("autoScan", e.target.checked)
                        }
                      />
                      Automatically scan on repository changes
                    </label>
                    <p className={styles.settingDescription}>
                      Trigger scans automatically when new commits are detected.
                    </p>
                  </div>
                  <div className={styles.settingItem}>
                    <label>Data Retention</label>
                    <select
                      value={settings.retentionDays}
                      onChange={(e) =>
                        updateSettings(
                          "retentionDays",
                          parseInt(e.target.value)
                        )
                      }
                    >
                      <option value={30}>30 days</option>
                      <option value={90}>90 days</option>
                      <option value={180}>6 months</option>
                      <option value={365}>1 year</option>
                      <option value={0}>Forever</option>
                    </select>
                    <p className={styles.settingDescription}>
                      How long to keep scan history and file snapshots.
                    </p>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className={`${styles.settingGroup} ${styles.dangerZone}`}>
                  <div className={styles.settingGroupHeader}>
                    <Trash2 size={18} />
                    <h3>Danger Zone</h3>
                  </div>
                  <div className={styles.settingItem}>
                    <button
                      className={styles.deleteButton}
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Remove Repository
                    </button>
                    <p className={styles.settingDescription}>
                      Permanently remove this repository from Code IQ. This
                      action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className={styles.modalOverlay}>
                  <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                      <h3>Confirm Repository Deletion</h3>
                    </div>
                    <div className={styles.modalBody}>
                      <p>
                        Are you sure you want to remove{" "}
                        <strong>{repository?.name}</strong> from Code IQ?
                      </p>
                      <p>This will permanently delete:</p>
                      <ul>
                        <li>All scan history</li>
                        <li>File snapshots and analysis data</li>
                        <li>Repository settings and configurations</li>
                      </ul>
                      <p>
                        <strong>This action cannot be undone.</strong>
                      </p>
                    </div>
                    <div className={styles.modalActions}>
                      <button
                        className={styles.cancelButton}
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.confirmDeleteButton}
                        onClick={handleDeleteRepository}
                        disabled={deletingRepo}
                      >
                        {deletingRepo ? "Deleting..." : "Delete Repository"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right AI Chatbot Panel (1/3 width) */}
      <div className={styles.chatPanel}>
        <div className={styles.chatHeader}>
          <h3>
            <Bot size={18} /> Codebase Assistant
          </h3>
          <div className={styles.chatContext}>
            <span className={styles.contextLabel}>Context:</span>
            <span className={styles.contextValue}>
              {activeWorkspaceView === "dashboard"
                ? `${repository?.name} Overview`
                : activeWorkspaceView === "files"
                ? `Files${selectedFile ? ` - ${selectedFile.filePath}` : ""}`
                : "Scan History"}
            </span>
          </div>
        </div>

        <div className={styles.chatMessages}>
          {chatMessages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${styles[message.type]}`}
            >
              <div className={styles.messageContent}>{message.content}</div>
              <div className={styles.messageTime}>
                {message.timestamp.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleChatSubmit} className={styles.chatInput}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about your codebase..."
            className={styles.chatInputField}
          />
          <button type="submit" className={styles.chatSendBtn}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default RepositoryDashboard;
