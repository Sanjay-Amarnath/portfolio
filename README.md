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

The resume admin page is available at `/admin`. It uses Google sign-in and
allows only `sanjaymrnth@gmail.com` to upload a PDF to Firebase Storage. The
portfolio's **Download CV** button loads `resumes/current.pdf` from Storage and
uses the checked-in PDF as a fallback until that object is available. Uploading
to the same Storage path replaces the currently served resume.

### Firebase setup

1. Create a Firebase project and register a web app. Enable **Google** in
   Firebase Authentication's sign-in providers, and add the portfolio domain
   (and `localhost` for local development) to the authorized domains.
2. Enable Firebase Storage.
3. Copy `.env.example` to `.env.local` and fill in the web app's Firebase
   configuration values. Set the same `REACT_APP_FIREBASE_*` variables in the
   deployment environment before building.
4. Apply the Storage rules in `storage.rules` to the project's default bucket.
   You can deploy them with the Firebase CLI after selecting the project:
   `firebase deploy --only storage --project YOUR_FIREBASE_PROJECT_ID`.

The rules make the current resume publicly readable for portfolio visitors,
while requiring a verified Google account with the exact administrator email
for writes. They accept only PDFs up to 10 MB at the single resume path. The
admin page also stores public social URLs at `settings/social-links.json`;
only that verified administrator can update them.
