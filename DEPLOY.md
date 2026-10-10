# Putting SchoolOS online

Three parts, three services:

| Part | Where | Why |
|---|---|---|
| Website (`frontend/`) | **Vercel** | Built for Next.js; free tier is enough |
| API (`backend/`) | **Render** (Starter plan, ~$7/month) | Keeps a server running all the time, with a disk for uploaded pictures and textbook PDFs, and runs the daily homework reminder |
| Database | **MongoDB Atlas** | Your data, in the cloud. Free tier (512 MB) to start |

The website forwards `/api` and `/uploads` to the API, so visitors only ever
see one address and login cookies work. Textbook PDFs are the one exception:
they are too big for Vercel's forwarder (about 4.5 MB per request), so the
admin's browser sends them straight to the API with a 10-minute upload token.

---

## 1. Database: MongoDB Atlas

1. Create a free account at <https://www.mongodb.com/atlas> and a free **M0** cluster.
2. **Database Access** → add a user with a strong password.
3. **Network Access** → add `0.0.0.0/0` (Render's addresses change).
4. **Connect → Drivers** → copy the connection string and put the database
   name in it:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/schoolos`

### Move your current data (optional)

Your local data is in `mongodb://localhost:27017/schoolos`. The MongoDB tools
are already installed in `C:\Program Files\MongoDB\Tools\100\bin`:

```bash
mongodump --uri "mongodb://localhost:27017/schoolos" --out ./schoolos-dump
mongorestore --uri "mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net" ./schoolos-dump
```

Or start fresh: after step 2, run `npm run seed` once from Render's **Shell** tab.

Uploaded files are not in the database. After moving, upload the logo and
carousel pictures again (**Admin → Settings → Website pictures**) and the
textbook PDFs again (**Admin → Textbooks**).

## 2. API: Render

1. Push this repository to GitHub.
2. Render → **New → Blueprint** → choose the repository. It reads `render.yaml`.
3. Fill in the values it asks for:
   - `MONGODB_URI`: the Atlas string from step 1
   - `GEMINI_API_KEY`: your Gemini key (for AI Learning)
   - `FRONTEND_URL`: leave as `https://example.com` for now; fix it in step 4
4. Deploy. When it's live, open `https://<your-api>.onrender.com/api/health`
   and you should see `"SchoolOS API running"`.

`JWT_SECRET` is generated for you. The server refuses to start in production
without a long secret.

## 3. Website: Vercel

1. Vercel → **Add New → Project** → import the repository.
2. **Root Directory**: `frontend`.
3. **Environment Variables** (replace with your Render address):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `/api` |
   | `API_PROXY_TARGET` | `https://schoolos-api.onrender.com` |
   | `NEXT_PUBLIC_DIRECT_API_URL` | `https://schoolos-api.onrender.com/api` |

4. Deploy.

## 4. Connect the two

In Render → your service → **Environment**, set `FRONTEND_URL` to the Vercel
address (e.g. `https://schoolos.vercel.app`) and save. Render restarts the API.
To also allow a custom domain, separate them with commas:
`https://schoolos.vercel.app,https://www.school.edu.bd`.

## 5. Check

- The homepage shows the school name, achievements and news.
- Log in as admin, open a few pages, log out.
- Upload a logo in Settings; it appears on the homepage.
- Upload a textbook in Admin → Textbooks; a student can open it in the Library.

---

## Good to know

- **Request time limit:** Vercel's forwarder gives up after 30 seconds. Normal
  pages take well under a second; a very slow AI answer is the only thing that
  could come close.
- **Rate limits** (20 logins per 15 minutes, 200 API requests per minute) count
  per visitor IP. `TRUST_PROXY=2` tells the API to read the visitor's real IP
  through Vercel and Render. If the whole school shares one internet connection,
  everyone counts as one visitor; raise the limits in
  `backend/src/middleware/rateLimiter.js` if people see "Too many requests".
- **Atlas free tier is 512 MB.** Textbook text for AI Learning is the largest
  part of the data; move to a paid tier if you upload many books.
- **Local development is unchanged:** without the variables above, the website
  calls `http://localhost:5000/api` directly as before.
