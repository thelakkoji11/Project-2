<<<<<<< HEAD
# Craft Studio API: DecodeLabs Project 2 (Backend API Development)

A small REST API in **Node.js + Express** that powers the Project 1 frontend.
Data is kept in memory (resets on restart); a later project can swap in a real database via `src/store.js`.

## Run it
```bash
npm install
npm start          # http://localhost:3000  (frontend + API)
npm test           # 12 automated tests
```
Requires Node 18+. Open http://localhost:3000 for the site; it loads guides from the API and posts the contact form to it.

## How it maps to the brief
| Requirement | Where |
|---|---|
| Create API endpoints (GET / POST) | `src/app.js` (plus PUT and DELETE) |
| Handle user input and responses | JSON in, JSON out, `express.json` with a 10kb limit |
| Validate basic data | `src/validators.js` (syntactic: types, formats; semantic: ranges, allowed topics) |
| RESTful naming | Resources are nouns, methods are verbs: `/api/guides`, `/api/guides/:id` |
| Semantic status codes | 200, 201, 204, 400, 404, 413, 429, 500 |
| Resilience | Malformed JSON gives 400, central error handler gives a safe 500, rate limiting, graceful shutdown |
| Documentation | This file, with copy-paste examples |

## Endpoints
| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/api/health` | 200 | |
| GET | `/api/guides?topic=css` | 200 | 400 bad topic |
| GET | `/api/guides/:id` | 200 | 400 bad id, 404 |
| POST | `/api/guides` | 201 + `Location` header | 400 validation |
| PUT | `/api/guides/:id` | 200 | 400, 404 |
| DELETE | `/api/guides/:id` | 204 | 400, 404 |
| POST | `/api/messages` | 201 | 400 validation |
| any | `/api/*` unknown | | 404 JSON |
| any | over 100 requests/min per IP | | 429 + `Retry-After` |

### Guide object
```json
{ "id": 1, "topic": "html", "icon": "🏗️", "title": "Semantic Landmarks", "text": "..." }
```
Rules: `title` 3-80 chars, `text` 10-300 chars, `topic` one of `html | css | js | design`, `icon` optional short emoji.

### Error format (always the same shape)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid guide data.",
             "details": [ { "field": "title", "message": "title must be 3-80 characters." } ] } }
```

## Try it (copy and paste)
```bash
# list, filter, fetch one
curl http://localhost:3000/api/guides
curl "http://localhost:3000/api/guides?topic=css"
curl http://localhost:3000/api/guides/1

# create (201)
curl -i -X POST http://localhost:3000/api/guides -H "Content-Type: application/json" \
  -d '{"title":"HTTP Status Codes","text":"Use semantic codes so clients never guess.","topic":"js"}'

# invalid (400)
curl -X POST http://localhost:3000/api/guides -H "Content-Type: application/json" -d '{"title":"x"}'

# update and delete
curl -X PUT http://localhost:3000/api/guides/1 -H "Content-Type: application/json" -d '{"title":"Semantic HTML5 Landmarks"}'
curl -i -X DELETE http://localhost:3000/api/guides/1

# contact form
curl -X POST http://localhost:3000/api/messages -H "Content-Type: application/json" \
  -d '{"name":"Riya","email":"riya@example.com","message":"Loved the guides, thanks!"}'
```
PowerShell users: use `curl.exe` (not `curl`), or `Invoke-RestMethod`.

## Project layout
```
src/server.js      start-up + graceful shutdown
src/app.js         routes, error handling, static frontend
src/validators.js  "Never trust the client" gatekeeper
src/rateLimit.js   429 protection
src/store.js       in-memory data layer
test/api.test.js   12 tests (node:test, no extra libraries)
public/            Project 1 frontend, now API-powered
```

## Submission steps
1. `git add .`, `git commit -m "Project 2: backend API"`, then push. `.gitignore` keeps `node_modules` out.
2. Deploy the API (Render or Railway have free tiers; start command `npm start`). GitHub Pages cannot run Node, so it only suits the static Project 1.
3. Submit the repo link, the live API URL, and screenshots of requests showing 200, 201, 400, 404 and 429.
=======
# Project-2
>>>>>>> e16a9d0918ed9ec2366e0a51a9646c2c9e21b11e
