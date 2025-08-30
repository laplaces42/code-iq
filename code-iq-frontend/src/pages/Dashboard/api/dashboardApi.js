async function checkInstallation() {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/repos/check-installation`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response;
}

async function fetchNewRepos(installationId, user) {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/repos/fetch-new-repos`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ installationId, userId: user.id }),
    }
  );

  return response;
}

async function cloneRepo(repository, user) {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/repos/clone`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repoName: repository.name,
        repoId: repository.id,
        userId: user?.id,
      }),
    }
  );

  return response;
}

async function fetchRepos(user) {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/repos/fetch-repos`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: user.id }),
    }
  );

  return response;
}

const dashboardApi = {
  checkInstallation,
  fetchNewRepos,
  cloneRepo,
  fetchRepos,
};

export default dashboardApi;
