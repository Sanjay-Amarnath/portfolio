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

## Portfolio admin

Visit `/admin` to replace the resume PDF and profile image (any image format
the browser can decode; images are converted to PNG), edit social links,
and add or edit portfolio case studies. Project updates are reflected on the
home page and `/projects` after deployment. A successful save commits to the
repository; Vercel publishes it when the resulting deployment finishes.

Configure Google sign-in in Firebase and add these web-app values to the
frontend environment (for local development, use an untracked `.env` file):
`REACT_APP_FIREBASE_API_KEY`, `REACT_APP_FIREBASE_AUTH_DOMAIN`,
`REACT_APP_FIREBASE_PROJECT_ID`, and `REACT_APP_FIREBASE_APP_ID`.
`REACT_APP_FIREBASE_MESSAGING_SENDER_ID` is optional. Enable the Google
provider and authorize the local/deployed domains in Firebase Authentication.
Only the verified `sanjaymrnth@gmail.com` account can save changes.

The Vercel API also needs `GITHUB_TOKEN` configured as a server-only
environment variable with Contents write access to the portfolio repository.
`GITHUB_REPOSITORY` defaults to `Sanjay-Amarnath/portfolio`; `GITHUB_BRANCH`
defaults to `main`. The API checks the Firebase ID token again before writing,
so do not expose the GitHub token in a `REACT_APP_*` variable or remove the
server-side authorization. The repository and its published assets are public.

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
unprovided project metrics or client URLs are claimed. Projects are loaded
from `public/data/projects.json`; authorized changes made in `/admin` update
that file and appear after deployment.
