import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  ADMIN_EMAIL,
  getFirebaseServices,
  isFirebaseConfigured,
  MAX_PROFILE_IMAGE_SIZE,
  MAX_RESUME_SIZE,
} from "../../firebase";
import {
  DEFAULT_SOCIAL_LINKS,
  loadSocialLinks,
  validateSocialLinks,
} from "../../socialLinks";
import "./admin.scss";

const Admin = () => {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("/data/Resume.pdf");
  const [profileImageUrl, setProfileImageUrl] = useState("/images/sanjay.png");
  const [socialLinks, setSocialLinks] = useState(DEFAULT_SOCIAL_LINKS);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploadProgress, setResumeUploadProgress] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoaded(true);
      return undefined;
    }

    let services;
    try {
      services = getFirebaseServices();
    } catch (initializationError) {
      setAuthLoaded(true);
      setError(`Firebase initialization failed: ${initializationError.message}`);
      return undefined;
    }

    const { auth } = services;
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!isMounted) return;
      setAuthLoaded(true);

      if (nextUser && nextUser.email?.toLowerCase() !== ADMIN_EMAIL) {
        setUser(null);
        setError(`Access is limited to ${ADMIN_EMAIL}.`);
        try {
          await signOut(auth);
        } catch (signOutError) {
          if (isMounted) {
            setError(`Could not end the unauthorized session: ${signOutError.message}`);
          }
        }
        return;
      }

      if (nextUser) setError("");
      setUser(nextUser);
      setResumeUrl("/data/Resume.pdf");
      setProfileImageUrl("/images/sanjay.png");
      if (!nextUser) {
        setSocialLinks(DEFAULT_SOCIAL_LINKS);
        return;
      }

      loadSocialLinks()
        .then((links) => {
          if (isMounted) setSocialLinks(links);
        })
        .catch((linksError) => {
          if (isMounted) {
            setError((currentError) => [
              currentError,
              `Could not load social links: ${linksError.message}`,
            ].filter(Boolean).join(" "));
          }
        });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setError("");
    try {
      const { auth } = getFirebaseServices();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        login_hint: ADMIN_EMAIL,
        prompt: "select_account",
      });
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError) {
        if (popupError.code !== "auth/popup-blocked") throw popupError;
        await signInWithRedirect(auth, provider);
      }
    } catch (signInError) {
      setError(`Sign-in failed: ${signInError.message}`);
    }
  };

  const handleSignOut = async () => {
    setError("");
    try {
      const { auth } = getFirebaseServices();
      await signOut(auth);
    } catch (signOutError) {
      setError(`Sign-out failed: ${signOutError.message}`);
    }
  };

  const handleAssetSelection = (
    event,
    setSelectedFile,
    allowedTypes,
    maxSize,
    description,
  ) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(null);
    setError("");
    setNotice("");
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setError(`Choose a supported ${description} file.`);
      event.target.value = "";
      return;
    }
    if (file.size > maxSize) {
      setError(
        `${description} must be ${Math.floor(maxSize / (1024 * 1024))} MB or smaller.`,
      );
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const uploadAsset = async (
    event,
    file,
    asset,
    setUrl,
    setSelectedFile,
    setUploading,
    message,
    onProgress = () => {},
  ) => {
    event.preventDefault();
    if (!file) return;
    const form = event.currentTarget;
    setError("");
    setNotice("");
    setUploading(true);
    onProgress(0);
    try {
      const idToken = await user.getIdToken();
      const responseBody = await new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("PUT", `/api/admin-assets?asset=${encodeURIComponent(asset)}`);
        request.setRequestHeader("Authorization", `Bearer ${idToken}`);
        request.setRequestHeader("Content-Type", file.type);
        request.upload.addEventListener("progress", (progressEvent) => {
          if (progressEvent.lengthComputable) {
            onProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          }
        });
        request.addEventListener("load", () => {
          let result;
          try {
            result = JSON.parse(request.responseText);
          } catch {
            if (request.status === 404) {
              reject(
                new Error(
                  "The upload API was not found. Stop npm start and run npm run dev:vercel to start the site with its API routes.",
                ),
              );
              return;
            }
            reject(new Error("The upload service returned an invalid response."));
            return;
          }
          if (request.status < 200 || request.status >= 300) {
            reject(new Error(result.error || `Upload failed (HTTP ${request.status}).`));
            return;
          }
          resolve(result);
        });
        request.addEventListener("error", () => {
          reject(new Error("Could not reach the portfolio upload service."));
        });
        request.addEventListener("abort", () => {
          reject(new Error("The upload was cancelled."));
        });
        request.send(file);
      });
      setUrl(responseBody.url);
      setSelectedFile(null);
      form.reset();
      setNotice(`${message} ${responseBody.message}`);
    } catch (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
    } finally {
      setUploading(false);
      onProgress(0);
    }
  };

  const handleResumeUpload = (event) =>
    uploadAsset(
      event,
      selectedResume,
      "resume",
      setResumeUrl,
      setSelectedResume,
      setIsUploadingResume,
      "Resume replaced. The portfolio now uses the new PDF.",
      setResumeUploadProgress,
    );

  const handleProfileImageUpload = (event) =>
    uploadAsset(
      event,
      selectedProfileImage,
      "profileImage",
      setProfileImageUrl,
      setSelectedProfileImage,
      setIsUploadingImage,
      "Profile image replaced. The portfolio now uses the new image.",
    );

  const handleSocialLinkChange = (event) => {
    const { name, value } = event.target;
    setSocialLinks((currentLinks) => ({ ...currentLinks, [name]: value }));
    setError("");
    setNotice("");
  };

  const handleSocialLinksSave = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    let validatedLinks;
    try {
      validatedLinks = validateSocialLinks(socialLinks);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    setIsSavingLinks(true);
    try {
      const { auth } = getFirebaseServices();
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/admin-assets?asset=socialLinks", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedLinks),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save social links.");
      setSocialLinks(validatedLinks);
      setNotice(`Social media links saved. ${result.message}`);
    } catch (saveError) {
      setError(`Could not save social links: ${saveError.message}`);
    } finally {
      setIsSavingLinks(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <main className="admin-page">
        <section className="admin-card">
          <p className="admin-eyebrow">Portfolio management</p>
          <h1>Firebase sign-in setup required</h1>
          <p>
            Add the Firebase web app configuration variables described in the
            README and enable Google sign-in. Portfolio files are committed to
            the repository, not Firebase Storage.
          </p>
          <a href="/">Back to portfolio</a>
        </section>
      </main>
    );
  }

  if (!authLoaded) {
    return (
      <main className="admin-page">
        <section className="admin-card" aria-live="polite">
          <p>Checking administrator access...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-card">
        <p className="admin-eyebrow">Portfolio management</p>
        <h1>Portfolio admin</h1>
        <p className="admin-intro">
          Sign in with <strong>{ADMIN_EMAIL}</strong> to update the resume,
          profile image, and social links shown on the portfolio.
        </p>

        {error && (
          <p className="admin-message admin-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="admin-message admin-success" role="status">
            {notice}
          </p>
        )}

        {!user ? (
          <button className="admin-button" type="button" onClick={handleSignIn}>
            Sign in with Google
          </button>
        ) : (
          <>
            <div className="admin-account">
              <span>Signed in as {user.email}</span>
              <button
                className="admin-text-button"
                type="button"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>

            <section className="admin-assets" aria-labelledby="admin-assets-title">
              <h2 id="admin-assets-title">Portfolio assets</h2>
              <form onSubmit={handleResumeUpload}>
                <h3>Resume PDF</h3>
                {resumeUrl ? (
                  <a href={resumeUrl} target="_blank" rel="noreferrer">
                    View current resume
                  </a>
                ) : (
                  <a href={resumeUrl} target="_blank" rel="noreferrer">
                    View fallback resume
                  </a>
                )}
                <label className="admin-file-label" htmlFor="resume-file">
                  Upload replacement PDF
                </label>
                <input
                  id="resume-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={isUploadingResume}
                  onChange={(event) =>
                    handleAssetSelection(
                      event,
                      setSelectedResume,
                      ["application/pdf"],
                      MAX_RESUME_SIZE,
                      "PDF",
                    )
                  }
                />
                <p className="admin-help">
                  PDF, up to 4 MB. Uploading replaces the current hosted resume.
                </p>
                {isUploadingResume && (
                  <p className="admin-help" role="status">
                    Uploading resume: {resumeUploadProgress}%
                  </p>
                )}
                <button
                  className="admin-button"
                  type="submit"
                  disabled={!selectedResume || isUploadingResume}
                >
                  {isUploadingResume ? "Uploading resume..." : "Upload resume"}
                </button>
              </form>

              <form onSubmit={handleProfileImageUpload}>
                <h3>Profile image</h3>
                <div className="admin-asset-row admin-profile-asset">
                  <img
                    src={profileImageUrl}
                    alt="Sanjay Amarnath"
                  />
                  <a href={profileImageUrl} target="_blank" rel="noreferrer">
                    View current image
                  </a>
                </div>
                <label className="admin-file-label" htmlFor="profile-image-file">
                  Upload replacement image
                </label>
                <input
                  id="profile-image-file"
                  type="file"
                  accept="image/png"
                  disabled={isUploadingImage}
                  onChange={(event) =>
                    handleAssetSelection(
                      event,
                      setSelectedProfileImage,
                      ["image/png"],
                      MAX_PROFILE_IMAGE_SIZE,
                      "image",
                    )
                  }
                />
                <p className="admin-help">
                  PNG up to 4 MB. Saving commits the replacement to the site
                  repository and triggers a Vercel deployment.
                </p>
                <button
                  className="admin-button"
                  type="submit"
                  disabled={!selectedProfileImage || isUploadingImage}
                >
                  {isUploadingImage ? "Uploading image..." : "Upload image"}
                </button>
              </form>
              <p className="admin-help">
                Uploads are committed to the portfolio repository. The site
                updates after Vercel finishes deploying the commit.
              </p>
            </section>

            <form className="admin-social-form" onSubmit={handleSocialLinksSave}>
              <h2>Social media links</h2>
              <label className="admin-file-label" htmlFor="instagram-url">
                Instagram URL
              </label>
              <input
                id="instagram-url"
                name="instagram"
                type="url"
                value={socialLinks.instagram}
                onChange={handleSocialLinkChange}
                required
              />
              <label className="admin-file-label" htmlFor="twitter-url">
                Twitter / X URL
              </label>
              <input
                id="twitter-url"
                name="twitter"
                type="url"
                value={socialLinks.twitter}
                onChange={handleSocialLinkChange}
                required
              />
              <label className="admin-file-label" htmlFor="linkedin-url">
                LinkedIn URL
              </label>
              <input
                id="linkedin-url"
                name="linkedin"
                type="url"
                value={socialLinks.linkedin}
                onChange={handleSocialLinkChange}
                required
              />
              <p className="admin-help">
                Use a full http:// or https:// URL. Saving commits the links to
                the site repository; Vercel publishes them after deployment.
              </p>
              <button
                className="admin-button"
                type="submit"
                disabled={isSavingLinks}
              >
                {isSavingLinks ? "Saving..." : "Save social links"}
              </button>
            </form>
          </>
        )}

        <a className="admin-back-link" href="/">
          Back to portfolio
        </a>
      </section>
    </main>
  );
};

export default Admin;
