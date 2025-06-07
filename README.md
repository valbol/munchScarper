## Overview

Web scraping service using Express, BullMQ, Redis and MongoDB. The service exposes a single endpoint to enqueue scraping jobs and process them asynchronously with caching using NX - not to trigger redundant calls, and not get into race conditions.
We expose another endpoint for /events to get SSE status update on the scraping the client get notification on the job statuses once he connects to the route.
The job worker starts automatically in server.ts via initWorker(), processing queued scrape requests.

I added a check for robots.txt to verify that scarping is allowed.
my schema to scrape the site as its a summary, and in order not to get into spider webs is
by the summery type, that way i get the most important summarized info to undersant what is about
view the types/summary.ts.

## Setup

1. **Clone the repository**
   git clone git@github.com:valbol/munchScarper.git && cd scraper-service

2. **Copy environment template**
   Edit `.env` with the data sent in mail.

3. **Spin up services via Docker Compose**
   docker-compose up -d

## Running the Application

**Development Mode**
npm run dev

**Production Mode**
npm run build
npm start

## API Usage

**Endpoint**:
`GET /events`, - provide SSE to see status and data
`POST /scrape`
body: { "url": "https://example.com" } - engage the scraper

**Response**:

- `202 Accepted` when the job is successfully queued.
- `400 Bad Request` for invalid URL.
- `500 Internal Server Error` for processing errors.
- `403 Forbbiden` for crawling disallowed sites by robots.txt

## Data verification

docker exec -it munch-mongo-1 mongosh scraperdb
show collections
db.summaries.find().pretty()

## Unit Testing

npm test
