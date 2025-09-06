# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**IMPORTANT**: Always confirm the working environment and Git branch before making changes. Ask the user which branch they want to work on (dev/main) and whether changes should be made to development files (`/dev/`) for testing or production files (`/dist/`) which are deployed by Netlify.
## Project Overview

This is a luxury travel website for "Aisle to Islands" - a destination wedding and honeymoon planning service. The project consists of:

1. **Static Website** (`/dist/`) - Production-ready HTML, CSS, and JavaScript files
2. **Development Files** (`/dev/`) - Work-in-progress files and assets  
3. **Sanity Studio** (`/sanity-studio/`) - Headless CMS for blog content management

## Architecture

### Frontend Structure
- **Static Site**: Built with vanilla HTML, CSS, and JavaScript
- **Modular CSS**: Page-specific stylesheets that extend `core.css`
- **Modular JavaScript**: Core functionality in `core.js` with page-specific modules
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox

### Content Management
- **Sanity.io CMS**: Headless CMS for blog posts and content
- **Schema Types**: Post, Category, and Author content models
- **Rich Text**: Block content with custom formatting and links

### File Organization
```
dist/                 # Production files
├── css/             # Stylesheets (core.css + page-specific)
├── js/              # JavaScript modules (core.js + page-specific)  
├── *.html           # Static pages
dev/                 # Development files
sanity-studio/       # CMS configuration and schemas
├── schemaTypes/     # Content model definitions
├── sanity.config.ts # Studio configuration
```

## Common Development Commands

### Sanity Studio (CMS)
```bash
cd sanity-studio
npm run dev          # Start development server
npm run build        # Build for production
npm run deploy       # Deploy studio to Sanity
```

### Code Quality
```bash
cd sanity-studio
npx eslint .         # Lint TypeScript/JavaScript
npx prettier --write .  # Format code
```

## Key Technical Details

### CSS Architecture
- **CSS Custom Properties**: Consistent color scheme and spacing via `:root` variables
- **Component-Based**: Each page extends `core.css` with specific styles
- **Dual Animation System**: 
  - Core animations use `.fade-in-element` class with `core.js` IntersectionObserver
  - Blog posts use `.blog-fade-element` class with dedicated animation system to prevent conflicts

### JavaScript Architecture (Split Architecture - v2.0)
- **Split Architecture**: Performance-optimized dual-module system
  - `core-essential.js` (10KB): Critical functionality that loads immediately
  - `core-enhanced.js` (12.5KB): Non-critical features loaded via `requestIdleCallback`
- **Core Essential**: `AisleToIslandsCoreEssential` class handles mobile menu, basic animations, logo effects
- **Core Enhanced**: `AisleToIslandsEnhanced` class handles navigation effects, smooth scrolling, Google Analytics
- **Blog Manager**: `BlogManager` class with independent animation system for dynamically loaded content
- **Performance**: Lazy loading, intersection observers, idle callbacks, reduced motion support

### Content Schema (Enhanced v2.0)
- **Blog Posts**: Rich text with Portable Text support including inline images
- **Inline Images**: Full formatting support (alignment, size, captions, alt text)
- **Image Options**: Small/Medium/Large/Full width, Left/Center/Right/Full alignment
- **Sanity Config**: Project ID `etjqucnf`, dataset `production`
- **Schema Files**: Located in `sanity-studio/schemaTypes/`
- **Deployed Studio**: `https://aisle-to-islands-blog.sanity.studio`

### SEO & Performance (Optimized v2.0)
- **Meta Tags**: Complete OpenGraph and schema.org markup
- **Performance**: Split JavaScript architecture for 50% faster initial load
- **Analytics**: Google Analytics with idle loading and performance optimization
- **Core Web Vitals**: Optimized for TBT, FID, and LCP metrics
- **Mobile Performance**: Always-sticky navigation, responsive images
- **Layout Stability**: Zero Cumulative Layout Shift (CLS) through proper spacing

## Development Workflow

1. **Static Site Changes**: Edit files in `/dist/` directly (production files)
2. **Content Management**: Use Sanity Studio for blog posts and content
3. **CMS Schema Changes**: Modify files in `sanity-studio/schemaTypes/`
4. **Styling**: Follow existing CSS architecture and variable system
5. **JavaScript**: Extend core functionality rather than creating standalone scripts

## Important Implementation Notes

### Animation System (Enhanced v2.0)
- **Standard Pages**: Use `.fade-in-element` class - automatically handled by `core-essential.js`
- **Blog Listing**: Use `.blog-fade-element` class - immediate load with staggered animations
- **Blog Posts**: Article content loads immediately, decorative elements fade in on scroll
- **Homepage Hero**: Special animation triggered when navigation becomes sticky
- **Performance**: Respects `prefers-reduced-motion`, uses `requestAnimationFrame` optimization
- **Avoid Conflicts**: Never mix animation classes; blog content and static content have separate systems

### Blog Post Rendering (Enhanced v2.0)
- **Blog Listing**: Posts animate in immediately on page load with 200ms + 150ms stagger
- **Blog Content**: Article text displays instantly for better reading experience
- **Inline Images**: Rendered from Portable Text with proper styling classes
- **Image Rendering**: Uses CSS classes like `.content-image`, `.image-align-center`, `.image-size-medium`
- **Responsive Images**: Automatically optimized for mobile with `loading="lazy"`

### Navigation System (Enhanced v2.0)
- **Homepage Navigation**: Special sticky behavior with smooth transitions
- **Content Jump Fix**: Spacer system prevents layout shift when nav becomes sticky
- **Mobile Optimization**: Always-sticky navigation on mobile devices
- **Hero Animation**: Fade-in triggered when navbar reaches sticky point
- **Smooth Transitions**: Uses `cubic-bezier` easing for luxury brand feel

### Inline Image System (New v2.0)
- **Portable Text Integration**: Images can be placed anywhere within blog post content
- **Client Interface**: Simple upload and formatting options in Sanity Studio
- **Image Formatting**:
  - **Sizes**: Small (300px), Medium (600px), Large (900px), Full Width
  - **Alignment**: Left, Center, Right, Full Width
  - **Features**: Captions, Alt text, Lazy loading
- **Responsive Behavior**: Text wrapping on desktop, stacked on mobile
- **CSS Classes**: Uses `.content-image`, `.image-align-*`, `.image-size-*` system
- **SEO Optimized**: Semantic HTML with proper `<figure>` and `<figcaption>` elements