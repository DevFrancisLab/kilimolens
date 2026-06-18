# Deploying `frontend` to Vercel (static build)

This project uses Vite. The easiest way to deploy to Vercel is as a static Single Page App (SPA).

Steps

1. From the `frontend` folder, ensure dependencies are installed and build succeeds:

```bash
cd frontend
npm install
npm run build
```

2. Locally preview the production build:

```bash
npm run preview
```

3. Create a new project on Vercel and point it to this repository (or use the Vercel CLI):

Using the CLI (optional):

```bash
npm i -g vercel
vercel login
cd frontend
vercel --prod
```

Vercel will run `npm install` and `npm run build`. The `vercel.json` routes the app to `index.html` so client-side routing works.

Notes

- This config deploys the app as a static SPA. If you need SSR (Nitro / TanStack Start server) on Vercel, let me know and I can add a Nitro/Vercel build target and serverless function configuration instead.
- If you use `bun` on CI, ensure Vercel uses `npm`/`node` or add a custom `install` command in the Vercel project settings.
