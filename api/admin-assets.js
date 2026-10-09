import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ADMIN_EMAIL = "sanjaymrnth@gmail.com";
const MAX_RESUME_SIZE = 4 * 1024 * 1024;
const MAX_PROFILE_IMAGE_SIZE = 4 * 1024 * 1024;
const SOCIAL_LINKS_MAX_SIZE = 4096;
const PROJECTS_MAX_SIZE = 128 * 1024;

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
  projects: {
    pathname: "public/data/projects.json",
    contentType: "application/json",
    maxSize: PROJECTS_MAX_SIZE,
    publicUrl: "/data/projects.json",
  },
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "6mb",
    },
  },
};

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function readJsonBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return Buffer.from(JSON.stringify(request.body));
  }
  if (typeof request.body === "string") return Buffer.from(request.body);
  return Buffer.alloc(0);
}

function decodeBase64Upload(request, maxSize) {
  const encoded = request.body?.fileBase64;
  if (typeof encoded !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
    throw createError("The uploaded file payload is missing or invalid.", 400);
  }
  if (Math.ceil(encoded.length * 3 / 4) > maxSize) {
    throw createError(`File exceeds the ${Math.floor(maxSize / (1024 * 1024))} MB size limit.`, 413);
  }
  const content = Buffer.from(encoded, "base64");
  if (content.toString("base64") !== encoded) {
    throw createError("The uploaded file payload is not valid base64.", 400);
  }
  return content;
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

function isLocalUploadTest(request) {
  if (process.env.NODE_ENV !== "development") return false;
  const hostname = (request.headers.host || "").replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return (
    ["localhost", "127.0.0.1", "::1"].includes(hostname)
    && (request.headers.authorization || "") === "Bearer local-admin-upload-test"
  );
}

export function validateProfileImage(content) {
  if (!content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw createError("The selected profile image is not a valid PNG file.", 400);
  }
}

function validateImageOrPdf(asset, content) {
  if (asset === ASSETS.resume && content.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw createError("The selected resume does not contain a valid PDF signature.", 400);
  }
  if (asset === ASSETS.profileImage) validateProfileImage(content);
}

function validateSocialLinks(content) {
  let links;
  try {
    links = JSON.parse(content.toString("utf8"));
  } catch {
    throw createError("Social links must be valid JSON.", 400);
  }
  if (!links || typeof links !== "object" || Array.isArray(links)) {
    throw createError("Social links must be a JSON object.", 400);
  }
  for (const platform of ["instagram", "twitter", "linkedin"]) {
    let parsedUrl;
    try {
      if (typeof links[platform] !== "string") throw new Error("Missing URL.");
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

export function validateProjects(content) {
  let projects;
  try {
    projects = JSON.parse(content.toString("utf8"));
  } catch {
    throw createError("Projects must be valid JSON.", 400);
  }
  if (!Array.isArray(projects) || projects.length < 1 || projects.length > 100) {
    throw createError("Projects must be a list containing 1 to 100 entries.", 400);
  }

  const slugs = new Set();
  const requiredText = [
    "name", "type", "category", "context", "symbol", "color",
    "summary", "contribution", "learning",
  ];
  projects.forEach((project, index) => {
    if (!project || typeof project !== "object" || Array.isArray(project)) {
      throw createError(`Project ${index + 1} must be an object.`, 400);
    }
    for (const field of requiredText) {
      if (typeof project[field] !== "string" || !project[field].trim()) {
        throw createError(`Project ${index + 1} needs a valid ${field}.`, 400);
      }
    }
    if (!["product", "saas", "commerce"].includes(project.category)) {
      throw createError(`Project ${index + 1} has an unsupported category.`, 400);
    }
    if (!["teal", "blue", "coral", "green", "sand"].includes(project.color)) {
      throw createError(`Project ${index + 1} has an unsupported artwork color.`, 400);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug || "")) {
      throw createError(`Project ${index + 1} needs a URL-safe slug.`, 400);
    }
    if (slugs.has(project.slug)) {
      throw createError(`The project slug "${project.slug}" is duplicated.`, 400);
    }
    slugs.add(project.slug);
    for (const field of ["focus", "stack"]) {
      if (
        !Array.isArray(project[field])
        || !project[field].length
        || project[field].some((item) => typeof item !== "string" || !item.trim())
      ) {
        throw createError(`Project ${project.slug} needs a non-empty ${field} list.`, 400);
      }
    }
    if (project.href !== undefined) {
      const isLocalPath = typeof project.href === "string"
        && project.href.startsWith("/")
        && !project.href.startsWith("//")
        && !/[\r\n]/.test(project.href);
      let isWebUrl = false;
      try {
        const parsedUrl = new URL(project.href);
        isWebUrl = parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
      } catch {
        isWebUrl = false;
      }
      if (!isLocalPath && !isWebUrl) {
        throw createError(`Project ${project.slug} has an invalid link.`, 400);
      }
    }
  });
  return Buffer.from(JSON.stringify(projects, null, 2));
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
    const localTestMode = isLocalUploadTest(request);
    if (!localTestMode) {
      await verifyAdmin((request.headers.authorization || "").replace(/^Bearer\s+/i, ""));
    }
    const requestUrl = new URL(request.url, "http://localhost");
    const assetName = requestUrl.searchParams.get("asset");
    const asset = ASSETS[assetName];
    if (!asset) throw createError("Choose a supported portfolio asset.", 400);

    const contentType = (request.headers["content-type"] || "").split(";")[0];
    const isFileAsset = asset === ASSETS.resume || asset === ASSETS.profileImage;
    const isBase64File = isFileAsset
      && contentType === "application/json"
      && typeof request.body?.fileBase64 === "string";
    if (isFileAsset && !isBase64File) {
      throw createError("The file upload payload is missing. Please select the file again and retry.", 400);
    }
    if (contentType !== asset.contentType && !isBase64File) {
      throw createError(`This asset must be uploaded as ${asset.contentType}.`, 415);
    }

    let content;
    if (isBase64File) content = decodeBase64Upload(request, asset.maxSize);
    else content = readJsonBody(request);
    if (content.length > asset.maxSize) {
      throw createError(`File exceeds the ${Math.floor(asset.maxSize / (1024 * 1024))} MB size limit.`, 413);
    }
    if (asset === ASSETS.socialLinks) content = validateSocialLinks(content);
    else if (asset === ASSETS.projects) content = validateProjects(content);
    else validateImageOrPdf(asset, content);
    if (!content.length) throw createError("The selected file is empty.", 400);

    if (localTestMode) {
      await writeFile(resolve(process.cwd(), asset.pathname), content);
      return response.status(200).json({
        url: asset.publicUrl,
        savedLocally: true,
        bytesValidated: content.length,
        message: "Saved to the local portfolio. No GitHub repository was changed.",
      });
    }

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
