# Portfolia

This directory is a brief example of a [Create React App](https://github.com/facebook/create-react-app) site that can be deployed to Vercel with zero configuration.

## Deploy Your Own

Deploy your own Create React App project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/vercel/tree/main/examples/create-react-app&template=create-react-app)

_Live Example: https://create-react-template.vercel.app/_

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

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
   For local upload testing, stop `npm start` and run `npm run dev:vercel`.
   This starts Vercel's local server, which serves both the React page and the
   `api/` functions. On first use, the Vercel CLI may ask you to log in and link
   the project. `npm start` alone serves only the React page, so `/api/*`
   requests return 404.

For security, the API checks the verified Firebase email, limits the accepted
asset names, file types, and sizes, and never returns the GitHub token to the
browser. The portfolio repository is public, so uploaded assets and social
links are public too.
