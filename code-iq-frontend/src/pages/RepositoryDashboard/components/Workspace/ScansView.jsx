import styles from "../Workspace.module.css";
import { RotateCcw } from "lucide-react";

function ScansView({ repository, activeScans }) {
  return (
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
              <div className={styles.scanStatus} data-status={scan.status}>
                {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
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
                    (new Date(scan.completedAt) - new Date(scan.created_at)) /
                      1000 /
                      60
                  )}{" "}
                  minutes
                </div>
              )}

              {scan.states && (
                <div className={styles.scanStates}>
                  <div className={styles.stateGroup}>
                    <span className={styles.stateLabel}>Completed:</span>
                    <span className={styles.stateValue}>
                      {scan.states.completed?.length || 0}
                    </span>
                  </div>
                  <div className={styles.stateGroup}>
                    <span className={styles.stateLabel}>In Progress:</span>
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
  );
}

export default ScansView;
