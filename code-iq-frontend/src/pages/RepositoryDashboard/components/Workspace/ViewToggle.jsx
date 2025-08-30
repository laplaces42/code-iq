import styles from "../Workspace.module.css";
import { BarChart3, FolderOpen, Search, Settings } from "lucide-react";

function ViewToggle({ activeWorkspaceView, setActiveWorkspaceView }) {
  return (
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
  );
}

export default ViewToggle;
