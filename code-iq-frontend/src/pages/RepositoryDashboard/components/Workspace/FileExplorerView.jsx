import styles from "../Workspace.module.css";
import repositoryDashboardHelpers from "../../utils/repositoryDashboardHelpers";
import { useState, useEffect } from "react";
import {
  FolderOpen,
  Folder,
  FileText,
  ArrowLeft,
  Bug,
  Github,
  History,
} from "lucide-react";

function FileExplorerView({
  repository,
  currentPath,
  setCurrentPath,
  selectedFile,
  setSelectedFile,
  fileSnapshots,
  setShowScannerModal,
}) {
  const { calculateOverallScore, getScoreColor, getScoreLabel, formatScore } =
    repositoryDashboardHelpers;
  const [fileTree, setFileTree] = useState({}); // Full file tree structure

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

  function getBreadcrumbs() {
    const baseCrumbs = !currentPath
      ? [repository.name]
      : [repository.name, ...currentPath.split("/")];

    // Add selected file to breadcrumbs if viewing a file
    if (selectedFile) {
      return [...baseCrumbs, selectedFile.filePath.split("/").pop()];
    }

    return baseCrumbs;
  }

  function goBack() {
    if (currentPath) {
      const parts = currentPath.split("/");
      parts.pop();
      setCurrentPath(parts.join("/"));
    }
  }

  function getCurrentDirectoryContents() {
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
  }

  return (
    <div className={styles.filesView}>
      <div className={styles.filesHeader}>
        <h2>
          <FolderOpen size={20} /> File Explorer
        </h2>
        <div className={styles.filesStats}>
          <span>{fileSnapshots.length} files analyzed</span>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className={styles.breadcrumbNav}>
        {getBreadcrumbs().map((crumb, index) => {
          const isFile = selectedFile && index === getBreadcrumbs().length - 1;
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
                      setCurrentPath(
                        currentPath.split("/").slice(0, index).join("/")
                      );
                    }
                  }}
                >
                  {crumb}
                </button>
              ) : (
                <span className={styles.breadcrumbCurrent}>{crumb}</span>
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
                    setCurrentPath(item.path);
                  } else {
                    setSelectedFile(item.data);
                  }
                }}
              >
                <div className={styles.fileIcon}>
                  {item.type === "folder" ? (
                    <Folder size={16} />
                  ) : (
                    <FileText size={16} />
                  )}
                </div>
                <div className={styles.fileName}>{item.name}</div>
                <div className={styles.filePath}>
                  {item.type === "folder" ? `${item.path}/` : item.path}
                </div>
                {item.type === "file" && (
                  <div className={styles.fileScores}>
                    <span className={styles.scoreIndicator}>
                      O: {formatScore(calculateOverallScore(item.data))}
                    </span>
                    <span className={styles.scoreIndicator}>
                      H: {formatScore(item.data.healthScore)}
                    </span>
                    <span className={styles.scoreIndicator}>
                      S: {formatScore(item.data.securityScore)}
                    </span>
                    <span className={styles.scoreIndicator}>
                      K: {formatScore(item.data.knowledgeScore)}
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
                <FileText size={16} />
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

          <div className={styles.fileDetailsGrid}>
            <div className={styles.scoresGrid}>
              <div className={styles.scoreCard}>
                <div className={styles.scoreLabel}>Overall</div>
                <div
                  className={styles.scoreValue}
                  style={{
                    color: getScoreColor(calculateOverallScore(selectedFile)),
                  }}
                >
                  {formatScore(calculateOverallScore(selectedFile))}
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
                  {formatScore(selectedFile.healthScore)}
                </div>
                <div className={styles.scoreDescription}>Code quality</div>
              </div>

              <div className={styles.scoreCard}>
                <div className={styles.scoreLabel}>Security</div>
                <div
                  className={styles.scoreValue}
                  style={{
                    color: getScoreColor(selectedFile.securityScore),
                  }}
                >
                  {formatScore(selectedFile.securityScore)}
                </div>
                <div className={styles.scoreDescription}>Vulnerabilities</div>
              </div>

              <div className={styles.scoreCard}>
                <div className={styles.scoreLabel}>Knowledge</div>
                <div
                  className={styles.scoreValue}
                  style={{
                    color: getScoreColor(selectedFile.knowledgeScore),
                  }}
                >
                  {formatScore(selectedFile.knowledgeScore)}
                </div>
                <div className={styles.scoreDescription}>Documentation</div>
              </div>
            </div>

            <div className={styles.actionsSection}>
              <h4>File Actions</h4>
              <div className={styles.actionsPanel}>
                <div className={styles.fileActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => setShowScannerModal(true)}
                  >
                    <Bug size={16} /> View Scanner Results
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() =>
                      window.open(
                        `https://github.com/${repository?.name}/blob/main/${selectedFile.filePath}`,
                        "_blank"
                      )
                    }
                  >
                    <Github size={16} /> Open in GitHub
                  </button>
                  <button className={styles.actionButton}>
                    <History size={16} /> Git History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileExplorerView;
