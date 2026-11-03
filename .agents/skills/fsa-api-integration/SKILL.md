---
name: fsa-api-integration
description: Build and maintain applications that use the UK Food Standards Agency Food Hygiene Rating Scheme (FHRS) API. Use when implementing API requests, search, pagination, bulk data ingestion, caching, or user-facing displays of hygiene ratings.
---

# Food Hygiene Ratings API Integration

Help developers integrate with the Food Standards Agency (FSA) Food Hygiene Rating Scheme API accurately, efficiently, and in a way that represents its data fairly.

## Core instructions

- Treat the official API documentation as the source of truth. Check the current endpoint index, version, data terms, and status notices before relying on assumptions.
- Use the API over HTTPS: `https://api.ratings.food.gov.uk/`.
- Include the required `x-api-version` header on every API request. Use version `2` when following the current V2 documentation.
- The API currently requires no registration or API key, but this may change; check the official documentation rather than hard-coding this assumption into long-lived guidance.
- Follow the API’s terms and conditions for data and rating images.
- Do not invent endpoint paths, query parameters, response fields, or data meanings. Consult the endpoint index and match the API version in use.
- Make examples language-appropriate and safe for production: validate inputs, encode query parameters, handle errors, and avoid logging sensitive user data.

## Choosing a data access approach

- For a user searching for a business or retrieving a small number of records, use the API’s `Establishments` search or establishment-detail endpoints.
- For regular full downloads of local-authority data, prefer the Open Data files over repeatedly retrieving the same data through the API. The files are updated nightly.
- Obtain Open Data file URLs from the local-authority endpoint rather than hard-coding them; URLs may change.
- Use the Open Data file’s `extractDate` to identify whether data has changed and avoid unnecessary processing.

## Requests and search

- Use the `x-api-version: 2` header. The API supports English and Welsh responses; use `Accept-Language: cy-GB` when Welsh is required. English is the default.
- Use the documented `Establishments` search parameters, such as name, address, location, business type, scheme type, rating, local authority, country, sorting, and pagination.
- URL-encode query parameter values. Do not concatenate untrusted search text directly into a URL.
- Use lookup endpoints, such as authorities and business types, when an endpoint expects an API identifier. Do not guess IDs or embed changeable lookup values in code unnecessarily.
- Store the establishment’s API identifier for later retrieval, but do not treat a name or address as a reliable unique identifier. Confirm a search match using available details such as address and postcode.

Example: a JSON search request in JavaScript.

```javascript
const API_BASE = "https://api.ratings.food.gov.uk";

async function searchEstablishments(name, { pageNumber = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    name,
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });

  const response = await fetch(`${API_BASE}/Establishments?${params}`, {
    headers: {
      "x-api-version": "2",
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`FHRS API request failed with HTTP ${response.status}`);
  }

  return response.json();
}
```

Confirm the endpoint and response shape against the current API index before adapting this example. For browser applications, check whether the API permits the required cross-origin requests; if not, make requests from your server.

## Pagination, flow control, and failures

- For bulk retrieval through the API, use multiple paged requests with a page size of **200 or less**. Do not try to retrieve a large dataset in one oversized request.
- Avoid bursts and unnecessary concurrent requests. Use configurable flow control so request pacing can be adjusted if service conditions or throttling guidance changes.
- Handle HTTP errors explicitly. In particular, a `429` response indicates throttling; back off before retrying and reduce request pressure. Do not retry continuously or immediately in a tight loop.
- Schedule bulk retrieval between **01:00 and 06:00** where practical, to avoid busier periods. Scheduling it overnight does not remove throttling limits or solve `403`/`429` responses.
- Add reasonable timeouts and limited retries for transient failures. Do not retry permanent client errors indefinitely.
- Make bulk jobs resumable and idempotent where possible, so a failed run can continue without repeatedly processing all records.

## Displaying and interpreting the data

- Present the rating or inspection result as supplied by the API. Do not convert a missing value into a rating of `0`, invent a composite score, or label a business “unsafe” based solely on the API result.
- Handle ratings, statuses, and scheme types as distinct data. Do not assume every record has a numeric rating or the same fields.
- Display the inspection or visit date alongside the rating when available. A rating describes the hygiene standards observed on that date; it is not a live guarantee of current conditions.
- Do not describe a hygiene rating as a measure of food quality.
- Where the record provides a status rather than a rating, display the status clearly rather than hiding it or substituting a score.
- Do not assume optional fields—such as address, geolocation, or score breakdowns—are present for every record.
- If using official rating images, use the current images and follow their terms and relevant brand guidance. Do not stretch, recolour, or otherwise alter them unless the applicable guidance permits it.
- Link users to the official record where appropriate. For questions or corrections about an individual business, direct users to the relevant local authority.

## Caching and refreshes

- Choose a cache lifetime appropriate to the application’s needs and make the data’s update timing clear to users.
- For nightly Open Data refreshes, use `extractDate` to avoid reprocessing unchanged local-authority data.
- Do not claim that a cached result is current unless its refresh time supports that claim.
- Provide a way to refresh or re-fetch records when users need the latest available information.

## Before delivering an implementation

Check that:

1. Every request includes the required API-version header.
2. Endpoint paths, parameters, and response fields match the current API documentation.
3. Search inputs are encoded and errors, timeouts, and throttling are handled.
4. Bulk retrieval uses Open Data files where suitable, or paging at 200 or fewer with flow control.
5. Records with missing, non-numeric, or status-based results are represented accurately.
6. The interface shows the inspection date when available and does not imply the rating measures food quality or guarantees current conditions.
7. Data and rating images are used in line with current terms and guidance.

## Official documentation

- API help and getting started: https://api.ratings.food.gov.uk/help
- V2 endpoint index: https://api.ratings.food.gov.uk/Help/Index
- API best practices: https://api.ratings.food.gov.uk/Help/BestPractices
- FSA information about the data, Open Data downloads, terms, and rating images: https://ratings.food.gov.uk/open-data
- Official ratings search: https://ratings.food.gov.uk/
