import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { createClient } from "@supabase/supabase-js";

class ScanError extends Error {
  constructor(message, statusCode = 500, code = "SCAN_ERROR") {
    super(message);
    this.name = "ScanError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function handleError(error, res) {
  if (error instanceof ScanError) {
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

async function startScan(req, res) {
  const workspaceDir = path.join(process.env.WORKSPACE_DIR, "temp");
  try {
    const { snapshotId } = req.body;
    const supabase = getSupabaseClient();
    // Use the virtualenv Python interpreter directly
    const { data: scanData, error: scanError } = await supabase
      .from("active_scans")
      .insert({
        status: "initializing",
        repoSnapshotId: snapshotId,
      })
      .select();

    if (scanError) {
      throw new ScanError(
        "Failed to insert scan record",
        500,
        "SCAN_RECORD_ERROR"
      );
    }
    const scanProcess = spawn(
      `source ${process.env.VENV_FILE} && python3 ${process.env.SCANNER_FILE} --scan_id=${scanData[0].id}`,
      [],
      {
        shell: true,
        detached: true, // This detaches the process from the parent
        stdio: "ignore", // Ignore stdio to fully detach
      }
    );

    scanProcess.on("error", async (error) => {
      await supabase
        .from("active_scans")
        .update({ status: "failed", error: error.message })
        .eq("id", scanData[0].id);
    });

    // Unreference the process so the parent can exit without waiting
    scanProcess.unref();

    return res.status(202).json({ status: "scan started successfully" });
  } catch (error) {
    try {
      await fs.rm(workspaceDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore error if directory doesn't exist
      if (err.code !== "ENOENT") throw err;
    }
    console.error("Error starting scan process:", error);
    return handleError(error, res);
  }
}

async function individualScannerStart(req, res) {
  try {
    // Individual scanner notification received
    return res
      .status(200)
      .json({ status: "Individual scanner notification received" });
  } catch (error) {
    console.error("Error starting individual scanner:", error);
    return handleError(error, res);
  }
}

async function individualScannerFinish(req, res) {
  try {
    // Individual scanner finished
    return res
      .status(200)
      .json({ status: "Individual scanner notification received" });
  } catch (error) {
    console.error("Error finishing individual scanner:", error);
    return handleError(error, res);
  }
}

async function individualScannerFailed(req, res) {
  try {
    // Individual scanner failed
    return res
      .status(200)
      .json({ status: "Individual scanner failed notification received" });
  } catch (error) {
    console.error("Error finishing individual scanner:", error);
    return handleError(error, res);
  }
}

async function scanComplete(req, res) {
  try {
    // Scan completed - cleanup temp directory
    const workspaceDir = path.join(process.env.WORKSPACE_DIR, "temp");
    try {
      await fs.rm(workspaceDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore error if directory doesn't exist
      if (err.code !== "ENOENT") throw err;
    }

    return res
      .status(200)
      .json({ status: "Scan completed notification received" });
  } catch (error) {
    console.error("Error completing scan:", error);
    return handleError(error, res);
  }
}

export default {
  startScan,
  individualScannerStart,
  individualScannerFinish,
  individualScannerFailed,
  scanComplete,
};
