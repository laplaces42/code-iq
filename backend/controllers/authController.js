import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import njwt from "njwt";

class AuthError extends Error {
  constructor(message, statusCode = 500, code = "AUTH_ERROR") {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function handleError(error, res) {
  console.error(error);
  if (error instanceof AuthError) {
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

async function setCookies(req, res, user, supabase) {
  try {
    const refreshPlain = crypto.randomBytes(32).toString("base64url");
    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshPlain)
      .digest("hex");

    const { data: sessionData, error: sessionError } = await supabase
      .from("active_sessions")
      .insert({
        userId: user.id,
        refreshHash: refreshHash,
        expiresAt: new Date(
          Date.now() + SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
        ), // 90 days
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      })
      .select()
      .single();

    if (sessionError) {
      throw new AuthError(
        "Failed to create session.",
        500,
        "SESSION_CREATE_ERROR"
      );
    }

    res.cookie("refresh", refreshPlain, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000, // 90 days
    });

    // Create JWT token
    const jwt = njwt.create(
      {
        sid: sessionData.id,
        sub: user.id,
        iss: process.env.JWT_ISSUER,
        aud: process.env.JWT_AUDIENCE,
      },
      process.env.JWT_SIGNING_KEY
    );

    res.cookie("jwt", jwt.compact(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: JWT_EXPIRATION_HOURS * 60 * 60 * 1000, // 1 hour
    });
  } catch (error) {
    // would put logging logic here
    throw error;
  }
}

async function callback(req, res) {
  const { code } = req.body;

  // Get the parameters from the URL
  const params = new URLSearchParams();
  params.append("client_id", process.env.CLIENT_ID);
  params.append("client_secret", process.env.CLIENT_SECRET);
  params.append("code", code);
  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    // Throw an error if the token exchange was unsuccessful
    if (!tokenResponse.ok) {
      throw new AuthError(
        "GitHub token exchange failed.",
        502,
        "GITHUB_UNAVAILABLE"
      );
    }

    // Check if access token request was successful
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new AuthError(
        "Invalid authorization code.",
        400,
        "INVALID_AUTH_CODE"
      );
    }

    // Use the access token to get the user information
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    // Throw an error if the user response was unsuccessful
    if (!userResponse.ok) {
      throw new AuthError(
        "Failed to fetch user data from GitHub",
        502,
        "GITHUB_USER_FETCH_ERROR"
      );
    }

    // Check if user data is valid
    const githubUser = await userResponse.json();

    if (!githubUser || !githubUser.id) {
      throw new AuthError(
        "Invalid user data from GitHub",
        400,
        "INVALID_USER_DATA"
      );
    }

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Check if the user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("githubId", githubUser.id)
      .maybeSingle();

    // Throw an error if fetching the existing user was unsuccessful
    if (fetchError) {
      throw new AuthError("Database query failed", 500, "DB_QUERY_ERROR");
    }

    if (existingUser) {
      // If the user already exists, update the entry
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          accessToken: tokenData.access_token,
          accessTokenExpiration: new Date(
            Date.now() + tokenData.expires_in * 1000
          ).toISOString(),
          refreshToken: tokenData.refresh_token,
          refreshTokenExpiration: new Date(
            Date.now() + tokenData.refresh_token_expires_in * 1000
          ).toISOString(),
          githubId: githubUser.id,
          username: githubUser.login,
          email: githubUser.email,
          avatarUrl: githubUser.avatar_url,
        })
        .eq("id", existingUser.id)
        .select()
        .single();

      // Throw an error if updating the user was unsuccessful
      if (updateError) {
        throw new AuthError("Failed to update user", 500, "USER_UPDATE_ERROR");
      }

      // Set the cookies
      await setCookies(req, res, existingUser, supabase);

      // Return the user data
      return res.status(200).json({
        user: {
          id: existingUser.id,
          githubId: updatedUser.githubId,
          username: updatedUser.username,
          email: updatedUser.email,
          avatarUrl: updatedUser.avatarUrl,
        },
      });
    } else {
      // If there is not an existing user, create a new one
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            githubId: githubUser.id,
            username: githubUser.login,
            email: githubUser.email,
            avatarUrl: githubUser.avatar_url,
            accessToken: tokenData.access_token,
            accessTokenExpiration: new Date(
              Date.now() + tokenData.expires_in * 1000
            ).toISOString(),
            refreshToken: tokenData.refresh_token,
            refreshTokenExpiration: new Date(
              Date.now() + tokenData.refresh_token_expires_in * 1000
            ).toISOString(),
          },
        ])
        .select()
        .single();

      // Throw an error if creating a new user was unsuccessful
      if (insertError) {
        throw new AuthError("Failed to create user", 500, "USER_CREATE_ERROR");
      }

      // Set the cookies
      await setCookies(req, res, newUser, supabase);

      // Return the user data
      return res.status(200).json({
        user: {
          id: newUser.id,
          githubId: newUser.githubId,
          username: newUser.username,
          email: newUser.email,
          avatarUrl: newUser.avatarUrl,
        },
      });
    }
  } catch (error) {
    // Handle errors using the custom error handler
    return handleError(error, res);
  }
}

async function verifyJwt(req, res) {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      throw new AuthError("No authentication token provided", 401, "NO_TOKEN");
    }
    const payload = njwt.verify(token, process.env.JWT_SIGNING_KEY);
    return res.status(200).json({ userId: payload.body.sub });
  } catch (error) {
    // Handle errors using the custom error handler
    return handleError(error, res);
  }
}

async function refreshAccessToken(req, res) {
  try {
    const refreshToken = req.cookies.refresh;
    if (!refreshToken) {
      return handleError(
        new AuthError("No refresh token provided", 401, "NO_REFRESH_TOKEN"),
        res
      );
    }
    const supabase = getSupabaseClient();
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
      throw new AuthError("No active session found", 401, "NO_ACTIVE_SESSION");
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
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: JWT_EXPIRATION_HOURS * 60 * 60 * 1000, // 1 hour
    });

    return res.status(200).json({ userId: newAccessToken.body.sub });
  } catch (error) {
    // Handle errors using the custom error handler
    return handleError(error, res);
  }
}

async function fetchUser(req, res) {
  try {
    const { userId } = req.body;
    const supabase = getSupabaseClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      if (error.code === "PGRST116") {
        throw new AuthError("User not found", 404, "USER_NOT_FOUND");
      }
      throw new AuthError("Failed to fetch user", 500, "USER_FETCH_ERROR");
    }

    return res.status(200).json({
      user: {
        id: user.id,
        githubId: user.githubId,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    // Handle errors using the custom error handler
    return handleError(error, res);
  }
}

async function refreshGitHubToken(userId) {
  try {
    const supabase = getSupabaseClient();

    // Get current refresh token
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("refreshToken, refreshTokenExpiration")
      .eq("id", userId)
      .single();

    if (fetchError || !user.refreshToken) {
      throw new AuthError("No refresh token found", 401, "NO_REFRESH_TOKEN");
    }

    // Check if refresh token is still valid
    if (new Date(user.refreshTokenExpiration) <= new Date()) {
      throw new AuthError(
        "Refresh token expired",
        401,
        "REFRESH_TOKEN_EXPIRED"
      );
    }

    // Exchange refresh token for new access token
    const params = new URLSearchParams();
    params.append("client_id", process.env.CLIENT_ID);
    params.append("client_secret", process.env.CLIENT_SECRET);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", user.refreshToken);

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!tokenResponse.ok) {
      throw new AuthError(
        "GitHub token refresh failed",
        502,
        "GITHUB_REFRESH_FAILED"
      );
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new AuthError(
        "Invalid refresh token response",
        400,
        "INVALID_REFRESH_RESPONSE"
      );
    }

    // Update user with new tokens
    const updateData = {
      accessToken: tokenData.access_token,
      accessTokenExpiration: new Date(
        Date.now() + tokenData.expires_in * 1000
      ).toISOString(),
    };

    // Update refresh token if a new one was provided
    if (tokenData.refresh_token) {
      updateData.refreshToken = tokenData.refresh_token;
      updateData.refreshTokenExpiration = new Date(
        Date.now() + tokenData.refresh_token_expires_in * 1000
      ).toISOString();
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (updateError) {
      throw new AuthError("Failed to update tokens", 500, "TOKEN_UPDATE_ERROR");
    }

    return tokenData.access_token;
  } catch (error) {
    // would put logging logic here
    throw error;
  }
}

async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refresh;
    if (!refreshToken) {
      return res.status(200);
    }
    const supabase = getSupabaseClient();
    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const { error: deleteError } = await supabase
      .from("active_sessions")
      .delete()
      .eq("refreshHash", refreshHash);

    if (deleteError) {
      // would put logging logic here
      console.error("Error deleting session:", deleteError);
    }
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: JWT_EXPIRATION_HOURS * 60 * 60 * 1000, // 1 hour
    });

    res.clearCookie("refresh", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000, // 90 days
    });
    return res.status(200).json({});
  } catch (error) {
    // Handle errors using the custom error handler
    return handleError(error, res);
  }
}

export default {
  callback,
  verifyJwt,
  refreshAccessToken,
  refreshGitHubToken,
  fetchUser,
  logout,
};
