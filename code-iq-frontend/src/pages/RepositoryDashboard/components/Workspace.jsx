import styles from "./Workspace.module.css";
import { useState } from "react";
import ViewToggle from "./Workspace/ViewToggle";
import DashboardView from "./Workspace/DashboardView";
import FileExplorerView from "./Workspace/FileExplorerView";
import ScansView from "./Workspace/ScansView";
import SettingsView from "./Workspace/SettingsView";

function Workspace({
  repository,
  fileSnapshots,
  activeScans,
  setShowScannerModal,
  selectedFile,
  setSelectedFile
}) {

  // View state
  const [activeWorkspaceView, setActiveWorkspaceView] = useState("dashboard"); // 'dashboard', 'files', 'scans', 'prs', 'settings'

  // File explorer state
  const [currentPath, setCurrentPath] = useState(""); // Current folder path

  return (
    <div className={styles.workspacePanel}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.repoName}>{repository?.name}</h1>
        <div className={styles.repoInfo}>
        </div>

        <ViewToggle
          activeWorkspaceView={activeWorkspaceView}
          setActiveWorkspaceView={setActiveWorkspaceView}
        />
      </div>

      {/* Workspace Content */}
      <div className={styles.workspaceContent}>
        {/* Dashboard View */}
        {activeWorkspaceView === "dashboard" && (
          <DashboardView
            repository={repository}
            fileSnapshots={fileSnapshots}
            setActiveWorkspaceView={setActiveWorkspaceView}
            setCurrentPath={setCurrentPath}
            setSelectedFile={setSelectedFile}
          />
        )}

        {/* File Explorer View */}
        {activeWorkspaceView === "files" && (
          <FileExplorerView
            repository={repository}
            currentPath={currentPath}
            setCurrentPath={setCurrentPath}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            fileSnapshots={fileSnapshots}
            setShowScannerModal={setShowScannerModal}
          />
        )}

        {/* Scans View */}
        {activeWorkspaceView === "scans" && (
          <ScansView repository={repository} activeScans={activeScans} />
        )}

        {/* Settings View */}
        {activeWorkspaceView === "settings" && (
          <SettingsView repository={repository} />
        )}
      </div>
    </div>
  );
}

export default Workspace;
