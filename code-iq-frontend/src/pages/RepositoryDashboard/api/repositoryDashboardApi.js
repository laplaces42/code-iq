async function fetchRepoInfo(repoId) {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/repos/fetch-repo-info/${repoId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response;
}

async function fetchScannerResults(repoId, filePath) {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/repos/fetch-scanner-results`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repoId,
        filePath,
      }),
    }
  );
  return response;
}

const repositoryDashboardApi = {
  fetchRepoInfo,
  fetchScannerResults,
};

export default repositoryDashboardApi;
