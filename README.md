# Insurance Management Frontend

Run `npm ci`, copy `.env.example` to `.env`, and start with `npm run dev`. Start the API separately and set `VITE_API_URL` to its URL ending in `/api`. Create a production build with `npm run build`.

## Browser checks

Start the backend with fictional demo data and run the frontend at localhost port 5173. Install Chrome and run `npm run test:browser` with the same `DEMO_PASSWORD` used for the backend seed. Set `BROWSER_BASE_URL` for a different local origin and `CHROME_PATH` to select a custom Chrome binary. The checks use all three roles and cover responsive navigation.

## Deployment

Import this repository in Vercel and set `VITE_API_URL` to the public Render API ending in `/api`. Use the resulting HTTPS frontend origin for the backend's `FRONTEND_ORIGIN`.

Run `npm run lint` and `npm test` for static and configuration checks. Set an HTTPS `VITE_API_URL` ending in `/api` for `npm run build`. For a built local preview, run `npm run build -- --mode development`. The browser workflow creates and archives fictional records. Point it only at a dedicated development or test database.
