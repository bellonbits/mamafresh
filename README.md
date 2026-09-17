This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

MamaFresh is a Supabase-backed marketplace for customers, sellers, and admins.

## Supabase setup

1. Copy `.env.local.example` to `.env.local` and set the Supabase project values.
2. Run `supabase/schema.sql` in the Supabase SQL Editor. This creates profiles, sellers, products, addresses, orders, favorites, assistant messages, RLS policies, and realtime publications.
3. Create the first account through `/register`, then set its profile role to `admin` in Supabase before opening `/admin`.
4. Add product and seller rows in Supabase. The remaining catalog views still contain legacy presentation fixtures and must be migrated to live rows before production use.

The Groq credential is server-only (`GROQ_API_KEY`); do not use a `VITE_` or `NEXT_PUBLIC_` prefix for it. Rotate the API key shared during setup before deployment.

## Learn More

To learn more about Next.js, take a look at the following resources:


You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
