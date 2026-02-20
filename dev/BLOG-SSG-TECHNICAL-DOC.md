# Blog SSG (Static Site Generation) - Technical Documentation

> **Last Updated:** February 2026
> **Status:** Production - deployed on Netlify
> **Author:** Implementation built with Claude Code

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [How It Works](#how-it-works)
4. [File Inventory](#file-inventory)
5. [Build Script Deep Dive](#build-script-deep-dive)
6. [Sanity CMS Configuration](#sanity-cms-configuration)
7. [Netlify Configuration](#netlify-configuration)
8. [Redirect & Routing Logic](#redirect--routing-logic)
9. [Webhook Setup (Sanity → Netlify)](#webhook-setup-sanity--netlify)
10. [Generated Output](#generated-output)
11. [Portable Text Rendering](#portable-text-rendering)
12. [SEO Features](#seo-features)
13. [Client-Side Progressive Enhancement](#client-side-progressive-enhancement)
14. [Troubleshooting](#troubleshooting)
15. [How to Recreate This From Scratch](#how-to-recreate-this-from-scratch)

---

## Overview

The blog was originally 100% client-side rendered. When a user visited `/blog/some-post`, the browser loaded a shell HTML page (`blog-post.html`), then JavaScript fetched the post from Sanity's API and injected it into the DOM. This meant **crawlers (Google, social media previews, etc.) saw an empty page** with just `<div class="loading">Loading post...</div>`.

The SSG solution runs a Node.js build script during every Netlify deploy. It fetches all published posts from Sanity and generates complete static HTML files with all content baked into the markup. Crawlers now see the full article text, meta tags, structured data, and images without executing any JavaScript.

### Before vs After

| | Before (Client-Side) | After (SSG) |
|---|---|---|
| **Crawlers see** | "Loading post..." | Full article content |
| **Meta tags** | Generic placeholders | Post-specific title, description, OG image |
| **Time to content** | ~1-3s (fetch from Sanity API) | Instant (HTML already contains content) |
| **SEO** | Not indexable | Fully indexable with Schema.org data |
| **Build step** | None | `node build-blog.js` during Netlify deploy |
| **Content updates** | Instant (client fetches live) | Requires Netlify rebuild (triggered by webhook) |

---

## Architecture

```
┌─────────────────┐     Webhook (POST)     ┌──────────────────┐
│   Sanity CMS    │ ──────────────────────> │  Netlify Build   │
│  (manage.sanity │                         │     Hook         │
│   .io)          │                         └────────┬─────────┘
└─────────────────┘                                  │
        │                                            │ triggers
        │ GROQ API                                   ▼
        │                                   ┌──────────────────┐
        └──────────────────────────────────>│  build-blog.js   │
                                            │  (Node.js)       │
                                            └────────┬─────────┘
                                                     │ generates
                                                     ▼
                                            ┌──────────────────┐
                                            │   dist/blog/     │
                                            │   ├── index.html │
                                            │   ├── post-1/    │
                                            │   │   └── index  │
                                            │   ├── post-2/    │
                                            │   │   └── index  │
                                            │   └── ...        │
                                            │   sitemap.xml    │
                                            └──────────────────┘
                                                     │
                                                     │ deployed
                                                     ▼
                                            ┌──────────────────┐
                                            │  Netlify CDN     │
                                            │  (aisle-to-      │
                                            │  islands.com)    │
                                            └──────────────────┘
```

### Key Design Decisions

1. **Zero npm dependencies** - Uses only Node.js built-ins (`fs`, `path`) and native `fetch` (Node 22+). No `@sanity/client`, no template engines, no bundlers.
2. **Fallback preserved** - The original `blog-post.html` client-side renderer still exists. If a post's static file wasn't generated, Netlify's `_redirects` falls back to it.
3. **Portable Text rendered server-side** - The build script contains its own Portable Text → HTML renderer that mirrors the client-side `renderPortableText()` in `blog-post.html`.
4. **Blog listing has both SSG and client-side** - The listing page (`dist/blog/index.html`) pre-renders the first page of posts. `blog.js` still loads for pagination and animations as progressive enhancement.

---

## How It Works

1. Developer publishes/updates a post in **Sanity Studio**
2. Sanity fires a **webhook** to Netlify's build hook URL
3. Netlify starts a new build, runs `npm install && npm run build`
4. `build-blog.js` executes:
   - Fetches all published posts from Sanity via GROQ API
   - Generates `dist/blog/index.html` (listing page with first 9 posts pre-rendered)
   - For each post, fetches full body content and generates `dist/blog/{slug}/index.html`
   - Generates `dist/sitemap.xml` with all pages and blog posts
5. Netlify deploys the `dist/` directory to CDN
6. Visitors and crawlers receive fully rendered HTML

---

## File Inventory

### Files you created / modified

| File | Purpose |
|---|---|
| `/build-blog.js` | Main SSG build script (Node.js) |
| `/package.json` | Root package with `build` script, no dependencies |
| `/netlify.toml` | Netlify build config (base, publish, node version, cache headers) |
| `/dist/_redirects` | Updated routing rules for static blog paths |
| `/.gitignore` | Added `dist/blog/` and `dist/sitemap.xml` (build output) |

### Files that still exist (unchanged, serve as fallbacks)

| File | Purpose |
|---|---|
| `/dist/blog.html` | Original client-side blog listing (fallback) |
| `/dist/blog-post.html` | Original client-side blog post renderer (fallback) |
| `/dist/js/blog.js` | BlogManager class - still used for listing page pagination |
| `/dist/css/blog.css` | Blog listing styles (used by both SSG and client-side) |
| `/dist/css/blog-post.css` | Blog post styles (used by both SSG and client-side) |

### Files generated at build time (not in git)

| File | Purpose |
|---|---|
| `dist/blog/index.html` | Static blog listing page |
| `dist/blog/{slug}/index.html` | Static individual blog post pages |
| `dist/sitemap.xml` | XML sitemap for search engines |

---

## Build Script Deep Dive

**File:** `/build-blog.js`

### Configuration Constants

```javascript
const SANITY_PROJECT_ID = 'etjqucnf';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';
const SITE_URL = 'https://aisle-to-islands.com';
const DIST_DIR = path.join(__dirname, 'dist');
const POSTS_PER_PAGE = 9;
```

### Data Flow

```
main()
  ├── fetchAllPosts()           → GROQ query, gets all post metadata
  ├── generateBlogListingHtml() → Builds listing page with first 9 cards
  │   └── createPostCardHtml()  → Renders individual card (featured or regular)
  ├── for each post:
  │   ├── fetchPostBySlug()     → GROQ query, gets full post with body
  │   └── generateBlogPostHtml()→ Builds complete post page
  │       ├── renderPortableText() → Converts Sanity blocks to HTML
  │       │   └── renderBlockChildren() → Handles marks/annotations
  │       ├── calculateReadTime()  → Word count / 200 wpm
  │       └── escapeHtml()         → XSS prevention
  └── generateSitemap()         → XML sitemap with all URLs
```

### GROQ Queries

**All posts (listing):**
```groq
*[_type == "post" && publishedAt <= now()] | order(publishedAt desc) {
  _id, title, slug, excerpt, publishedAt,
  mainImage { asset->{ _id, url } },
  category->{ title, slug },
  author->{ name, slug, bio },
  featured
}
```

**Single post (full content):**
```groq
*[_type == "post" && slug.current == "{slug}" && publishedAt <= now()][0] {
  _id, title, slug, excerpt, publishedAt,
  mainImage { asset->{ _id, url } },
  category->{ title, slug },
  author->{ name, slug, bio },
  seo { metaTitle, metaDescription, keywords, ogImage { asset->{ url } } },
  body[]{
    _type, style, listItem, level,
    markDefs[]{ _key, _type, href },
    children[]{ _type, text, marks },
    _type == "image" => {
      _type, asset->{ _id, url }, alt, caption, alignment, size
    }
  },
  featured
}
```

### HTML Template Partials

The build script contains three shared HTML partials as template literal constants:

- **`NAV_HTML`** - The site navigation bar (matches all other pages)
- **`FOOTER_HTML`** - The site footer (matches all other pages)
- **`GA_SCRIPT`** - Google Analytics setup (deferred loading for performance)
- **`BLOG_POST_CLIENT_JS`** - Minimal client-side JS for interactivity (mobile menu, scroll animations, social sharing)

**Important:** If the nav or footer changes on other pages, these partials in `build-blog.js` must be updated to match.

---

## Sanity CMS Configuration

| Setting | Value |
|---|---|
| **Project ID** | `etjqucnf` |
| **Dataset** | `production` |
| **API Version** | `2024-01-01` |
| **Studio URL** | `https://aisle-to-islands-blog.sanity.studio` |
| **Manage URL** | `https://manage.sanity.io` |

### Schema: Post (`sanity-studio/schemaTypes/post.ts`)

| Field | Type | Notes |
|---|---|---|
| `title` | string | Required |
| `slug` | slug | Auto-generated from title, required |
| `excerpt` | text | Used for listings and meta descriptions |
| `mainImage` | image | With hotspot, used as featured image and OG image fallback |
| `category` | reference → category | Post category |
| `author` | reference → author | Post author |
| `publishedAt` | datetime | **Must be set for post to be included in build** |
| `featured` | boolean | Displayed prominently on listing page |
| `seo.metaTitle` | string | Custom SEO title (max 60 chars) |
| `seo.metaDescription` | text | Custom meta description (max 160 chars) |
| `seo.keywords` | array of strings | Meta keywords |
| `seo.ogImage` | image | Custom social share image |
| `body` | Portable Text array | Rich text with inline images |

### Body Portable Text Support

**Block styles:** normal, h1, h2, h3, h4, blockquote
**Marks:** strong, em, underline, strike-through, code
**Annotations:** link (with href)
**Lists:** bullet, numbered
**Inline images:** with alt (required), caption, alignment (left/center/right/full), size (small/medium/large/full)

---

## Netlify Configuration

**File:** `/netlify.toml`

```toml
[build]
  base = "/"                              # Repo root (overrides UI setting of "dist")
  publish = "dist"                        # Deploy directory
  command = "npm install && npm run build" # Runs build-blog.js

[build.environment]
  NODE_VERSION = "22"                     # Required for native fetch()

[[headers]]
  for = "/css/*"
  Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/js/*"
  Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/blog/*"
  Cache-Control = "public, max-age=0, must-revalidate"  # No caching for blog content
```

### Important: Base Directory

The Netlify site UI had `base` set to `dist/`. The `netlify.toml` overrides this with `base = "/"` so the build command runs from the repo root where `package.json` and `build-blog.js` live. If the UI setting is changed, the toml value takes precedence.

If you see `Deploy directory 'dist/dist' does not exist`, it means the base directory is doubling up. Make sure `base = "/"` is in the toml.

---

## Redirect & Routing Logic

**File:** `/dist/_redirects`

### How blog URLs resolve

1. **`/blog`** → Netlify sees `dist/blog/index.html` exists → serves it directly (no redirect needed)
2. **`/blog/some-post`** → Netlify sees `dist/blog/some-post/index.html` exists → serves it directly
3. **`/blog/unknown-post`** → No static file exists → `_redirects` fallback: `/blog/:slug → /blog-post.html` (200 rewrite) → client-side renderer takes over

This fallback means the old client-side rendering still works for:
- Posts published between builds (before the webhook triggers a rebuild)
- Any edge case where a post wasn't generated

### Key redirect change from original

```diff
- /blog                      /blog.html                       301
  # Removed because dist/blog/index.html is now served directly

  /blog/:slug                /blog-post.html                  200
  # Kept as fallback — only hits if no static file exists for that slug
```

---

## Webhook Setup (Sanity → Netlify)

### Step 1: Create Netlify Build Hook

1. Netlify dashboard → your site
2. **Site Settings → Build & deploy → Continuous deployment → Build hooks**
3. Click **Add build hook**
4. Name: `Sanity CMS` (or any name)
5. Branch: your deploy branch (usually `main`)
6. Save → copy the URL (looks like `https://api.netlify.com/build_hooks/abc123...`)

### Step 2: Create Sanity Webhook

1. Go to [manage.sanity.io](https://manage.sanity.io)
2. Select project `etjqucnf` → **API** tab → **Webhooks**
3. Click **Create Webhook**
4. Configure:
   - **Name:** Netlify Rebuild
   - **URL:** (paste the Netlify build hook URL)
   - **Dataset:** production
   - **Filter:** `_type == "post"`
   - **Trigger on:** Create, Update, Delete
   - **HTTP method:** POST
5. Save

Now every time a post is published, updated, or deleted in Sanity Studio, Netlify automatically rebuilds and regenerates all static pages.

---

## Generated Output

### Blog Listing Page (`dist/blog/index.html`)

- Pre-renders the first page of posts (up to 9)
- Featured post displayed in horizontal layout
- Regular posts in grid cards
- `blog.js` still loads for client-side pagination (progressive enhancement)
- Schema.org `Blog` structured data

### Individual Post Pages (`dist/blog/{slug}/index.html`)

Each generated page contains:
- Complete `<head>` with post-specific meta tags (title, description, OG, Twitter Card)
- Schema.org `BlogPosting` structured data (JSON-LD)
- SEO keywords meta tag (if defined in Sanity)
- Canonical URL
- Full nav and footer (matching site-wide design)
- Article header: category badge, h1 title, excerpt, read time, author info
- Featured image as background
- Full article body (Portable Text rendered to HTML)
- Social sharing buttons (Facebook, Twitter, LinkedIn, Email)
- Minimal client-side JS (mobile menu, scroll animations, sharing functions)

### Sitemap (`dist/sitemap.xml`)

Contains all static pages and all blog post URLs with:
- `<lastmod>` based on `publishedAt` date
- Blog listing at priority 0.9, posts at 0.8, other pages at 0.7

---

## Portable Text Rendering

The build script (`build-blog.js`) contains a server-side Portable Text renderer that mirrors the client-side version in `blog-post.html`.

### Supported Block Types

| Sanity Block | HTML Output |
|---|---|
| `block` style `normal` | `<p>...</p>` |
| `block` style `h1`-`h4` | `<h1>`-`<h4>` |
| `block` style `blockquote` | `<blockquote>` |
| `block` with `listItem: 'bullet'` | `<ul><li>...</li></ul>` |
| `block` with `listItem: 'number'` | `<ol><li>...</li></ol>` |
| `image` | `<figure class="content-image image-align-{} image-size-{}">` |

### Supported Marks

| Mark | HTML |
|---|---|
| `strong` | `<strong>` |
| `em` | `<em>` |
| `underline` | `<u>` |
| `strike-through` | `<del>` |
| `code` | `<code>` |
| `link` (annotation) | `<a href="..." target="_blank" rel="noopener noreferrer">` |

### Inline Image CSS Classes

Images get CSS classes that match the existing stylesheet (`blog-post.css`):

```html
<figure class="content-image image-align-center image-size-medium">
  <img src="..." alt="..." loading="lazy" />
  <figcaption class="image-caption">Optional caption</figcaption>
</figure>
```

Alignment: `image-align-left`, `image-align-center`, `image-align-right`, `image-align-full`
Sizes: `image-size-small` (300px), `image-size-medium` (600px), `image-size-large` (900px), `image-size-full`

---

## SEO Features

Each generated blog post page includes:

1. **`<title>`** - Post title (or SEO override) + " | Aisle to Islands"
2. **`<meta name="description">`** - SEO meta description (or excerpt fallback)
3. **`<meta name="keywords">`** - From Sanity SEO field (if defined)
4. **`<link rel="canonical">`** - `https://aisle-to-islands.com/blog/{slug}`
5. **Open Graph tags** - og:title, og:description, og:image, og:type, og:url
6. **Twitter Card tags** - summary_large_image with title, description, image
7. **Schema.org JSON-LD** - `BlogPosting` with headline, description, image, author, publisher, datePublished
8. **Sitemap inclusion** - Post URL with lastmod date

---

## Client-Side Progressive Enhancement

The SSG pages still include minimal JavaScript for interactivity:

### Blog Post Pages
- **Mobile menu** toggle with click-outside-to-close
- **Scroll animations** - IntersectionObserver for `.fade-in-element` class
- **Hero animation** - `.hero-animate` gets `.loaded` class on DOMContentLoaded
- **Social sharing** - `shareOnFacebook()`, `shareOnTwitter()`, `shareOnLinkedIn()`, `shareViaEmail()`
- **core-essential.js** loads for logo animation and base functionality

### Blog Listing Page
- All of the above, plus:
- **blog.js** loads for client-side pagination (BlogManager class)
- BlogManager re-fetches from Sanity and replaces the pre-rendered cards with dynamic ones (enabling pagination beyond page 1)

---

## Troubleshooting

### Build fails with "Deploy directory 'dist/dist' does not exist"
The Netlify UI base directory is set to `dist/`, doubling up with `publish = "dist"`. Ensure `base = "/"` is in `netlify.toml`, or clear the base directory field in Netlify UI → Site Settings → Build & deploy → Build settings.

### Build fails with "Sanity API error" or "fetch failed"
- Check that the Sanity project ID (`etjqucnf`) and dataset (`production`) are correct
- Verify the API isn't down at [status.sanity.io](https://status.sanity.io)
- Check Netlify build logs for the specific HTTP status code

### Posts not appearing after publishing in Sanity
1. Verify the webhook is set up correctly (Sanity → Netlify build hook)
2. Check that the post has a `publishedAt` date set (and it's not in the future)
3. Check that the post is not a draft (must be published)
4. Check Netlify deploys to see if a rebuild was triggered

### A specific post shows the old "Loading post..." client-side page
This means the static file wasn't generated. Possible causes:
- The post slug in Sanity doesn't match the URL
- The post was published after the last build (wait for webhook rebuild)
- The post fetch failed during build (check build logs)

### Nav or footer looks different on blog pages vs other pages
The nav/footer HTML in `build-blog.js` (the `NAV_HTML` and `FOOTER_HTML` constants) are separate copies from the other HTML files. If you update the nav/footer on other pages, you must also update these constants in the build script.

### Sitemap not being picked up by Google
Submit it manually in Google Search Console at: `https://aisle-to-islands.com/sitemap.xml`

---

## How to Recreate This From Scratch

If you need to implement this pattern on another project, here are the steps:

### 1. Create `package.json` at the repo root

```json
{
  "name": "your-site",
  "private": true,
  "scripts": {
    "build": "node build-blog.js"
  },
  "dependencies": {}
}
```

No npm dependencies needed if using Node 22+ (native `fetch`).

### 2. Create `build-blog.js` at the repo root

Key components to implement:
- **Sanity API fetching** - Use native `fetch` with GROQ queries via the HTTP API (`https://{projectId}.api.sanity.io/v{version}/data/query/{dataset}?query=...`)
- **Portable Text renderer** - Convert Sanity's block content to HTML. Handle: text blocks with styles (h1-h4, blockquote, normal), marks (strong, em, underline, etc.), annotations (links), lists (bullet/numbered with grouping), and image blocks
- **HTML generation** - Template literals that produce complete HTML pages with `<head>` meta tags, nav, content, footer, and client-side JS
- **Sitemap generation** - XML sitemap with all page URLs
- **`main()` function** - Orchestrates fetching → generating → writing files

### 3. Create `netlify.toml`

```toml
[build]
  base = "/"
  publish = "dist"          # or wherever your static files live
  command = "npm install && npm run build"

[build.environment]
  NODE_VERSION = "22"
```

Make sure `base` is set to repo root if Netlify UI has a different base directory configured.

### 4. Update `_redirects`

Remove any redirect that would intercept URLs that now have static files. Keep a fallback rewrite to the client-side renderer for posts that weren't generated.

### 5. Update `.gitignore`

Add the generated output directories so build artifacts aren't committed:
```
dist/blog/
dist/sitemap.xml
```

### 6. Set up the webhook

- Create a **Netlify build hook** (Site Settings → Build & deploy → Continuous deployment → Build hooks)
- Create a **Sanity webhook** (manage.sanity.io → API → Webhooks) pointing to the build hook URL, filtered to `_type == "post"`

### 7. Test

- Push to your deploy branch
- Verify Netlify builds successfully
- Visit a blog post URL and View Page Source to confirm content is in the HTML
- Publish a post in Sanity and verify a rebuild is triggered

---

## Quick Reference

| What | Where |
|---|---|
| Build script | `/build-blog.js` |
| Build config | `/netlify.toml` |
| Package config | `/package.json` |
| Redirects | `/dist/_redirects` |
| Sanity schemas | `/sanity-studio/schemaTypes/` |
| Blog CSS (listing) | `/dist/css/blog.css` |
| Blog CSS (post) | `/dist/css/blog-post.css` |
| Client-side fallback (listing) | `/dist/blog.html` |
| Client-side fallback (post) | `/dist/blog-post.html` |
| BlogManager class | `/dist/js/blog.js` |
| Generated listing | `dist/blog/index.html` (build output) |
| Generated posts | `dist/blog/{slug}/index.html` (build output) |
| Generated sitemap | `dist/sitemap.xml` (build output) |
| Sanity project | `etjqucnf` / `production` |
| Sanity Studio | `https://aisle-to-islands-blog.sanity.studio` |
| Live site | `https://aisle-to-islands.com` |
