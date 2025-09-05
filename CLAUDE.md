# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### JavaScript Architecture  
- **Core Module**: `AisleToIslandsCore` class handles shared functionality
- **Page Modules**: Extend core functionality for specific pages
- **Blog Manager**: `BlogManager` class with independent animation system for dynamically loaded content
- **Performance**: Lazy loading, intersection observers, debounced events

### Content Schema
- **Blog Posts**: Rich text with custom formatting, categories, and authors
- **Sanity Config**: Project ID `etjqucnf`, dataset `production`
- **Schema Files**: Located in `sanity-studio/schemaTypes/`

### SEO & Performance
- **Meta Tags**: Complete OpenGraph and schema.org markup
- **Performance**: Preloaded critical CSS/fonts, optimized images
- **Analytics**: Google Analytics and Ahrefs tracking integrated

## Development Workflow

1. **Static Site Changes**: Edit files in `/dist/` directly (production files)
2. **Content Management**: Use Sanity Studio for blog posts and content
3. **CMS Schema Changes**: Modify files in `sanity-studio/schemaTypes/`
4. **Styling**: Follow existing CSS architecture and variable system
5. **JavaScript**: Extend core functionality rather than creating standalone scripts

## Important Implementation Notes

### Animation System
- **Standard Pages**: Use `.fade-in-element` class - automatically handled by `core.js`
- **Blog Posts**: Use `.blog-fade-element` class - managed by `BlogManager.initPostAnimations()`
- **Avoid Conflicts**: Never mix animation classes; blog content is dynamically loaded and needs separate handling

### Blog Post Rendering
- Posts are dynamically generated with `.blog-fade-element` class
- Animation system ensures smooth fade-in with staggered timing (150ms delays)
- Uses `preparePostsForAnimation()` to force initial hidden state before triggering animations