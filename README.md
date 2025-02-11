# Food Hygiene Rating Scheme Static Site Generator

A static site generator that creates HTML pages from the UK Food Hygiene Rating
Scheme (FHRS) API data.

## Features

- Fetches data from FHRS API for all local authorities
- Generates individual HTML pages for each establishment
- Creates a sitemap for SEO
- Handles both English and Scottish rating schemes (FHRS/FHIS)
- Supports concurrent processing for faster generation
- Includes rating images and geolocation links

## Prerequisites

- [Deno](https://deno.land/) v2.1 or higher
- Git
- Docker (optional, for development container)

## Installation

```bash
# Clone the repository
git clone https://github.com/food-hygiene-uk/main-site-builder.git
cd main-site-builder

# Using Dev Container (recommended)
code .
# Then "Reopen in Container" when prompted

# Or run directly with Deno
deno cache [generate-site.ts](http://_vscodecontentref_/1)
```

## Usage

```bash
# Generate the static site
deno task build
```

The generated site will be available in the dist directory.

> [!IMPORTANT]
> Only the first local authority is processed when not in CI. This will allow
> all the code to execute, but with lower resource usage.

## Project Structure

```
├── src/                   # Source code
│   ├── generate-site/     # Site generation modules
│   └── generate-site.ts   # Main entry point
├── assets/                # Static assets
│   └── images/            # Rating images
├── dist/                  # Generated static site
└── build/                 # Temporary build files
```

## Development

```bash
# Run tests
deno test

# Check types
deno check src/generate-site.ts

# Format code
deno fmt
```

## License

MIT License - see LICENSE for details.

## Data Source

Data is sourced from the
[Food Standards Agency API](https://ratings.food.gov.uk/open-data/en-GB).
