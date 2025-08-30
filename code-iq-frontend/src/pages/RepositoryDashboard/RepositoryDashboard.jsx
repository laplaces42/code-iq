import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./RepositoryDashboard.module.css";
import ScannerResultsModal from "../../components/ScannerResultsModal";
import Chatbot from "./components/Chatbot";
import Workspace from "./components/Workspace";
import repositoryDashboardApi from "./api/repositoryDashboardApi";

function RepositoryDashboard() {
  const { repoId } = useParams();

  // Main state
  const [repository, setRepository] = useState(null);
  const [fileSnapshots, setFileSnapshots] = useState([]);
  const [activeScans, setActiveScans] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [selectedFile, setSelectedFile] = useState(null);

  // Scanner Results Modal state
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("health"); // 'health', 'security', 'todos'

  useEffect(() => {
    async function fetchRepoInfo() {
      setLoading(true);
      try {
        const response = await repositoryDashboardApi.fetchRepoInfo(repoId);
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

  async function fetchScannerResults() {
    try {
      if (!repository?.id || !selectedFile.filePath) {
        return {};
      }
      const response = await repositoryDashboardApi.fetchScannerResults(
        repository.id,
        selectedFile.filePath
      );

      if (!response.ok) {
        throw new Error("Failed to fetch scanner results");
      }

      const data = await response.json();
      return data.scanResults;
    } catch (error) {
      toast.error("Failed to fetch scanner results");
      setShowScannerModal(false);
      return {};
    }
  }

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
      <Workspace
        repository={repository}
        fileSnapshots={fileSnapshots}
        activeScans={activeScans}
        setShowScannerModal={setShowScannerModal}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
      />

      {/* Right AI Chatbot Panel (1/3 width) */}
      <Chatbot />

      {/* Scanner Results Modal */}
      <ScannerResultsModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        selectedFile={selectedFile}
        activeTab={activeModalTab}
        setActiveTab={setActiveModalTab}
        fetchScannerResults={fetchScannerResults}
      />
    </div>
  );
}

export default RepositoryDashboard;
