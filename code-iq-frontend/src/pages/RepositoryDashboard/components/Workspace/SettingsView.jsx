import styles from "../Workspace.module.css";
import { FolderSync, Bell, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function SettingsView({ repository }) {
  const navigate = useNavigate();
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

  function updateSettings(key, value) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    // TODO: Save to backend
    toast.success(`Settings updated successfully!`);
  }
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRepo, setDeletingRepo] = useState(false);

  async function handleDeleteRepository() {
    setDeletingRepo(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/repos/${repository.id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        toast.success("Repository removed successfully! Redirecting...");

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        throw new Error("Failed to delete repository");
      }
    } catch (error) {
      toast.error("Failed to remove repository. Please try again.");
    } finally {
      setDeletingRepo(false);
    }
    setShowDeleteConfirm(false);
  }

  return (
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
                onChange={(e) => updateSettings("autoSync", e.target.checked)}
              />
              Automatically sync with GitHub repository
            </label>
            <p className={styles.settingDescription}>
              When enabled, Code IQ will periodically check for updates and sync
              with your GitHub repository.
            </p>
          </div>
          <div className={styles.settingItem}>
            <label>Sync Frequency</label>
            <select
              value={settings.syncFrequency}
              onChange={(e) => updateSettings("syncFrequency", e.target.value)}
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
                onChange={(e) => updateSettings("autoScan", e.target.checked)}
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
                updateSettings("retentionDays", parseInt(e.target.value))
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
              Permanently remove this repository from Code IQ. This action
              cannot be undone.
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
  );
}

export default SettingsView;
