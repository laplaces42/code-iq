import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import styles from "./RepositoryModal.module.css";

function RepositoryModal({
  isOpen,
  onClose,
  repositories = [],
  onSelectRepository,
  loading = false,
  connectingRepo = null,
  loadingInstallation = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(null);

  // Memoized filtered repositories for performance
  const filteredRepositories = useMemo(() => {
    if (!searchTerm.trim()) return repositories;

    const search = searchTerm.toLowerCase();
    return repositories.filter((repo) => {
      const fullName = repo.name.toLowerCase();
      const repoName = repo.name.split("/").pop()?.toLowerCase() || "";
      return fullName.includes(search) || repoName.includes(search);
    });
  }, [repositories, searchTerm]);

  const handleSelectRepository = (repo) => {
    setSelectedRepo(repo);
  };

  const handleConnect = () => {
    if (selectedRepo && onSelectRepository) {
      onSelectRepository(selectedRepo);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setSelectedRepo(null);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;
  return createPortal(
    <div className={styles.repoModalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.repoModal}>
        {/* Header */}
        <div className={styles.repoModalHeader}>
          <h2>Select Repository</h2>
          <button className={styles.closeBtn} onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Search */}
        <div className={styles.repoSearch}>
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchTerm("")}
            >
              Clear
            </button>
          )}
        </div>

        {/* Repository List */}
        <div className={styles.repoListContainer}>
          {loading || loadingInstallation ? (
            <div className={styles.loading}>
              {loadingInstallation
                ? "Installing GitHub App..."
                : "Loading repositories..."}
            </div>
          ) : filteredRepositories.length === 0 ? (
            <div className={styles.empty}>
              {searchTerm
                ? `No repositories found for "${searchTerm}"`
                : "No repositories available"}
            </div>
          ) : (
            <div className={styles.repoList}>
              {filteredRepositories.map((repo, index) => (
                <div
                  key={`${repo.name}-${index}`}
                  className={`${styles.repoItem} ${
                    selectedRepo?.name === repo.name ? styles.selected : ""
                  } ${connectingRepo === repo.id ? styles.connecting : ""}`}
                  onClick={() =>
                    connectingRepo === repo.id
                      ? null
                      : handleSelectRepository(repo)
                  }
                >
                  <div className={styles.repoInfo}>
                    <div className={styles.repoName}>{repo.name}</div>
                    <div className={styles.repoStatus}>
                      <span
                        className={`${styles.statusDot} ${
                          repo.installed ? styles.installed : styles.available
                        }`}
                      ></span>
                      <span className={styles.statusText}>
                        {connectingRepo === repo.id
                          ? "Connecting..."
                          : repo.installed
                          ? "Authorized"
                          : "Unauthorized"}
                      </span>
                    </div>
                  </div>
                  {connectingRepo === repo.id ? (
                    <div className={styles.loadingIndicator}>⏳</div>
                  ) : selectedRepo?.name === repo.name ? (
                    <div className={styles.selectedIndicator}>✓</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.repoModalFooter}>
          <button className={styles.cancelBtn} onClick={handleClose}>
            Cancel
          </button>
          <button
            className={styles.connectBtn}
            onClick={handleConnect}
            disabled={!selectedRepo}
          >
            {selectedRepo?.installed ? "Connect" : "Authorize"}
          </button>
        </div>

        {/* Results count */}
        {!loading && repositories.length > 0 && (
          <div className={styles.resultsCount}>
            {searchTerm
              ? `${filteredRepositories.length} of ${repositories.length} repositories`
              : `${repositories.length} repositories`}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default RepositoryModal;
