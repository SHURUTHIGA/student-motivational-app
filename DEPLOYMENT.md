# Deployment Guide

This project is set up to deploy as:

1. `frontend` on Vercel
2. `backend` on Railway

The repo now includes:

- `frontend/vercel.json` for the React frontend
- `railway.json` for the Railway backend deployment

## Railway Backend

Railway can deploy this monorepo from the repository root because `railway.json` runs the backend with:

- install: `npm --prefix backend install`
- start: `npm --prefix backend start`
- health check: `GET /api/health`

Required environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN=1d`
- `TEACHER_EMAIL`
- `TEACHER_PASSWORD`
- `CORS_ORIGIN`

Optional environment variables:

- `PORT`
- `FRONTEND_URL`

Example Railway variables:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
TEACHER_EMAIL=teacher@gmail.com
TEACHER_PASSWORD=teacher123
CORS_ORIGIN=https://your-frontend-domain.vercel.app
PORT=5000
```

Notes:

- `CORS_ORIGIN` can contain multiple domains separated by commas.
- Railway usually injects `PORT` automatically, so you normally do not need to set it manually.
- Local JSON fallback exists, but production should use MongoDB because Railway containers do not keep local files permanently.

## Vercel Frontend

Deploy the `frontend` folder as the Vercel project root.

`frontend/vercel.json` handles:

- `npm install`
- `npm run build`
- publishing the CRA `build` folder
- rewriting all routes to `index.html` so React Router works on refresh

Required environment variables:

- `REACT_APP_API_BASE_URL`
- `REACT_APP_DEFAULT_INSTITUTION_ID=astra`

Example Vercel variables:

```env
REACT_APP_API_BASE_URL=https://your-railway-backend.up.railway.app
REACT_APP_DEFAULT_INSTITUTION_ID=astra
```

## Deployment Order

1. Create a MongoDB database, such as MongoDB Atlas.
2. Deploy the backend to Railway.
3. Confirm the backend health endpoint works:
   `https://your-railway-backend.up.railway.app/api/health`
4. Deploy the frontend to Vercel from the `frontend` directory.
5. Set `REACT_APP_API_BASE_URL` in Vercel to the Railway backend URL.
6. Update `CORS_ORIGIN` in Railway to the Vercel domain.
7. Redeploy if needed, then test register, login, tracker, and dashboard flows.

## API Paths Used By The Frontend

The frontend calls these backend routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/analyses`
- `GET /api/records`
- `GET /api/records/:id`

## Quick Setup Summary

1. Push this repo to GitHub.
2. Import the repo into Railway and keep the repo root as the service root.
3. Import the same repo into Vercel and set the root directory to `frontend`.
4. Copy the Railway public URL into Vercel as `REACT_APP_API_BASE_URL`.
5. Copy the Vercel domain into Railway as `CORS_ORIGIN`.
