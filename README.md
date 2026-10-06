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

The resume admin page is available at `/admin`. It uses Firebase Google
sign-in and allows only `sanjaymrnth@gmail.com` to replace files in Firebase
Storage. The portfolio Resume link reads `resumes/current.pdf`, and falls
back to the checked-in `public/data/Resume.pdf` until an uploaded resume is
available. The profile image and social links are stored in Firebase Storage
as `images/profile` and `settings/social-links.json`.

### Firebase setup

1. Register a Firebase web app. Enable **Google** in Firebase Authentication's
   sign-in providers, then add the portfolio domain and `localhost` to the
   authorized domains.
2. Enable Firebase Storage.
3. Copy `.env.example` to `.env.local` and fill in the Firebase web app
   configuration values. Set the same `REACT_APP_FIREBASE_*` variables in
   Vercel's project settings for deployed builds.
4. Apply `storage.rules` to the Firebase Storage bucket. You can deploy the
   rules with the Firebase CLI after selecting the project:
   `firebase deploy --only storage --project YOUR_FIREBASE_PROJECT_ID`.

The rules allow public reads of the portfolio assets and writes only from the
verified administrator account. Resume uploads accept PDFs up to 10 MB;
profile-image uploads accept JPEG, PNG, or WebP up to 5 MB. Social links are
written as a small JSON file. Uploading to each fixed path replaces the
previous asset.
