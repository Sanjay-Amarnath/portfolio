import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { DEFAULT_SOCIAL_LINKS, loadSocialLinks } from "../../socialLinks";
import { loadProjects } from "../../data/projects";
import {
  ADMIN_EMAIL,
  isFirebaseConfigured,
  MAX_PROFILE_IMAGE_SIZE,
  MAX_RESUME_SIZE,
  getFirebaseServices,
} from "../../firebase";
import { prepareProfileImage } from "./prepareProfileImage";
import "./admin.scss";

const EMPTY_PROJECT = {
  slug: "",
  name: "",
  type: "",
  category: "product",
  context: "",
  symbol: "",
  color: "teal",
  summary: "",
  contribution: "",
  focus: "",
  stack: "",
  learning: "",
  href: "",
};

const localUploadTestMode = process.env.NODE_ENV === "development"
  && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

function getAuthErrorMessage(error) {
  return error.message || "Could not complete Google sign-in.";
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function Admin() {
  const [user, setUser] = useState(localUploadTestMode ? {
    email: "Local upload test mode",
    emailVerified: true,
    getIdToken: async () => "local-admin-upload-test",
  } : null);
  const [authReady, setAuthReady] = useState(localUploadTestMode);
  const [authError, setAuthError] = useState("");
  const [socialLinks, setSocialLinks] = useState(DEFAULT_SOCIAL_LINKS);
  const [projects, setProjects] = useState([]);
  const [projectDraft, setProjectDraft] = useState(EMPTY_PROJECT);
  const [editingSlug, setEditingSlug] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileImageVersion, setProfileImageVersion] = useState(0);

  useEffect(() => {
    if (localUploadTestMode) return undefined;
    if (!isFirebaseConfigured) {
      setAuthReady(true);
      return undefined;
    }
    const { auth } = getFirebaseServices();
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([loadSocialLinks(), loadProjects()])
      .then(([links, loadedProjects]) => {
        if (!isMounted) return;
        setSocialLinks(links);
        setProjects(loadedProjects);
      })
      .catch((loadError) => {
        if (isMounted) setError(`Could not load portfolio data: ${loadError.message}`);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const authorized = user?.email?.toLowerCase() === ADMIN_EMAIL && user.emailVerified;
  const canManage = authorized || localUploadTestMode;

  async function handleSignIn() {
    setAuthError("");
    try {
      const { auth } = getFirebaseServices();
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (signInError) {
      setAuthError(getAuthErrorMessage(signInError));
    }
  }

  async function handleSignOut() {
    try {
      const { auth } = getFirebaseServices();
      await signOut(auth);
    } catch (signOutError) {
      setAuthError(getAuthErrorMessage(signOutError));
    }
  }

  async function getAdminToken() {
    if (localUploadTestMode) return "local-admin-upload-test";
    if (!authorized) throw new Error(`Sign in with the verified ${ADMIN_EMAIL} account.`);
    return user.getIdToken();
  }

  async function saveJsonAsset(asset, data) {
    const token = await getAdminToken();
    const response = await fetch(`/api/admin-assets?asset=${asset}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save changes.");
    setSuccess(result.message);
    setError("");
  }

  async function handleFileUpload(asset, file, maxSize) {
    if (!file) return;
    setError("");
    setSuccess("");
    let uploadFile = file;
    const isResume = asset === "resume";
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (isResume && !isPdf) {
      setError("Choose a PDF file for the resume.");
      return;
    }
    if (file.size > maxSize) {
      setError(`File must be no larger than ${Math.floor(maxSize / (1024 * 1024))} MB.`);
      return;
    }
    setBusy(true);
    try {
      if (!isResume) {
        uploadFile = await prepareProfileImage(file);
        if (uploadFile.size > maxSize) {
          throw new Error(`Converted image must be no larger than ${Math.floor(maxSize / (1024 * 1024))} MB.`);
        }
      }
      const token = await getAdminToken();
      const uploadBody = JSON.stringify({
        fileBase64: await readFileAsBase64(uploadFile),
      });
      const response = await fetch(`/api/admin-assets?asset=${asset}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: uploadBody,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not upload the file.");
      if (asset === "profileImage") setProfileImageVersion(Date.now());
      setSuccess(result.message);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSocialSave(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await saveJsonAsset("socialLinks", socialLinks);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  function editProject(project) {
    setEditingSlug(project.slug);
    setProjectDraft({
      ...project,
      focus: project.focus.join("\n"),
      stack: project.stack.join(", "),
      href: project.href || "",
    });
    setError("");
    setSuccess("");
    const editor = document.getElementById("admin-project-editor");
    if (typeof editor?.scrollIntoView === "function") {
      editor.scrollIntoView({ behavior: "smooth" });
    }
  }

  function startNewProject() {
    setEditingSlug("");
    setProjectDraft(EMPTY_PROJECT);
    setError("");
    setSuccess("");
  }

  async function handleProjectSave(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const project = {
      slug: projectDraft.slug.trim(),
      name: projectDraft.name.trim(),
      type: projectDraft.type.trim(),
      category: projectDraft.category,
      context: projectDraft.context.trim(),
      symbol: projectDraft.symbol.trim(),
      color: projectDraft.color,
      summary: projectDraft.summary.trim(),
      contribution: projectDraft.contribution.trim(),
      focus: projectDraft.focus.split("\n").map((value) => value.trim()).filter(Boolean),
      stack: projectDraft.stack.split(",").map((value) => value.trim()).filter(Boolean),
      learning: projectDraft.learning.trim(),
    };
    if (projectDraft.href.trim()) project.href = projectDraft.href.trim();

    const nextProjects = editingSlug
      ? projects.map((item) => item.slug === editingSlug ? project : item)
      : [...projects, project];
    try {
      await saveJsonAsset("projects", nextProjects);
      setProjects(nextProjects);
      setEditingSlug("");
      setProjectDraft(EMPTY_PROJECT);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-card">
        <p className="admin-eyebrow">Portfolio management</p>
        <h1>Manage your portfolio</h1>
        <p className="admin-intro">
          Update published assets, social links, and the projects shown across
          your portfolio. Changes deploy after the repository update completes.
        </p>

        {!authReady && <p role="status">Checking sign-in…</p>}
        {localUploadTestMode && (
          <p className="admin-message admin-success" role="status">
            Local development mode: sign-in is bypassed and changes are saved only to this local project, not GitHub.
          </p>
        )}
        {authReady && !canManage && (
          <section className="admin-auth" aria-labelledby="admin-auth-title">
            <h2 id="admin-auth-title">Administrator sign-in</h2>
            {!isFirebaseConfigured && (
              <p className="admin-help">
                Configure the Firebase web app variables from the README before signing in.
              </p>
            )}
            {user && !authorized && (
              <>
                <p className="admin-message admin-error">
                  Only the verified {ADMIN_EMAIL} account can edit portfolio content.
                </p>
                <button className="admin-text-button" type="button" onClick={handleSignOut}>Sign out</button>
              </>
            )}
            {authError && <p className="admin-message admin-error" role="alert">{authError}</p>}
            <button
              className="admin-button"
              type="button"
              onClick={handleSignIn}
              disabled={!isFirebaseConfigured}
            >
              Sign in with Google
            </button>
          </section>
        )}
        {authorized && !localUploadTestMode && (
          <div className="admin-account">
            <span>Signed in as {user.email}</span>
            <button className="admin-text-button" type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        )}

        {error && <p className="admin-message admin-error" role="alert">{error}</p>}
        {success && <p className="admin-message admin-success" role="status">{success}</p>}

        {canManage && (
          <>
            <section className="admin-assets" aria-labelledby="admin-assets-title">
              <h2 id="admin-assets-title">Published assets</h2>
              <div>
                <h3>Resume PDF</h3>
                <a href="/data/Resume.pdf" target="_blank" rel="noreferrer">View current resume</a>
                <label className="admin-file-label" htmlFor="admin-resume-file">Replace resume PDF</label>
                <input
                  id="admin-resume-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={busy}
                  onChange={(event) => handleFileUpload("resume", event.target.files[0], MAX_RESUME_SIZE)}
                />
                <p className="admin-help">PDF only · up to 4 MB. Replaces the existing resume.</p>
              </div>
              <div>
                <h3>Profile image</h3>
                <div className="admin-asset-row admin-profile-asset">
                  <img
                    src={`/images/sanjay.png${profileImageVersion ? `?v=${profileImageVersion}` : ""}`}
                    alt="Sanjay Amarnath"
                  />
                  <a href="/images/sanjay.png" target="_blank" rel="noreferrer">View current image</a>
                </div>
                <label className="admin-file-label" htmlFor="admin-image-file">Replace profile image</label>
                <input
                  id="admin-image-file"
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={(event) => handleFileUpload("profileImage", event.target.files[0], MAX_PROFILE_IMAGE_SIZE)}
                />
                <p className="admin-help">Any image format your browser can decode · up to 4 MB. It is converted to PNG and replaces the existing image.</p>
              </div>
            </section>

            <section className="admin-social-form" aria-labelledby="admin-social-title">
              <h2 id="admin-social-title">Social links</h2>
              <form onSubmit={handleSocialSave}>
                {Object.entries(socialLinks).map(([platform, url]) => (
                  <label key={platform}>
                    {platform}
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(event) => setSocialLinks({ ...socialLinks, [platform]: event.target.value })}
                    />
                  </label>
                ))}
                <button className="admin-button" type="submit" disabled={busy}>Save social links</button>
              </form>
            </section>

            <section className="admin-projects" aria-labelledby="admin-projects-title">
              <div className="admin-section-heading">
                <div>
                  <h2 id="admin-projects-title">Portfolio projects</h2>
                  <p className="admin-help">These appear on the home page and at /projects.</p>
                </div>
                <button className="admin-button" type="button" onClick={startNewProject}>
                  Add project
                </button>
              </div>
              <ul className="admin-project-list">
                {projects.map((project) => (
                  <li key={project.slug}>
                    <span>{project.name}<small>{project.slug}</small></span>
                    <button className="admin-text-button" type="button" onClick={() => editProject(project)}>
                      Edit
                    </button>
                  </li>
                ))}
              </ul>
              <form id="admin-project-editor" className="admin-project-editor" onSubmit={handleProjectSave}>
                <h3>{editingSlug ? `Edit ${editingSlug}` : "Add a project"}</h3>
                <div className="admin-project-fields">
                  <label>Project name<input required value={projectDraft.name} onChange={(event) => setProjectDraft({ ...projectDraft, name: event.target.value })} /></label>
                  <label>URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={projectDraft.slug} onChange={(event) => setProjectDraft({ ...projectDraft, slug: event.target.value })} /></label>
                  <label>Type<input required value={projectDraft.type} onChange={(event) => setProjectDraft({ ...projectDraft, type: event.target.value })} /></label>
                  <label>Category
                    <select value={projectDraft.category} onChange={(event) => setProjectDraft({ ...projectDraft, category: event.target.value })}>
                      <option value="product">Product</option><option value="saas">SaaS</option><option value="commerce">Commerce</option>
                    </select>
                  </label>
                  <label>Context<input required value={projectDraft.context} onChange={(event) => setProjectDraft({ ...projectDraft, context: event.target.value })} /></label>
                  <label>Card symbol<input required value={projectDraft.symbol} onChange={(event) => setProjectDraft({ ...projectDraft, symbol: event.target.value })} /></label>
                  <label>Artwork color
                    <select value={projectDraft.color} onChange={(event) => setProjectDraft({ ...projectDraft, color: event.target.value })}>
                      {["teal", "blue", "coral", "green", "sand"].map((color) => <option key={color} value={color}>{color}</option>)}
                    </select>
                  </label>
                  <label>Project link (optional)<input type="text" placeholder="https://… or /resume" value={projectDraft.href} onChange={(event) => setProjectDraft({ ...projectDraft, href: event.target.value })} /></label>
                  <label className="admin-field-wide">Summary<textarea required rows="3" value={projectDraft.summary} onChange={(event) => setProjectDraft({ ...projectDraft, summary: event.target.value })} /></label>
                  <label className="admin-field-wide">Your contribution<textarea required rows="3" value={projectDraft.contribution} onChange={(event) => setProjectDraft({ ...projectDraft, contribution: event.target.value })} /></label>
                  <label>Focus areas · one per line<textarea required rows="4" value={projectDraft.focus} onChange={(event) => setProjectDraft({ ...projectDraft, focus: event.target.value })} /></label>
                  <label>Technology stack · comma-separated<textarea required rows="4" value={projectDraft.stack} onChange={(event) => setProjectDraft({ ...projectDraft, stack: event.target.value })} /></label>
                  <label className="admin-field-wide">What you learned<textarea required rows="3" value={projectDraft.learning} onChange={(event) => setProjectDraft({ ...projectDraft, learning: event.target.value })} /></label>
                </div>
                <div className="admin-editor-actions">
                  <button className="admin-button" type="submit" disabled={busy}>
                    {busy ? "Saving…" : editingSlug ? "Save project changes" : "Add project"}
                  </button>
                  {editingSlug && <button className="admin-text-button" type="button" onClick={startNewProject}>Cancel edit</button>}
                </div>
              </form>
            </section>
          </>
        )}

        <a className="admin-back-link" href="/">Back to portfolio</a>
      </section>
    </main>
  );
}

export default Admin;
