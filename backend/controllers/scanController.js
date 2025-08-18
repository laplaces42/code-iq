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
  try {

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
  const { scan_id } = req.body;
  try {
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
