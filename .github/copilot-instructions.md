# Project Context

This project is a static website generator that creates HTML, CSS, and JavaScript for a website. The generated output is placed in a `dist` directory, which is then committed to a separate repository for deployment.

## Technology Stack

- **Server/Generator**: TypeScript files with `.mts` extension executed by Deno
- **Client Code**:
  - `.vto` - Vento template files for HTML structure
  - `.css` - Stylesheets supporting both light and dark themes
  - `.mjs` - Client-side JavaScript modules
  - Occasionally, template strings in `.mts` files may inject content into the generated site

## File Structure

- `src/` - Parent directory containing all source files
  - `generate-site.mts` - Main orchestrator file and entry point for code execution
  - `pages/` - Contains top-level page directories (no nested pages)
    - Each page has its own directory with associated files
    - Page `.mts` files extract content from `.css` and `.mjs` files and pass it to Vento templates
  - `components/` - Contains reusable components used across multiple pages

## Coding Standards

### TypeScript (`.mts` files)

- Use standard TypeScript for type definitions
- Document all functions using JSDoc
- Utilize Deno API for file operations and other server-side functionality
- Any function that returns a Promise should be marked as async
- Always use `globalThis` instead of `window` for accessing global objects

### JavaScript (`.mjs` files)

- Use JSDoc for type information
- Should be browser-compatible without transpilation
- Any function that returns a Promise should be marked as async
- Always use `globalThis` instead of `window` for accessing global objects

### CSS

- All styles must support both light and dark modes
  - because the site allows theme preference and falls back to browser settings the following code must be used to check if Dark mode is enabled:

  ```
  @media (not (scripting: none)) or (prefers-color-scheme: dark) {
    html:not([data-color-scheme="light"]) {
      /* dark styles here */
    }
  }
  ```
- Follow the established theming patterns

### Vento Templates (`.vto` files)

- Used for HTML generation
- Can include components and page-specific content
