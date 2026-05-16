# Paperspine

A bookshelf cataloguing app. Photograph your bookshelves, extract and enrich book metadata using AI, then browse your collection through a web frontend.

## Architecture

```
packages/
├── shared/     — TypeScript types shared across all packages
├── frontend/   — React Vite SPA (browse, search, filter books)
├── ingest/     — Express server (photo upload, AI extraction, AWS upload)
└── infra/      — CDK stack (DynamoDB, S3, CloudFront, API Gateway, Lambda)
```

## Prerequisites

- Node.js 20+
- An AWS account with credentials configured (`aws configure`)
- An [Anthropic API key](https://console.anthropic.com/) for the ingest tool

## Setup

```sh
npm install
```

## Running locally

### Frontend (browse your catalogue)

```sh
npm run dev -w @paperspine/frontend
```

Set `VITE_API_URL` to your deployed API Gateway URL (from `cdk deploy` output) before running, or leave empty for relative paths if proxying.

### Ingest tool (add books)

```sh
export ANTHROPIC_API_KEY=sk-ant-...
npm run dev -w @paperspine/ingest
```

Open http://localhost:3001 — drag and drop a bookshelf photo to extract books.

To upload to AWS, also set:

```sh
export AWS_REGION=eu-west-2
export BOOKS_TABLE_NAME=PaperspineStack-BooksTable...
export SHELVES_TABLE_NAME=PaperspineStack-ShelvesTable...
export IMAGES_BUCKET_NAME=paperspinestack-imagesbucket...
```

(Get these values from `cdk deploy` outputs or the AWS console.)

## Deploying to AWS

```sh
cd packages/infra

# First time only — bootstrap CDK in your account/region
npx cdk bootstrap

# Build the frontend (CDK deploys it to S3/CloudFront)
npm run build -w @paperspine/frontend

# Deploy everything
npx cdk deploy
```

Outputs:
- **ApiUrl** — the REST API base URL
- **DistributionUrl** — the CloudFront URL serving the frontend

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /books | List books (query params: `tag`, `shelf`, `author`, `q`) |
| GET | /books/:id | Get a single book |
| GET | /tags | List all tags |
| GET | /shelves | List all shelves |

## Ingest workflow

1. Upload a bookshelf photo via the web UI
2. Claude Vision extracts visible books (title, author, confidence)
3. Each book is enriched via Open Library (ISBN, cover, description)
4. Claude generates normalised tags (genre, theme, mood)
5. Review and edit the results — fix titles, remove false positives, add missed books
6. Confirm to upload metadata to DynamoDB and covers to S3

## Running tests

```sh
# All tests
npm test -w @paperspine/infra
npm test -w @paperspine/ingest

# Type checking
npm run typecheck -w @paperspine/frontend
npm run typecheck -w @paperspine/ingest
npm run typecheck -w @paperspine/infra
```

## Project structure

| Package | Purpose |
|---------|---------|
| `@paperspine/shared` | `Book`, `Shelf`, `Tag` types and API response shapes |
| `@paperspine/frontend` | React SPA — grid view, search, filters, book detail modal |
| `@paperspine/ingest` | Express server — photo upload, vision extraction, enrichment, AWS upload |
| `@paperspine/infra` | CDK — DynamoDB tables, S3 buckets, CloudFront, API Gateway, Lambda handlers |
