import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  getDownloadURL,
  ref,
  uploadBytes,
  uploadBytesResumable,
} from "firebase/storage";
import {
  ADMIN_EMAIL,
  getFirebaseServices,
  isFirebaseConfigured,
  MAX_PROFILE_IMAGE_SIZE,
  MAX_RESUME_SIZE,
  PROFILE_IMAGE_STORAGE_PATH,
  RESUME_STORAGE_PATH,
} from "../../firebase";
import {
  DEFAULT_SOCIAL_LINKS,
  loadSocialLinks,
  SOCIAL_LINKS_STORAGE_PATH,
  validateSocialLinks,
} from "../../socialLinks";
import { waitForUploadTask } from "../../resumeUpload";
import "./admin.scss";

const isMissingAsset = (error) => error.code === "storage/object-not-found";

const Admin = () => {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
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

    const { auth, storage } = services;
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
      if (!nextUser) {
        setResumeUrl("");
        setProfileImageUrl("");
        setSocialLinks(DEFAULT_SOCIAL_LINKS);
        return;
      }

      const loadAssetUrl = async (path, setUrl, label) => {
        try {
          const url = await getDownloadURL(ref(storage, path));
          if (isMounted) setUrl(url);
        } catch (assetError) {
          if (!isMounted) return;
          setUrl("");
          if (!isMissingAsset(assetError)) {
            setError(`${label} could not be loaded: ${assetError.message}`);
          }
        }
      };

      loadAssetUrl(RESUME_STORAGE_PATH, setResumeUrl, "Resume");
      loadAssetUrl(PROFILE_IMAGE_STORAGE_PATH, setProfileImageUrl, "Profile image");
      loadSocialLinks(storage)
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
    path,
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
    try {
      const { storage } = getFirebaseServices();
      const assetRef = ref(storage, path);
      const snapshot = await waitForUploadTask(
        uploadBytesResumable(assetRef, file, { contentType: file.type }),
        onProgress,
      );
      const url = await getDownloadURL(snapshot.ref);
      setUrl(url);
      setSelectedFile(null);
      form.reset();
      setNotice(message);
    } catch (uploadError) {
      setError(
        `Upload failed: ${uploadError.code ? `${uploadError.code}: ` : ""}${uploadError.message}`,
      );
    } finally {
      setUploading(false);
    }
  };

  const handleResumeUpload = (event) =>
    uploadAsset(
      event,
      selectedResume,
      RESUME_STORAGE_PATH,
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
      PROFILE_IMAGE_STORAGE_PATH,
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
      const { storage } = getFirebaseServices();
      const linksRef = ref(storage, SOCIAL_LINKS_STORAGE_PATH);
      await uploadBytes(
        linksRef,
        new Blob([JSON.stringify(validatedLinks)], {
          type: "application/json",
        }),
        { contentType: "application/json" },
      );
      setSocialLinks(validatedLinks);
      setNotice("Social media links updated.");
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
          <h1>Firebase setup required</h1>
          <p>
            Add the Firebase web app configuration variables described in the
            README, then enable Google sign-in and apply the Storage rules.
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
                  <a href="/data/Resume.pdf" target="_blank" rel="noreferrer">
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
                  PDF, up to 10 MB. Uploading replaces the current hosted resume.
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
                    src={profileImageUrl || "/images/sanjay.png"}
                    alt="Sanjay Amarnath"
                  />
                  {profileImageUrl ? (
                    <a href={profileImageUrl} target="_blank" rel="noreferrer">
                      View current image
                    </a>
                  ) : (
                    <a href="/images/sanjay.png" target="_blank" rel="noreferrer">
                      View fallback image
                    </a>
                  )}
                </div>
                <label className="admin-file-label" htmlFor="profile-image-file">
                  Upload replacement image
                </label>
                <input
                  id="profile-image-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploadingImage}
                  onChange={(event) =>
                    handleAssetSelection(
                      event,
                      setSelectedProfileImage,
                      ["image/jpeg", "image/png", "image/webp"],
                      MAX_PROFILE_IMAGE_SIZE,
                      "image",
                    )
                  }
                />
                <p className="admin-help">
                  JPG, PNG, or WebP, up to 5 MB. Uploading replaces the current
                  hosted image.
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
                Uploads replace files at fixed Firebase Storage paths, so the
                portfolio keeps stable links to the latest versions.
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
                Use a full http:// or https:// URL. Saving updates the links on
                your public portfolio.
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
