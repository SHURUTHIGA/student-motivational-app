# GITHUB WORKFLOW & DOCUMENTATION

## Project
Student Motivation App (Frontend)

## Tech Stack
- React (Create React App)
- React Router
- Fetch API for backend integration

## Main Features
- User Registration and Login
- Student Tracker form for motivation analysis
- Teacher Dashboard with records and recommendations
- Purple themed UI updates

## Folder Structure
- `src/components` reusable UI components
- `src/pages` page-level components (`Home`, `Register`, `Login`, `Tracker`, `Dashboard`, `About`)
- `src/index.css` global styling and theme
- `src/App.js` routes and protected route wrappers

## Run Locally
1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm start`
3. Build production bundle:
   - `npm run build`

## Backend Requirement
Frontend uses:

- `http://localhost:5000` in local development through the CRA proxy
- `REACT_APP_API_BASE_URL` in deployed environments such as Vercel

Required endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/analyses`
- `GET /api/records`
- `GET /api/records/:id`

## Deployment

Recommended production setup:

- Frontend: Vercel
- Backend: Railway

Frontend environment variables:

```env
REACT_APP_API_BASE_URL=https://your-railway-backend.up.railway.app
REACT_APP_DEFAULT_INSTITUTION_ID=astra
```

Backend environment variables:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
TEACHER_EMAIL=teacher@gmail.com
TEACHER_PASSWORD=teacher123
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

Files added for deployment:

- `frontend/vercel.json`
- `railway.json` at the repository root

## GitHub Workflow
Run these commands inside the `frontend` folder.

1. Check status:
   - `git status`
2. Add files:
   - `git add .`
3. Commit:
   - `git commit -m "Update UI, dashboard, auth pages, and documentation"`
4. Create GitHub repo (if not created yet), then add remote:
   - `git remote add origin <YOUR_GITHUB_REPO_URL>`
5. Push:
   - `git push -u origin master`

If your default branch is `main`, use:
- `git branch -M main`
- `git push -u origin main`

## Notes
- Keep backend running before testing login/registration/analysis flows.
- Use `npm run build` before pushing major UI changes.
