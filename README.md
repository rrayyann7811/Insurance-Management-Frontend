# Insurance Management Frontend

## Live Demo

The Insurance Management Platform is deployed and accessible online.

**Live Website:** https://insurance-management-frontend-weld.vercel.app

### Project Repositories

- Frontend: https://github.com/rrayyann7811/Insurance-Management-Frontend
- Backend: https://github.com/rrayyann7811/Insurance-Management-Backend

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: PostgreSQL (Render)

### Test the Application

The platform supports three user roles:

1. Administrator
2. Insurance Agent
3. Customer

Customers can register and log in to manage their insurance
policies, premium payments, documents, and claims.

Administrator and insurance-agent accounts are managed
through the application.

Run `npm ci`, copy `.env.example` to `.env`, and start with `npm run dev`. Start the API separately and set `VITE_API_URL` to its URL ending in `/api`. Create a production build with `npm run build`.

## Browser checks

Start the backend with fictional demo data and run the frontend at localhost port 5173. Install Chrome and run `npm run test:browser` with the same `DEMO_PASSWORD` used for the backend seed. Set `BROWSER_BASE_URL` for a different local origin and `CHROME_PATH` to select a custom Chrome binary. The checks use all three roles and cover responsive navigation.

## Deployment

Import this repository in Vercel and set `VITE_API_URL` to the public Render API ending in `/api`. Use the resulting HTTPS frontend origin for the backend's `FRONTEND_ORIGIN`.

Run `npm run lint` and `npm test` for static and configuration checks. Set an HTTPS `VITE_API_URL` ending in `/api` for `npm run build`. For a built local preview, run `npm run build -- --mode development`. The browser workflow creates and archives fictional records. Point it only at a dedicated development or test database.

## Project documentation

This frontend is part of the Insurance Management Platform internship project. Premium payment confirmation is simulated.

- [Backend installation and source](https://github.com/rrayyann7811/Insurance-Management-Backend)
- [Seven-day roadmap](https://github.com/rrayyann7811/Insurance-Management-Backend/blob/main/docs/DEVELOPMENT_ROADMAP.md)
- [Testing report](https://github.com/rrayyann7811/Insurance-Management-Backend/blob/main/docs/TESTING_REPORT.md)
- [API reference](https://github.com/rrayyann7811/Insurance-Management-Backend/blob/main/docs/API_DOCUMENTATION.md)
- [Full deployment guide](https://github.com/rrayyann7811/Insurance-Management-Backend/blob/main/docs/DEPLOYMENT_GUIDE.md)
