# Firebase Migration

This repo is now set up to replace the Render + Prisma + tRPC backend with:

- Firebase Authentication
- Cloud Firestore
- Cloud Functions
- Firebase Storage
- Firebase Hosting

## Firebase Console Setup

1. Open the Firebase console for `voting-app-36cd8`.
2. In `Build > Authentication > Sign-in method`:
   - enable `Email/Password`
   - enable `Anonymous`
3. In `Build > Firestore Database`:
   - create the database in production mode
   - choose the same region you want for Functions
4. In `Build > Storage`:
   - create the default bucket
5. In `Build > Functions`:
   - upgrade billing if Firebase requires it for Functions deployment
6. In `Project settings > General`:
   - confirm the web app matches the env values in [client/.env.example](/Users/Opu/Projects/voting-app/client/.env.example)

## Initial Auth Setup

Create your admin staff users in Firebase Auth:

1. Open `Authentication > Users`
2. Click `Add user`
3. Create the staff emails and passwords you want to use

Recommended starter accounts:

- `admin@mail.com`
- `test@mail.com`

The first time each staff user signs in through the app, a matching `staff` document is created automatically.

## Firestore Structure

- `staff`
- `devices`
- `elections`
- `elections/{electionId}/panels`
- `elections/{electionId}/roster`
- `elections/{electionId}/ballots`

## Frontend Env Vars

Add these to Netlify or Firebase Hosting environment handling:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_FIREBASE_FUNCTIONS_REGION`

You can copy the current values from [client/.env.example](/Users/Opu/Projects/voting-app/client/.env.example).

## Local Setup

1. Install the Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Log in:

```bash
firebase login
```

3. From the repo root, build everything:

```bash
npm run build:firebase
```

4. Deploy everything:

```bash
npm run deploy:firebase
```

## Deploy Options

Deploy frontend hosting only:

```bash
npm run deploy:firebase:hosting
```

Deploy Functions + Firestore + Storage rules only:

```bash
npm run deploy:firebase:functions
```

## Notes

- The existing `server/` directory is still present during the migration.
- The active client data path is now Firebase-backed.
- Firebase Hosting is configured through [firebase.json](/Users/Opu/Projects/voting-app/firebase.json) to serve `client/dist` with SPA rewrites.
- Cloud Functions scaffolding is in [functions/src/index.ts](/Users/Opu/Projects/voting-app/functions/src/index.ts).
