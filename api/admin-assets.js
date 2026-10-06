const ADMIN_EMAIL = "sanjaymrnth@gmail.com";
const MAX_RESUME_SIZE = 4 * 1024 * 1024;
const MAX_PROFILE_IMAGE_SIZE = 4 * 1024 * 1024;
const SOCIAL_LINKS_MAX_SIZE = 4096;

const ASSETS = {
  resume: {
    pathname: "public/data/Resume.pdf",
    contentType: "application/pdf",
    maxSize: MAX_RESUME_SIZE,
    publicUrl: "/data/Resume.pdf",
  },
  profileImage: {
    pathname: "public/images/sanjay.png",
    contentType: "image/png",
    maxSize: MAX_PROFILE_IMAGE_SIZE,
    publicUrl: "/images/sanjay.png",
  },
  socialLinks: {
    pathname: "public/data/social-links.json",
    contentType: "application/json",
    maxSize: SOCIAL_LINKS_MAX_SIZE,
    publicUrl: "/data/social-links.json",
  },
};

export const config = {
  api: {
    bodyParser: false,
  },
};

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function readRequestBody(request, maxSize) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > maxSize) {
      throw createError(`File exceeds the ${Math.floor(maxSize / (1024 * 1024))} MB size limit.`, 413);
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

async function verifyAdmin(idToken) {
  const apiKey = process.env.REACT_APP_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    throw createError("Firebase API key is not configured on the server.", 500);
  }
  if (!idToken) throw createError("Sign in to update portfolio assets.", 401);

  let response;
  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
  } catch (error) {
    throw createError(`Could not verify Firebase sign-in: ${error.message}`, 502);
  }

  if (!response.ok) {
    throw createError("Firebase sign-in expired or could not be verified. Please sign in again.", 401);
  }

  const result = await response.json();
  const account = result.users?.[0];
  if (
    account?.email?.toLowerCase() !== ADMIN_EMAIL
    || account.emailVerified !== true
  ) {
    throw createError(`Only the verified ${ADMIN_EMAIL} account can update portfolio files.`, 403);
  }
}

function validateImageOrPdf(asset, content) {
  if (asset === ASSETS.resume && content.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw createError("The selected resume does not contain a valid PDF signature.", 400);
  }
  if (
    asset === ASSETS.profileImage
    && !content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    throw createError("The selected profile image is not a valid PNG file.", 400);
  }
}

function validateSocialLinks(content) {
  let links;
  try {
    links = JSON.parse(content.toString("utf8"));
  } catch {
    throw createError("Social links must be valid JSON.", 400);
  }
  for (const platform of ["instagram", "twitter", "linkedin"]) {
    let parsedUrl;
    try {
      parsedUrl = new URL(links[platform]);
    } catch {
      throw createError(`Enter a valid URL for ${platform}.`, 400);
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw createError(`${platform} URL must start with https:// or http://.`, 400);
    }
    links[platform] = parsedUrl.href;
  }
  return Buffer.from(JSON.stringify(links, null, 2));
}

async function githubRequest(pathname, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY || "Sanjay-Amarnath/portfolio";
  if (!token) {
    throw createError("GitHub upload is not configured. Set GITHUB_TOKEN in the Vercel project.", 500);
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw createError("GITHUB_REPOSITORY must use the owner/repository format.", 500);
  }
  const branch = process.env.GITHUB_BRANCH || "main";
  const url = new URL(
    `https://api.github.com/repos/${repository}/contents/${pathname}`,
  );
  if (options.method !== "PUT") url.searchParams.set("ref", branch);

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "portfolio-admin",
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 404) {
    console.error("GitHub repository update failed:", response.status, result.message);
    throw createError(
      `GitHub could not update the portfolio file (HTTP ${response.status}). Check the repository token permissions and branch configuration.`,
      502,
    );
  }
  return { response, result, branch };
}

async function updateRepositoryFile(asset, content) {
  const { pathname } = asset;
  const current = await githubRequest(pathname);
  const requestBody = {
    message: `Update ${pathname.replace("public/", "")} from portfolio admin`,
    content: content.toString("base64"),
    branch: current.branch,
  };
  if (current.response.ok && current.result.sha) {
    requestBody.sha = current.result.sha;
  }

  const { result } = await githubRequest(pathname, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  return result;
}

export default async function handler(request, response) {
  if (request.method !== "PUT") {
    response.setHeader("Allow", "PUT");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    await verifyAdmin((request.headers.authorization || "").replace(/^Bearer\s+/i, ""));
    const requestUrl = new URL(request.url, "http://localhost");
    const assetName = requestUrl.searchParams.get("asset");
    const asset = ASSETS[assetName];
    if (!asset) throw createError("Choose a supported portfolio asset.", 400);

    const contentType = (request.headers["content-type"] || "").split(";")[0];
    if (contentType !== asset.contentType) {
      throw createError(`This asset must be uploaded as ${asset.contentType}.`, 415);
    }

    let content = await readRequestBody(request, asset.maxSize);
    if (asset === ASSETS.socialLinks) content = validateSocialLinks(content);
    else validateImageOrPdf(asset, content);
    if (!content.length) throw createError("The selected file is empty.", 400);

    const result = await updateRepositoryFile(asset, content);
    return response.status(200).json({
      url: asset.publicUrl,
      commit: result.commit?.sha,
      message: "Saved to the repository. Vercel will publish the update after its deployment completes.",
    });
  } catch (error) {
    if ((error.statusCode || 500) >= 500) {
      console.error("Portfolio repository upload failed:", error);
    }
    return response.status(error.statusCode || 500).json({
      error: error.message || "Could not save the portfolio file.",
    });
  }
}
