# Portfolia

This directory is a brief example of a [Create React App](https://github.com/facebook/create-react-app) site that can be deployed to Vercel with zero configuration.

## Deploy Your Own

Deploy your own Create React App project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/vercel/tree/main/examples/create-react-app&template=create-react-app)

_Live Example: https://create-react-template.vercel.app/_

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app and its Vercel API routes in development mode. Open the URL
printed in the terminal to view it in your browser. This is required to test
admin uploads locally because the upload endpoint is a Vercel function.

### `npm run start:cra`

Runs only the Create React App frontend. Admin asset uploads are unavailable
when using this command because it does not serve the `/api/` functions.

The page will reload when you make changes. You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode. See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.

It correctly bundles React in production mode and optimizes the build for the best performance. The build is minified and the filenames include the hashes.

## Admin resume uploads

The admin page at `/admin` uses Firebase Google sign-in to authenticate
`sanjaymrnth@gmail.com`. Resume, profile image, and social-link changes are
committed to this public GitHub repository instead of Firebase Storage:

- `public/data/Resume.pdf` — PDF, up to 4 MB
- `public/images/sanjay.png` — PNG, up to 4 MB
- `public/data/social-links.json` — public profile URLs

The Vercel API verifies the Firebase ID token with Firebase Authentication and
then uses a repository-scoped GitHub token to update only these fixed files.
Each update creates a GitHub commit, which triggers the connected Vercel
deployment. The live site reflects the change when that deployment completes.
Firebase Storage is not used, so no Storage bucket or Blaze upgrade is needed.

### One-time setup

1. In Firebase Authentication, enable Google sign-in and add the local and
   deployed portfolio domains to **Authorized domains**. Firebase Auth remains
   the only Firebase service used by the admin flow.
2. Create a GitHub **fine-grained personal access token** for only this
   repository. Grant **Contents: Read and write** (Metadata read is included).
   Never put this token in React code or commit it.
3. In Vercel project settings, add these environment variables to Development,
   Preview, and Production as needed:
   - `GITHUB_TOKEN` — the fine-grained token
   - `GITHUB_REPOSITORY` — `Sanjay-Amarnath/portfolio`
   - `GITHUB_BRANCH` — `main`
   - `FIREBASE_API_KEY` — the same Firebase Web API key as
     `REACT_APP_FIREBASE_API_KEY`
   - The existing `REACT_APP_FIREBASE_*` web-app configuration values
4. Copy `.env.example` to `.env.local` and fill in the same values locally.
   Restart the development server after changing environment variables.
   `npm start` runs Vercel's local server, which serves both the React page
   and the `api/` functions. On first use, the Vercel CLI may ask you to log
   in and link the project.

For security, the API checks the verified Firebase email, limits the accepted
asset names, file types, and sizes, and never returns the GitHub token to the
browser. The portfolio repository is public, so uploaded assets and social
links are public too.

## Browser-only resume builder

Visit `/resume` to extract text from a PDF, DOCX, or TXT resume in the browser,
or provide a JPG, PNG, or WEBP resume image for Gemini to read. Use **Extract
details with Gemini** to populate the resume form from the uploaded file; a job
description is not required for extraction. Add a target job description to
tailor the resume and compare keywords. Files are never uploaded to the
portfolio server. Choosing a Gemini action
sends the resume text or selected image, job description, and entered candidate
details directly to Google using the visitor's own API key. Image contents are
not sent until the user chooses Generate.
Create a key in [Google AI Studio](https://aistudio.google.com/app/apikey). The
key is held in page memory only. Google API quotas and terms apply. Generated
resumes must be reviewed for accuracy; AI output and keyword alignment are not
guarantees of ATS results. Skills and keywords are only added when supported
by the supplied resume or candidate details; the builder does not invent
qualifications to increase its ATS estimate.

Draft persistence is opt-in and uses this browser's local storage. It can
include extracted resume text and the job description; it is not sent to this
portfolio. The original uploaded file is not stored. Resume PDF export creates
and downloads an A4 PDF directly in the browser.

## Project case studies

The portfolio's selected work section links to individual case studies under
`/projects/<slug>`. These include the Reltime fintech products, Make My Slot's
booking flow, Hydrafacial's content and search experience, and the independent
Resume Lab. Project descriptions are based on the supplied resume; no
unprovided project metrics or client URLs are claimed.
