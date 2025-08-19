import { Cpu, Shield, BookOpen, Bug } from "lucide-react";
import styles from "./ScannerResultsModal.module.css";
import { useEffect } from "react";
import { useState } from "react";

function ScannerResultsModal({
  isOpen,
  onClose,
  selectedFile,
  activeTab,
  setActiveTab,
  fetchScannerResults,
}) {
  const [scannerResults, setScannerResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedFile) {
      async function fetchData() {
        setLoading(true);
        try {
          const results = await fetchScannerResults();
          setScannerResults(results);
        } catch (error) {
          console.error("Failed to fetch scanner results:", error);
          setScannerResults(null);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen, fetch when modal opens

  if (!isOpen) return null;

  // Helper function to get tab counts
  const getTabCounts = () => {
    if (!scannerResults) return { health: 0, security: 0, knowledge: 0 };

    const healthCount = scannerResults.health?.scanners
      ? Object.values(scannerResults.health.scanners).reduce(
          (sum, scanner) => sum + (scanner.raw?.length || 0),
          0
        )
      : 0;
    const securityCount = scannerResults.security?.scanners
      ? Object.values(scannerResults.security.scanners).reduce(
          (sum, scanner) => sum + (scanner.raw?.length || 0),
          0
        )
      : 0;
    const knowledgeCount = scannerResults.knowledge?.scanners
      ? Object.values(scannerResults.knowledge.scanners).reduce(
          (sum, scanner) => sum + (scanner.raw?.length || 0),
          0
        )
      : 0;

    return {
      health: healthCount,
      security: securityCount,
      knowledge: knowledgeCount,
    };
  };

  const tabCounts = getTabCounts();

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Scanner Results - {selectedFile?.filePath}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalTabs}>
          <button
            className={`${styles.modalTab} ${
              activeTab === "health" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("health")}
          >
            <Cpu size={16} />
            Code Health
            <span className={styles.tabCount}>{tabCounts.health}</span>
          </button>
          <button
            className={`${styles.modalTab} ${
              activeTab === "security" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("security")}
          >
            <Shield size={16} />
            Security
            <span className={styles.tabCount}>{tabCounts.security}</span>
          </button>
          <button
            className={`${styles.modalTab} ${
              activeTab === "knowledge" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("knowledge")}
          >
            <BookOpen size={16} />
            Knowledge Debt
            <span className={styles.tabCount}>{tabCounts.knowledge}</span>
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading && (
            <div className={styles.loading}>
              <p>Loading scanner results...</p>
            </div>
          )}

          {!loading && !scannerResults && (
            <div className={styles.noData}>
              <p>No scanner results available for this file.</p>
            </div>
          )}

          {!loading && scannerResults && (
            <>
              {/* Health Issues Tab */}
              {activeTab === "health" && (
                <div>
                  {scannerResults.health?.scanners ? (
                    Object.entries(scannerResults.health.scanners).map(
                      ([scannerName, scannerData]) => (
                        <div
                          key={scannerName}
                          className={styles.scannerSection}
                        >
                          <div className={styles.scannerHeader}>
                            <div className={styles.scannerTitle}>
                              <Bug size={16} />
                              <span>{scannerName}</span>
                              <span className={styles.issueCount}>
                                {scannerData.raw?.length || 0} issues
                              </span>
                            </div>
                            <div className={styles.scannerScore}>
                              Score: {scannerData.score}/100
                            </div>
                          </div>
                          <div className={styles.issuesList}>
                            {scannerData.raw?.map((issue, index) => {
                              // Parse linter output format: "line:col: [code]: message"
                              const match = issue.match(
                                /^(\d+):(\d+)?: \[([^\]]+)\]: (.+)$/
                              );
                              if (match) {
                                const [, lineNum, , code, message] = match;
                                const severity = code.startsWith("E")
                                  ? "high"
                                  : code.startsWith("W")
                                  ? "medium"
                                  : "low";
                                return (
                                  <div
                                    key={index}
                                    className={styles.issueItem}
                                    data-severity={severity}
                                  >
                                    <div className={styles.issueHeader}>
                                      <span className={styles.issueType}>
                                        {code}
                                      </span>
                                      <span className={styles.lineNumber}>
                                        Line {lineNum}
                                      </span>
                                      <span className={styles.severity}>
                                        {severity.charAt(0).toUpperCase() +
                                          severity.slice(1)}
                                      </span>
                                    </div>
                                    <div className={styles.issueMessage}>
                                      {message}
                                    </div>
                                  </div>
                                );
                              }
                              // Fallback for other formats
                              return (
                                <div
                                  key={index}
                                  className={styles.issueItem}
                                  data-severity="medium"
                                >
                                  <div className={styles.issueMessage}>
                                    {issue}
                                  </div>
                                </div>
                              );
                            })}
                            {(!scannerData.raw ||
                              scannerData.raw.length === 0) && (
                              <div className={styles.noIssues}>
                                <p>No issues found by {scannerName}!</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className={styles.noData}>
                      <p>No health scanners available.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Security Issues Tab */}
              {activeTab === "security" && (
                <div>
                  {scannerResults.security?.scanners ? (
                    Object.entries(scannerResults.security.scanners).map(
                      ([scannerName, scannerData]) => (
                        <div
                          key={scannerName}
                          className={styles.scannerSection}
                        >
                          <div className={styles.scannerHeader}>
                            <div className={styles.scannerTitle}>
                              <Shield size={16} />
                              <span>{scannerName}</span>
                              <span className={styles.issueCount}>
                                {scannerData.raw?.length || 0} issues
                              </span>
                            </div>
                            <div className={styles.scannerScore}>
                              Score: {scannerData.score}/100
                            </div>
                          </div>
                          <div className={styles.issuesList}>
                            {scannerData.raw?.map((issue, index) => (
                              <div
                                key={index}
                                className={styles.issueItem}
                                data-severity="critical"
                              >
                                <div className={styles.issueHeader}>
                                  <span className={styles.issueType}>
                                    Security Issue
                                  </span>
                                  <span className={styles.severity}>
                                    Critical
                                  </span>
                                </div>
                                <div className={styles.issueMessage}>
                                  {issue}
                                </div>
                              </div>
                            ))}
                            {(!scannerData.raw ||
                              scannerData.raw.length === 0) && (
                              <div className={styles.noIssues}>
                                <p>
                                  No security issues found by {scannerName}!
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className={styles.noData}>
                      <p>No security scanners available.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Knowledge Debt Tab */}
              {activeTab === "knowledge" && (
                <div>
                  {scannerResults.knowledge?.scanners ? (
                    Object.entries(scannerResults.knowledge.scanners).map(
                      ([scannerName, scannerData]) => (
                        <div
                          key={scannerName}
                          className={styles.scannerSection}
                        >
                          <div className={styles.scannerHeader}>
                            <div className={styles.scannerTitle}>
                              <BookOpen size={16} />
                              <span>{scannerName}</span>
                              <span className={styles.issueCount}>
                                {scannerData.raw?.length || 0} items
                              </span>
                            </div>
                            <div className={styles.scannerScore}>
                              Score: {scannerData.score}/100
                            </div>
                          </div>
                          <div className={styles.issuesList}>
                            {scannerData.raw?.map((item, index) => {
                              // Parse TODO format: "line:col: type: message"
                              const match = item.match(
                                /^(\d+):(\d+)?: (\w+): (.+)$/
                              );
                              if (match) {
                                const [, lineNum, , type, message] = match;
                                const severity =
                                  type === "FIXME"
                                    ? "high"
                                    : type === "TODO"
                                    ? "medium"
                                    : "low";
                                return (
                                  <div
                                    key={index}
                                    className={styles.issueItem}
                                    data-severity={severity}
                                  >
                                    <div className={styles.issueHeader}>
                                      <span className={styles.issueType}>
                                        {type}
                                      </span>
                                      <span className={styles.lineNumber}>
                                        Line {lineNum}
                                      </span>
                                      <span className={styles.severity}>
                                        {severity.charAt(0).toUpperCase() +
                                          severity.slice(1)}
                                      </span>
                                    </div>
                                    <div className={styles.issueMessage}>
                                      {message}
                                    </div>
                                  </div>
                                );
                              }
                              // Fallback for other formats
                              return (
                                <div
                                  key={index}
                                  className={styles.issueItem}
                                  data-severity="medium"
                                >
                                  <div className={styles.issueMessage}>
                                    {item}
                                  </div>
                                </div>
                              );
                            })}
                            {(!scannerData.raw ||
                              scannerData.raw.length === 0) && (
                              <div className={styles.noIssues}>
                                <p>No knowledge debt found by {scannerName}!</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className={styles.noData}>
                      <p>No knowledge scanners available.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScannerResultsModal;
