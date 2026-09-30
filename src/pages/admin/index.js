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
} from "firebase/storage";
import {
  ADMIN_EMAIL,
  getFirebaseServices,
  isFirebaseConfigured,
  MAX_RESUME_SIZE,
  RESUME_STORAGE_PATH,
} from "../../firebase";
import {
  DEFAULT_SOCIAL_LINKS,
  loadSocialLinks,
  SOCIAL_LINKS_STORAGE_PATH,
  validateSocialLinks,
} from "../../socialLinks";
import "./admin.scss";

const isMissingResume = (error) => error.code === "storage/object-not-found";

const Admin = () => {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState(DEFAULT_SOCIAL_LINKS);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
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
          if (isMounted) setError(`Could not end the unauthorized session: ${signOutError.message}`);
        }
        return;
      }

      if (nextUser) setError("");
      setUser(nextUser);
      if (!nextUser) {
        setResumeUrl("");
        setSocialLinks(DEFAULT_SOCIAL_LINKS);
        return;
      }

      loadSocialLinks(storage)
        .then((links) => {
          if (isMounted) setSocialLinks(links);
        })
        .catch((linksError) => {
          if (isMounted) {
            setError((currentError) =>
              [currentError, `Could not load social links: ${linksError.message}`]
                .filter(Boolean)
                .join(" ")
            );
          }
        });

      try {
        const url = await getDownloadURL(ref(storage, RESUME_STORAGE_PATH));
        if (isMounted) setResumeUrl(url);
      } catch (resumeError) {
        if (isMounted) {
          setResumeUrl("");
          if (!isMissingResume(resumeError)) {
            setError(`Could not load the current resume: ${resumeError.message}`);
          }
        }
      }
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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(null);
    setError("");
    setNotice("");

    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF file.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_RESUME_SIZE) {
      setError("The PDF must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile || isUploading) return;

    const form = event.currentTarget;
    setError("");
    setNotice("");
    setIsUploading(true);
    try {
      const { storage } = getFirebaseServices();
      const resumeRef = ref(storage, RESUME_STORAGE_PATH);
      const snapshot = await uploadBytes(resumeRef, selectedFile, {
        contentType: "application/pdf",
      });
      const url = await getDownloadURL(snapshot.ref);
      setResumeUrl(url);
      setSelectedFile(null);
      form.reset();
      setNotice("Resume uploaded. The previous resume has been replaced.");
    } catch (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
    } finally {
      setIsUploading(false);
    }
  };

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
        new Blob([JSON.stringify(validatedLinks)], { type: "application/json" }),
        { contentType: "application/json" }
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
          Sign in with <strong>{ADMIN_EMAIL}</strong> to update the resume and
          social links shown on the portfolio.
        </p>

        {error && <p className="admin-message admin-error" role="alert">{error}</p>}
        {notice && <p className="admin-message admin-success" role="status">{notice}</p>}

        {!user ? (
          <button className="admin-button" type="button" onClick={handleSignIn}>
            Sign in with Google
          </button>
        ) : (
          <>
            <div className="admin-account">
              <span>Signed in as {user.email}</span>
              <button className="admin-text-button" type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </div>

            <div className="admin-current-resume">
              <h2>Current resume</h2>
              {resumeUrl ? (
                <a href={resumeUrl} target="_blank" rel="noreferrer">
                  View current PDF
                </a>
              ) : (
                <p>No resume has been uploaded to Firebase yet.</p>
              )}
            </div>

            <form onSubmit={handleUpload}>
              <label className="admin-file-label" htmlFor="resume-file">
                Upload a new PDF
              </label>
              <input
                id="resume-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="admin-help">PDF only, up to 10 MB. Uploading replaces the existing resume.</p>
              <button
                className="admin-button"
                type="submit"
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Uploading..." : "Upload resume"}
              </button>
            </form>

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

        <a className="admin-back-link" href="/">Back to portfolio</a>
      </section>
    </main>
  );
};

export default Admin;
