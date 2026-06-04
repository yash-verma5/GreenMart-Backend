# My Learnings

Today I took an older full-stack project and brought it online as a working showcase without changing the core business logic.

## What I Deployed

The final showcase stack is:

```txt
Frontend: Cloudflare Pages
Backend: Render
Database: TiDB Cloud
Source Control: GitHub personal forks
Deployment Branch: deploy/showcase
```

The backend is live on Render, the frontend is live on Cloudflare Pages, and the hosted TiDB database has demo users, categories, products, approvals, and reviews.

## Frontend Deployment

I learned that a Vite React frontend can be deployed as a static site.

For Cloudflare Pages, the important settings were:

```txt
Build command: npm run build
Build output directory: dist
Environment variable: VITE_API_URL
```

The deployed frontend needs:

```txt
VITE_API_URL=https://greenmart-backend-1-5bnj.onrender.com/api/v1
```

I also learned that Vercel and Cloudflare handle SPA routing differently. `vercel.json` works for Vercel, but Cloudflare Pages needs:

```txt
public/_redirects
```

with:

```txt
/* /index.html 200
```

This prevents refresh/deep-link 404 errors in React Router routes.

## Backend Deployment

I learned how to make a Spring Boot backend deployment-friendly without changing application logic.

Important backend env variables:

```txt
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
CORS_ALLOWED_ORIGINS
```

Render also provides a dynamic port, so the backend needs:

```properties
server.address=0.0.0.0
server.port=${PORT:8080}
```

Render did not show Java in the runtime list, so I used Docker. The Dockerfile builds the Spring Boot jar with Java 17 and runs the packaged app.

## Database And Secrets

I learned that hosted database credentials should not be committed to GitHub.

For local testing with TiDB, I used:

```txt
src/main/resources/application-local.properties
```

and kept it ignored by Git.

In production, the same values go into Render environment variables instead of source code.

## CORS

I learned that deployed frontends and local frontends have different origins.

To allow both local development and the deployed frontend, Render uses:

```txt
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://greenmart-frontend.pages.dev
```

Without this, the frontend may load but API calls can fail in the browser.

## Demo Data Seeding

I learned that API-based seeding is safer than direct SQL for this app because:

- Passwords need to be encoded by the backend.
- Products need vendor ownership.
- Products can move through approval status.
- Reviews need customer ownership.
- Seeding through APIs follows the app's actual logic.

I created reusable seed files:

```txt
scripts/demo-seed.json
scripts/seed-demo.mjs
```

The JSON file can be edited later to add more demo users, categories, products, and reviews.

The script can be rerun with:

```bash
node scripts/seed-demo.mjs
```

or against another backend:

```bash
BACKEND_URL=https://some-backend-url node scripts/seed-demo.mjs
```

## Demo Accounts

```txt
Admin: admin@greenmart.demo / Admin@123
Vendor: vendor@greenmart.demo / Vendor@123
Customer: customer@greenmart.demo / Customer@123
```

## GitHub And Deployment UI

I learned that Vercel automatically creates GitHub deployment records, while Cloudflare Pages may not show in the GitHub deployments tab in the same way.

To make GitHub show a Cloudflare deployment record, I added a GitHub Actions workflow that creates a deployment status pointing to the Cloudflare Pages URL.

I also learned that Vercel GitHub App access can be limited to selected repositories, so Vercel does not keep creating deployment records for repos that now deploy elsewhere.

## Free Tier Tradeoffs

This setup is good for a showcase, but it has free-tier tradeoffs:

- Render Free can sleep after inactivity.
- First backend request after sleep can be slow.
- Some routes may feel delayed by 1-2 seconds.
- Remote images can add visible loading delay.

For a portfolio/demo, this is acceptable. For production, an always-on backend plan would be better.

## Final Takeaway

The biggest lesson was that deployment is not only "uploading code." It also includes:

- Choosing the right hosting model for frontend and backend.
- Moving secrets into environment variables.
- Handling CORS between deployed services.
- Making routes work on static hosting.
- Seeding realistic demo data.
- Cleaning old deployment integrations.

This project went from an empty cloud database and confusing old Vercel setup to a working full-stack online showcase.
