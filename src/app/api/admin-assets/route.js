export const dynamic = "force-dynamic";

export async function PUT(request) {
  const { NextResponse } = await import("next/server");

  const writeFile = (await import("node:fs/promises")).writeFile;
  const resolve = (await import("node:path")).resolve;

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

  function err(message, status) {
    return NextResponse.json({ error: message }, { status });
  }

  function isLocalUploadTest(req) {
    if (process.env.NODE_ENV !== "development") return false;
    const host = (req.headers.get("host") || "").replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
    const auth = req.headers.get("authorization") || "";
    return ["localhost", "127.0.0.1", "::1"].includes(host) && auth === "Bearer local-admin-upload-test";
  }

  async function verifyAdmin(idToken) {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (!apiKey) return err("Firebase API key is not configured on the server.", 500);
    if (!idToken) return err("Sign in to update portfolio assets.", 401);

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return err("Firebase sign-in expired or could not be verified.", 401);
    const result = await res.json();
    const account = result.users?.[0];
    if (account?.email?.toLowerCase() !== ADMIN_EMAIL || !account.emailVerified) {
      return err(`Only the verified ${ADMIN_EMAIL} account can update portfolio files.`, 403);
    }
    return null;
  }

  try {
    const url = new URL(request.url);
    const assetName = url.searchParams.get("asset");
    const asset = ASSETS[assetName];
    if (!asset) return err("Choose a supported portfolio asset.", 400);

    const body = await request.json().catch(() => ({}));
    const localTestMode = isLocalUploadTest(request);

    if (!localTestMode) {
      const authHeader = request.headers.get("authorization") || "";
      const idToken = authHeader.replace(/^Bearer\s+/i, "");
      const authError = await verifyAdmin(idToken);
      if (authError) return authError;
    }

    let content;
    const isFileAsset = assetName === "resume" || assetName === "profileImage";

    if (isFileAsset) {
      if (typeof body.fileBase64 !== "string") return err("The file upload payload is missing.", 400);
      const decoded = Buffer.from(body.fileBase64, "base64");
      if (decoded.length > asset.maxSize) return err(`File exceeds the ${Math.floor(asset.maxSize / (1024 * 1024))} MB size limit.`, 413);
      if (assetName === "resume" && decoded.subarray(0, 5).toString("ascii") !== "%PDF-") return err("The selected resume is not a valid PDF.", 400);
      if (assetName === "profileImage" && !decoded.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return err("The selected profile image is not a valid PNG.", 400);
      content = decoded;
    } else {
      const jsonStr = JSON.stringify(body);
      content = Buffer.from(jsonStr);
      if (content.length > asset.maxSize) return err("Data too large.", 413);
    }

    if (!content || !content.length) return err("The selected file is empty.", 400);

    if (localTestMode) {
      await writeFile(resolve(/*turbopackIgnore: true*/ process.cwd(), asset.pathname), content);
      return NextResponse.json({
        url: asset.publicUrl,
        savedLocally: true,
        message: "Saved to the local portfolio. No GitHub repository was changed.",
      });
    }

    const token = process.env.GITHUB_TOKEN;
    const repository = process.env.GITHUB_REPOSITORY || "Sanjay-Amarnath/portfolio";
    const branch = process.env.GITHUB_BRANCH || "main";

    if (!token) return err("GitHub upload is not configured.", 500);

    const ghHeaders = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "portfolio-admin",
    };

    const getRes = await fetch(
      `https://api.github.com/repos/${repository}/contents/${asset.pathname}?ref=${branch}`,
      { headers: ghHeaders }
    );
    const getCurrent = getRes.ok ? await getRes.json() : {};

    const putBody = {
      message: `Update ${asset.pathname.replace("public/", "")} from portfolio admin`,
      content: content.toString("base64"),
      branch,
    };
    if (getCurrent.sha) putBody.sha = getCurrent.sha;

    const putRes = await fetch(
      `https://api.github.com/repos/${repository}/contents/${asset.pathname}`,
      {
        method: "PUT",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(putBody),
      }
    );
    const putResult = await putRes.json();
    if (!putRes.ok) return err(`GitHub could not update the portfolio file (HTTP ${putRes.status}).`, 502);

    return NextResponse.json({
      url: asset.publicUrl,
      commit: putResult.commit?.sha,
      message: "Saved to the repository. Vercel will publish the update after its deployment completes.",
    });
  } catch (error) {
    console.error("Portfolio admin upload failed:", error);
    return NextResponse.json({ error: error.message || "Could not save the portfolio file." }, { status: 500 });
  }
}

export async function GET() {
  const { NextResponse } = await import("next/server");
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

