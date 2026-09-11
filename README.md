# RangKala Creations

Wall art studio website — Express + EJS frontend, Firebase Firestore backend.

## Local development

```bash
npm install
cp .env.example .env   # fill in real values
npm start
```

Runs at http://localhost:3000. Admin panel at `/admin/login`.

## Deployment

Deployed on Vercel (see `vercel.json`). Required environment variables:

- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Firestore
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — booking email notifications
- `ADMIN_EMAIL`, `STUDIO_PHONE`, `SITE_URL`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_URL` — image uploads
