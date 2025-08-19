import njwt from "njwt";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import { exec, spawn } from "child_process";
import authController from "./authController.js";
import tmp from "tmp";

class RepoError extends Error {
  constructor(message, statusCode = 500, code = "REPO_ERROR") {
    super(message);
    this.name = "RepoError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function handleError(error, res) {
  console.error(error);
  if (error instanceof RepoError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  // Generic server error
  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}

let supabase;
function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(process.env.DB_URL, process.env.DB_KEY);
  }

  return supabase;
}

const SESSION_EXPIRATION_DAYS = 90;
const JWT_EXPIRATION_HOURS = 1;

async function getAuthorization(req, res) {
  const supabase = getSupabaseClient();
  let jwt = req.cookies.jwt;
  if (!jwt) {
    const refreshToken = req.cookies.refresh;
    if (!refreshToken) {
      throw new RepoError("No refresh token provided", 401, "NO_REFRESH_TOKEN");
    }

    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const { data: sessionData, error: sessionError } = await supabase
      .from("active_sessions")
      .select("*")
      .eq("refreshHash", refreshHash)
      .gt("expiresAt", new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      throw new RepoError("No active session found", 401, "NO_ACTIVE_SESSION");
    }

    const newAccessToken = njwt.create(
      {
        sid: sessionData.id,
        sub: sessionData.userId,
        iss: process.env.JWT_ISSUER,
        aud: process.env.JWT_AUDIENCE,
      },
      process.env.JWT_SIGNING_KEY
    );

    res.cookie("jwt", newAccessToken.compact(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: JWT_EXPIRATION_HOURS * 60 * 60 * 1000, // 1 hour
    });
    jwt = newAccessToken.compact();
  }

  const payload = njwt.verify(jwt, process.env.JWT_SIGNING_KEY);
  if (!payload || !payload.body.sub) {
    throw new RepoError("Invalid JWT", 401, "INVALID_JWT");
  }

  const userId = payload.body.sub;
  const { data: user, error: authError } = await supabase
    .from("users")
    .select("accessToken, accessTokenExpiration")
    .eq("id", userId)
    .single();

  if (authError) {
    throw new RepoError(
      "Failed to fetch access token",
      500,
      "ACCESS_TOKEN_ERROR"
    );
  }

  // Check if the user has a valid access token
  if (!user.accessToken) {
    throw new RepoError("No access token found", 401, "NO_ACCESS_TOKEN");
  }

  // Check if access token is expired
  if (new Date(user.accessTokenExpiration) <= new Date()) {
    try {
      // Try to refresh the GitHub token
      const newAccessToken = await authController.refreshGitHubToken(userId);
      return newAccessToken;
    } catch (refreshError) {
      throw new RepoError(
        "Access token expired and refresh failed",
        401,
        "TOKEN_EXPIRED_REFRESH_FAILED"
      );
    }
  }

  return user.accessToken;
}

async function checkInstallation(req, res) {
  try {
    const accessToken = await getAuthorization(req, res);
    const installationCheck = await fetch(
      "https://api.github.com/user/installations",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!installationCheck.ok) {
      throw new RepoError(
        "Failed to check installation",
        500,
        "INSTALLATION_CHECK_ERROR"
      );
    }

    const installationData = await installationCheck.json();
    if (!installationData || installationData.length === 0) {
      throw new RepoError("No installations found", 404, "NO_INSTALLATIONS");
    }
    const appInstallation = installationData.installations.find(
      (install) => install.client_id === process.env.CLIENT_ID
    );
    if (appInstallation) {
      return res.status(200).json({ installationId: appInstallation.id });
    }
    throw new RepoError(
      "Installation not found",
      404,
      "INSTALLATION_NOT_FOUND"
    );
  } catch (error) {
    return handleError(error, res);
  }
}

async function fetchRepos(req, res) {
  try {
    const { userId } = req.body;
    const accessToken = await getAuthorization(req, res);
    const supabase = getSupabaseClient();
    let repos = [];
    const { data: repoData, error: repoError } = await supabase
      .from("repo_snapshots")
      .select("*")
      .eq("userId", userId);

    if (repoError) {
      throw new RepoError(
        "Failed to fetch repositories from Supabase",
        500,
        "REPO_FETCH_ERROR"
      );
    }

    for (const repo of repoData) {
      const repoInfo = await fetch(
        `https://api.github.com/repositories/${repo.githubId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (repoInfo.ok) {
        const repoDetails = await repoInfo.json();
        repos.push({
          id: repo.id,
          name: repoDetails.full_name,
          description: repoDetails.description || "",
          language: repoDetails.language,
          scores: {
            overall:
              (repo.healthScore + repo.securityScore + repo.knowledgeScore) /
                3 || 0.0,
            health: repo.healthScore || 0.0,
            security: repo.securityScore || 0.0,
            knowledge: repo.knowledgeScore || 0.0,
            trend: repo.trend || 0.0,
          },
          activityStatus: "active",
        });
      }
    }

    return res.status(200).json({ repos });
  } catch (error) {
    return handleError(error, res);
  }
}

async function fetchNewRepos(req, res) {
  try {
    const { installationId } = req.body;
    const accessToken = await getAuthorization(req, res);
    const userResponse = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      throw new RepoError(
        "Failed to fetch user repositories",
        500,
        "USER_REPO_FETCH_ERROR"
      );
    }

    const userRepos = await userResponse.json();
    const userRepoNames = userRepos.map((repo) => repo.full_name);

    const appResponse = await fetch(
      `https://api.github.com/user/installations/${installationId}/repositories`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (!appResponse.ok) {
      throw new RepoError(
        "Failed to fetch installation repositories",
        500,
        "INSTALLATION_REPO_FETCH_ERROR"
      );
    }
    const appRepos = await appResponse.json();
    const appRepoNames = appRepos.repositories.map((repo) => repo.full_name);

    const reposWithInstallStatus = userRepoNames.map((repoName) => ({
      id: appRepos.repositories.find((repo) => repo.full_name === repoName)?.id,
      name: repoName,
      installed: appRepoNames.includes(repoName),
    }));

    return res.status(200).json({ repos: reposWithInstallStatus });
  } catch (error) {
    return handleError(error, res);
  }
}

async function cloneRepo(req, res) {
  const { repoName, repoId, userId } = req.body;
  let tempDir = null;

  try {
    const supabase = getSupabaseClient();
    const accessToken = await getAuthorization(req, res);

    // Insert repo snapshot first
    const { data: repoData, error: repoError } = await supabase
      .from("repo_snapshots")
      .insert({ githubId: repoId, userId: userId })
      .select()
      .single();

    if (repoError) {
      throw new RepoError(
        "Failed to insert repo snapshot",
        500,
        "REPO_SNAPSHOT_INSERT_ERROR"
      );
    }

    const { data: scanData, error: scanError } = await supabase
      .from("active_scans")
      .insert({
        status: "initializing",
        repoSnapshotId: repoData.id,
      })
      .select()
      .single();

    if (scanError) {
      throw new RepoError(
        "Failed to insert scan record",
        500,
        "SCAN_RECORD_ERROR"
      );
    }

    tempDir = tmp.dirSync({
      prefix: `scan_${scanData.id}_`,
      unsafeCleanup: true,
    });

    // Build authenticated clone URL for private repos
    const repoUrl = `https://${accessToken}@github.com/${repoName}.git`;

    // Use Promise wrapper for exec
    await new Promise((resolve, reject) => {
      exec(`git clone ${repoUrl} ${tempDir.name}`, (error, stdout, stderr) => {
        if (error) {
          reject(
            new RepoError(`Failed to clone repository: ${error.message}`, 500, "REPO_CLONE_ERROR")
          );
        } else {
          resolve(stdout);
        }
      });
    });

    // Use relative paths from the backend directory
    const backendDir = process.cwd();
    const scannersDir = path.join(backendDir, "scanners");
    const venvPath = path.join(scannersDir, ".venv", "bin", "activate");
    const orchestratorPath = path.join(scannersDir, "orchestrator.py");

    // Check if virtual environment exists, if not use system python
    let pythonCommand;
    try {
      await fs.access(venvPath);
      pythonCommand = `source ${venvPath} && python3 ${orchestratorPath}`;
    } catch {
      // Fallback to system python if venv doesn't exist
      pythonCommand = `python3 ${orchestratorPath}`;
    }

    console.log("pythonCommand: ", pythonCommand);

    const scanProcess = spawn(
      `${pythonCommand} --scan_id=${scanData.id} --scan_path=${tempDir.name}`,
      [],
      {
        shell: true,
        detached: true, // This detaches the process from the parent
        stdio: ["ignore", "pipe", "pipe"], // Capture stdout and stderr for logging
      }
    );

    scanProcess.stdout?.on("data", (data) => {
      console.log(`Scanner stdout: ${data}`);
    });

    // Handle stderr output from the scanner
    scanProcess.stderr?.on("data", (data) => {
      console.error(`Scanner stderr: ${data}`);
    });

    scanProcess.on("error", async (error) => {
      console.error("Scan process error:", error);
      await supabase
        .from("active_scans")
        .update({ status: "failed", error: error.message })
        .eq("id", scanData.id);

      // Clean up temp directory on scanner error
      if (tempDir) {
        tempDir.removeCallback();
      }
    });

    // Set up cleanup when scanner completes (you may want to handle this in your Python scanner)
    scanProcess.on("exit", (code) => {
      // Clean up temp directory after scanner completes
      if (tempDir) {
        tempDir.removeCallback();
      }
    });

    // Unreference the process so the parent can exit without waiting
    scanProcess.unref();

    return res.status(200).json({ snapshotId: repoData.id });
  } catch (error) {
    // Clean up temp directory on any error during setup
    if (tempDir) {
      tempDir.removeCallback();
    }
    return handleError(error, res);
  }
}

async function fetchRepoInfo(req, res) {
  const { repoId } = req.params;

  try {
    const supabase = getSupabaseClient();
    let returnedRepo = {};
    const { data: repoData, error: repoError } = await supabase
      .from("repo_snapshots")
      .select("*")
      .eq("id", repoId)
      .single();

    if (repoError) {
      throw new RepoError(
        "Failed to fetch repo info",
        500,
        "REPO_INFO_FETCH_ERROR"
      );
    }

    const accessToken = await getAuthorization(req, res);
    const repoInfo = await fetch(
      `https://api.github.com/repositories/${repoData.githubId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (repoInfo.ok) {
      const repoDetails = await repoInfo.json();
      returnedRepo = {
        id: repoData.id,
        name: repoDetails.full_name,
        description: repoDetails.description || "",
        language: repoDetails.language,
        healthScore: repoData.healthScore,
        securityScore: repoData.securityScore,
        knowledgeScore: repoData.knowledgeScore,
        trend: repoData.trend,
      };
    } else {
      throw new RepoError(
        "Failed to fetch repository details",
        500,
        "REPO_DETAILS_FETCH_ERROR"
      );
    }

    const { data: fileData, error: fileError } = await supabase
      .from("file_snapshots")
      .select("*")
      .eq("repoSnapshotId", repoId);

    if (fileError) {
      throw new RepoError(
        "Failed to fetch file data",
        500,
        "FILE_DATA_FETCH_ERROR"
      );
    }

    const { data: scanData, error: scanError } = await supabase
      .from("active_scans")
      .select("*")
      .eq("repoSnapshotId", repoId);

    if (scanError) {
      throw new RepoError(
        "Failed to fetch scan data",
        500,
        "SCAN_DATA_FETCH_ERROR"
      );
    }

    return res
      .status(200)
      .json({ repo: returnedRepo, files: fileData, scans: scanData });
  } catch (error) {
    return handleError(error, res);
  }
}

export default {
  checkInstallation,
  fetchNewRepos,
  cloneRepo,
  fetchRepos,
  fetchRepoInfo,
};
