#!/usr/bin/env node

/**
 * Blog SSG Build Script
 * Fetches posts from Sanity CMS and generates static HTML files.
 *
 * Generated files:
 *   dist/blog/index.html           - Blog listing page with pre-rendered cards
 *   dist/blog/{slug}/index.html    - Individual blog post pages
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SANITY_PROJECT_ID = 'etjqucnf';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';
const SITE_URL = 'https://aisle-to-islands.com';
const DIST_DIR = path.join(__dirname, 'dist');
const POSTS_PER_PAGE = 9;

function sanityApiUrl(query) {
  return `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
}

// ---------------------------------------------------------------------------
// Sanity Data Fetching
// ---------------------------------------------------------------------------

async function fetchAllPosts() {
  const query = `*[_type == "post" && publishedAt <= now()] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage { asset->{ _id, url } },
    category->{ title, slug },
    author->{ name, slug, bio },
    featured
  }`;

  const res = await fetch(sanityApiUrl(query));
  if (!res.ok) throw new Error(`Sanity API error: ${res.status}`);
  const data = await res.json();
  return data.result || [];
}

async function fetchPostBySlug(slug) {
  const query = `*[_type == "post" && slug.current == "${slug}" && publishedAt <= now()][0] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage { asset->{ _id, url } },
    category->{ title, slug },
    author->{ name, slug, bio },
    seo {
      metaTitle,
      metaDescription,
      keywords,
      ogImage { asset->{ url } }
    },
    body[]{
      _type,
      style,
      listItem,
      level,
      markDefs[]{ _key, _type, href },
      children[]{ _type, text, marks },
      _type == "image" => {
        _type,
        asset->{ _id, url },
        alt,
        caption,
        alignment,
        size
      }
    },
    featured
  }`;

  const res = await fetch(sanityApiUrl(query));
  if (!res.ok) throw new Error(`Sanity API error: ${res.status}`);
  const data = await res.json();
  return data.result;
}

// ---------------------------------------------------------------------------
// Portable Text → HTML
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderPortableText(body) {
  if (!body || !Array.isArray(body)) return '<p>No content available.</p>';

  const blocks = [];
  let currentList = null;

  for (const block of body) {
    // Handle list items - group consecutive ones
    if (block._type === 'block' && block.listItem) {
      const listTag = block.listItem === 'number' ? 'ol' : 'ul';
      if (!currentList || currentList.tag !== listTag) {
        if (currentList) {
          blocks.push(`</${currentList.tag}>`);
        }
        currentList = { tag: listTag };
        blocks.push(`<${listTag}>`);
      }
      blocks.push(`<li>${renderBlockChildren(block)}</li>`);
      continue;
    }

    // Close any open list
    if (currentList) {
      blocks.push(`</${currentList.tag}>`);
      currentList = null;
    }

    if (block._type === 'block') {
      const text = renderBlockChildren(block);
      if (!text) continue;

      switch (block.style) {
        case 'h1': blocks.push(`<h1>${text}</h1>`); break;
        case 'h2': blocks.push(`<h2>${text}</h2>`); break;
        case 'h3': blocks.push(`<h3>${text}</h3>`); break;
        case 'h4': blocks.push(`<h4>${text}</h4>`); break;
        case 'blockquote': blocks.push(`<blockquote>${text}</blockquote>`); break;
        default: blocks.push(`<p>${text}</p>`);
      }
    } else if (block._type === 'image') {
      const imageUrl = block.asset?.url || '';
      if (!imageUrl) continue;
      const alt = escapeHtml(block.alt || '');
      const caption = block.caption || '';
      const alignment = block.alignment || 'center';
      const size = block.size || 'medium';

      blocks.push(`
        <figure class="content-image image-align-${alignment} image-size-${size}">
          <img src="${imageUrl}" alt="${alt}" loading="lazy" />
          ${caption ? `<figcaption class="image-caption">${escapeHtml(caption)}</figcaption>` : ''}
        </figure>`);
    }
  }

  // Close any trailing list
  if (currentList) {
    blocks.push(`</${currentList.tag}>`);
  }

  return blocks.join('\n');
}

function renderBlockChildren(block) {
  const markDefs = {};
  if (block.markDefs) {
    for (const def of block.markDefs) {
      markDefs[def._key] = def;
    }
  }

  return (block.children || []).map(child => {
    let text = child.text || '';
    if (!child.marks || child.marks.length === 0) return text;

    for (const mark of child.marks) {
      if (markDefs[mark]) {
        const def = markDefs[mark];
        if (def._type === 'link' && def.href) {
          text = `<a href="${escapeHtml(def.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        }
      } else {
        switch (mark) {
          case 'strong': text = `<strong>${text}</strong>`; break;
          case 'em': text = `<em>${text}</em>`; break;
          case 'underline': text = `<u>${text}</u>`; break;
          case 'strike-through': text = `<del>${text}</del>`; break;
          case 'code': text = `<code>${text}</code>`; break;
        }
      }
    }

    return text;
  }).join('');
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function calculateReadTime(body) {
  let wordCount = 0;
  if (Array.isArray(body)) {
    for (const block of body) {
      if (block._type === 'block' && block.children) {
        for (const child of block.children) {
          if (child.text) {
            wordCount += child.text.split(/\s+/).filter(w => w.length > 0).length;
          }
        }
      }
    }
  }
  return Math.max(1, Math.ceil(wordCount / 200));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// ---------------------------------------------------------------------------
// HTML Templates - Shared Partials
// ---------------------------------------------------------------------------

const NAV_HTML = `
    <nav role="navigation" aria-label="Main navigation" class="header-sticky">
        <div class="nav-content">
            <div class="logo-container">
                <div class="logo-mark logo-bg" role="img" aria-label="Aisle to Islands logo"></div>
                <div>
                    <div class="logo-text">Aisle to Islands</div>
                </div>
            </div>

            <ul class="nav-links" role="menubar">
                <li role="none"><a href="/index.html" role="menuitem">Home</a></li>
                <li role="none"><a href="/destination-wedding.html" role="menuitem">Destination Wedding</a></li>
                <li role="none" class="has-dropdown">
                    <a href="/curated-travel.html" role="menuitem" aria-haspopup="true">Curated Travel</a>
                    <ul class="nav-dropdown">
                        <li role="none"><a href="/curated-honeymoon.html" role="menuitem">Honeymoon</a></li>
                        <li role="none"><a href="/curated-travel.html" role="menuitem">Travel</a></li>
                    </ul>
                </li>
                <li role="none"><a href="https://legacy.aisle-to-islands.com" role="menuitem">Legacy Blueprint</a></li>
                <li role="none"><a href="/meet-your-planner.html" role="menuitem">Meet Your Planner</a></li>
                <li role="none"><a href="/packages.html" role="menuitem">Packages</a></li>
                <li role="none"><a href="/blog/" role="menuitem" aria-current="page">Blog</a></li>
                <li role="none"><a href="/inquire.html" role="menuitem">Inquire</a></li>
            </ul>

            <button class="mobile-menu-toggle" aria-label="Toggle mobile menu" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>

        <div class="mobile-nav" role="menu">
            <a href="/index.html" role="menuitem">Home</a>
            <a href="/destination-wedding.html" role="menuitem">Destination Wedding</a>
            <a href="/curated-honeymoon.html" role="menuitem" class="mobile-child">Honeymoon</a>
            <a href="/curated-travel.html" role="menuitem" class="mobile-child">Travel</a>
            <a href="https://legacy.aisle-to-islands.com" role="menuitem">Legacy Blueprint</a>
            <a href="/meet-your-planner.html" role="menuitem">Meet Your Planner</a>
            <a href="/packages.html" role="menuitem">Packages</a>
            <a href="/blog/" role="menuitem" aria-current="page">Blog</a>
            <a href="/inquire.html" role="menuitem">Inquire</a>
        </div>
    </nav>`;

const FOOTER_HTML = `
    <footer class="site-footer">
        <div class="footer-content">
            <div class="footer-section">
                <div class="footer-logo">
                    <div class="logo-mark-foot logo-bg-foot"></div>
                </div>
            </div>

            <div class="footer-section">
                <h4>Services</h4>
                <ul>
                    <li><a href="/destination-wedding.html">Destination Wedding Planning</a></li>
                    <li><a href="/curated-honeymoon.html">Honeymoon Planning</a></li>
                    <li><a href="/curated-travel.html">Curated Travel</a></li>
                    <li><a href="/packages.html">Packages</a></li>
                    <li><a href="/inquire.html">Inquire</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h4>Company</h4>
                <ul>
                    <li><a href="/index.html">Home</a></li>
                    <li><a href="/meet-your-planner.html">Meet Your Planner</a></li>
                    <li><a href="/inquire.html">Inquire</a></li>
                    <li><a href="/privacy.html">Privacy Policy</a></li>
                </ul>
            </div>

            <div class="footer-section">
            </div>
        </div>

        <div class="footer-bottom">
            <div class="footer-bottom-content">
                <p>&copy; 2025 Aisle to Islands. All rights reserved. | <a href="https://lueken-good.design" target="_blank" rel="noopener" title="A sustainable system designed for longevity and evolution." style="color: inherit; text-decoration: none;">Digital Foundation by Lueken Good Design</a></p>
            </div>
        </div>
    </footer>`;

const GA_SCRIPT = `
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-Z92QX7TK22', {
        'send_page_view': false,
        'transport_type': 'beacon'
      });
      window.addEventListener('load', function() {
        var s = document.createElement('script');
        s.src = 'https://www.googletagmanager.com/gtag/js?id=G-Z92QX7TK22';
        s.async = true;
        document.head.appendChild(s);
        gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href
        });
      });
    </script>`;

// Minimal client-side JS for mobile menu and animations (no Sanity fetching)
const BLOG_POST_CLIENT_JS = `
    <script>
    (function() {
      // Mobile menu
      var toggle = document.querySelector('.mobile-menu-toggle');
      var mobileNav = document.querySelector('.mobile-nav');
      if (toggle && mobileNav) {
        toggle.addEventListener('click', function(e) {
          e.preventDefault();
          var isExpanded = toggle.getAttribute('aria-expanded') === 'true';
          toggle.classList.toggle('active');
          toggle.setAttribute('aria-expanded', !isExpanded);
          if (!isExpanded) {
            mobileNav.classList.add('active');
            mobileNav.style.display = 'block';
          } else {
            mobileNav.classList.remove('active');
            setTimeout(function() { mobileNav.style.display = 'none'; }, 300);
          }
        });
        document.addEventListener('click', function(e) {
          if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
            toggle.classList.remove('active');
            mobileNav.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            setTimeout(function() { mobileNav.style.display = 'none'; }, 300);
          }
        });
      }

      // Scroll animations for fade-in-element
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        document.querySelectorAll('.fade-in-element').forEach(function(el) {
          observer.observe(el);
        });
      }

      // Hero animation
      var heroContent = document.querySelector('.hero-animate');
      if (heroContent) heroContent.classList.add('loaded');

      // Social sharing
      window.shareOnFacebook = function() {
        var url = encodeURIComponent(window.location.href);
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank', 'width=600,height=400');
      };
      window.shareOnTwitter = function() {
        var url = encodeURIComponent(window.location.href);
        var text = encodeURIComponent(document.title);
        window.open('https://twitter.com/intent/tweet?url=' + url + '&text=' + text, '_blank', 'width=600,height=400');
      };
      window.shareOnLinkedIn = function() {
        var url = encodeURIComponent(window.location.href);
        window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + url, '_blank', 'width=600,height=400');
      };
      window.shareViaEmail = function() {
        var subject = encodeURIComponent(document.title);
        var body = encodeURIComponent('Check out this article: ' + window.location.href);
        window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
      };
    })();
    </script>`;

// ---------------------------------------------------------------------------
// Generate Individual Blog Post Page
// ---------------------------------------------------------------------------

function generateBlogPostHtml(post) {
  const seoTitle = post.seo?.metaTitle || post.title;
  const pageTitle = `${seoTitle} | Aisle to Islands`;
  const description = post.seo?.metaDescription || post.excerpt || '';
  const socialImage = post.seo?.ogImage?.asset?.url || post.mainImage?.asset?.url || '/tailored_experience_logo.png';
  const slug = post.slug?.current || '';
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;
  const imageUrl = post.mainImage?.asset?.url || '/pexels-emma-bauso-1183828-3585806.jpg';
  const categoryTitle = post.category?.title || 'General';
  const categorySlug = post.category?.slug?.current || 'general';
  const authorName = post.author?.name || 'Jessica';
  const authorBio = post.author?.bio || 'Expert Wedding & Travel Planner';
  const authorInitial = authorName.charAt(0).toUpperCase();
  const readTime = calculateReadTime(post.body);
  const bodyHtml = renderPortableText(post.body);
  const keywordsMeta = (post.seo?.keywords && post.seo.keywords.length > 0)
    ? `\n    <meta name="keywords" content="${escapeHtml(post.seo.keywords.join(', '))}">`
    : '';

  // Schema.org structured data for SEO
  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: description,
    image: socialImage,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Aisle to Islands',
      url: SITE_URL,
    },
    datePublished: post.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    ${keywordsMeta}
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${socialImage}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${canonicalUrl}">

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${socialImage}">

    ${GA_SCRIPT}
    <script src="https://analytics.ahrefs.com/analytics.js" data-key="ywcRht9p5oOpmSuHT2WXlQ" async></script>
    <link rel="stylesheet" href="/css/core.css">
    <link rel="stylesheet" href="/css/blog-post.css">
    <link rel="canonical" href="${canonicalUrl}">

    <script type="application/ld+json">${schemaJson}</script>
</head>
<body>
${NAV_HTML}

    <main id="main-content">
        <article class="article-header">
            <div class="article-header-container">
                <nav class="breadcrumb">
                    <a href="/index.html">Home</a> / <a href="/blog/">Blog</a> / <span>${escapeHtml(post.title)}</span>
                </nav>

                <div class="hero-animate">
                    <div class="article-category">${escapeHtml(categoryTitle)}</div>
                    <h1 class="article-title">${escapeHtml(post.title)}</h1>
                    <p class="article-excerpt">${escapeHtml(post.excerpt || '')}</p>

                    <div class="article-meta">
                        <div class="meta-item">
                            <span class="meta-icon">⏱️</span>
                            <span>${readTime} min read</span>
                        </div>
                    </div>

                    <div class="author-info">
                        <div class="author-avatar">${authorInitial}</div>
                        <div class="author-details">
                            <h4>By ${escapeHtml(authorName)}</h4>
                            <p>${escapeHtml(authorBio)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </article>

        <section class="article-content">
            <div class="article-content-container">
                <div class="featured-image fade-in-element" style="background-image: url('${imageUrl}')"></div>

                <div class="article-body">
                    ${bodyHtml}
                </div>

                <div class="social-sharing fade-in-element">
                    <h3 class="sharing-title">Share this article</h3>
                    <div class="sharing-buttons">
                        <button class="share-btn facebook" onclick="shareOnFacebook()">
                            <span>📘</span> Facebook
                        </button>
                        <button class="share-btn twitter" onclick="shareOnTwitter()">
                            <span>🐦</span> Twitter
                        </button>
                        <button class="share-btn linkedin" onclick="shareOnLinkedIn()">
                            <span>💼</span> LinkedIn
                        </button>
                        <button class="share-btn email" onclick="shareViaEmail()">
                            <span>📧</span> Email
                        </button>
                    </div>
                </div>
            </div>
        </section>
    </main>

${FOOTER_HTML}

    <script src="/js/core-essential.js"></script>
${BLOG_POST_CLIENT_JS}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Generate Blog Listing Page
// ---------------------------------------------------------------------------

function createPostCardHtml(post, featured = false) {
  const imageUrl = post.mainImage?.asset?.url || '/images/blog/default-post-image.jpg';
  const categoryTitle = post.category?.title || 'General';
  const postUrl = `/blog/${post.slug.current}`;

  if (featured) {
    return `
                <a href="${postUrl}" class="post-card featured-post blog-fade-element clickable-card" style="text-decoration:none;color:inherit;">
                    <div class="post-image" style="background-image: url('${imageUrl}')"></div>
                    <div class="post-content">
                        <div class="featured-badge">Featured</div>
                        <div class="post-meta"><span class="post-category" style="color: white">${escapeHtml(categoryTitle)}</span></div>
                        <h2 class="post-title">${escapeHtml(post.title)}</h2>
                        <p class="post-excerpt">${escapeHtml(post.excerpt || '')}</p>
                    </div>
                </a>`;
  }

  return `
                <a href="${postUrl}" class="post-card blog-fade-element clickable-card" style="text-decoration:none;color:inherit;">
                    <div class="post-image" style="background-image: url('${imageUrl}')">
                        <span class="post-category" style="color: white">${escapeHtml(categoryTitle)}</span>
                    </div>
                    <div class="post-content">
                        <h2 class="post-title">${escapeHtml(post.title)}</h2>
                        <p class="post-excerpt">${escapeHtml(post.excerpt || '')}</p>
                        <span class="read-more">Read Full Article →</span>
                    </div>
                </a>`;
}

function generateBlogListingHtml(posts) {
  // Build cards for the first page
  const firstPagePosts = posts.slice(0, POSTS_PER_PAGE);
  let cardsHtml = '';

  const featuredPost = firstPagePosts.find(p => p.featured);
  if (featuredPost) {
    cardsHtml += createPostCardHtml(featuredPost, true);
    const rest = firstPagePosts.filter(p => p._id !== featuredPost._id);
    cardsHtml += rest.map(p => createPostCardHtml(p, false)).join('');
  } else {
    cardsHtml = firstPagePosts.map(p => createPostCardHtml(p, false)).join('');
  }

  // Schema.org structured data
  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Aisle to Islands Blog',
    description: 'Expert insights on destination wedding planning, luxury honeymoon destinations, and travel tips.',
    url: `${SITE_URL}/blog/`,
    publisher: {
      '@type': 'Organization',
      name: 'Aisle to Islands',
      url: SITE_URL,
    },
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Travel Insights & Wedding Planning Tips | Aisle to Islands</title>
    <meta name="description" content="Expert insights on destination wedding planning, luxury honeymoon destinations, and travel tips from Aisle to Islands.">

    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${SITE_URL}/blog/">
    <meta property="og:title" content="Travel Insights &amp; Wedding Planning Tips | Aisle to Islands">
    <meta property="og:description" content="Expert insights on destination wedding planning, luxury honeymoon destinations, and travel tips from Aisle to Islands.">
    <meta property="og:image" content="${SITE_URL}/images/logos/tailored_experience_logo.jpg">
    <meta property="og:site_name" content="Aisle to Islands">

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Travel Insights &amp; Wedding Planning Tips | Aisle to Islands">
    <meta name="twitter:description" content="Expert insights on destination wedding planning, luxury honeymoon destinations, and travel tips from Aisle to Islands.">
    <meta name="twitter:image" content="${SITE_URL}/images/logos/tailored_experience_logo.jpg">

    ${GA_SCRIPT}
    <script src="https://analytics.ahrefs.com/analytics.js" data-key="ywcRht9p5oOpmSuHT2WXlQ" async></script>
    <link rel="stylesheet" href="/css/core.css">
    <link rel="stylesheet" href="/css/blog.css">
    <link rel="canonical" href="${SITE_URL}/blog/">

    <script type="application/ld+json">${schemaJson}</script>
</head>
<body>
${NAV_HTML}

    <main>
        <section class="hero" aria-labelledby="hero-title">
            <div class="hero-container">
                <div class="breadcrumb">
                    <a href="/index.html">Home</a> / <span>Blog</span>
                </div>

                <div class="hero-content hero-animate">
                    <h1 id="hero-title" class="hero-title"><span class="font-eyesome" style="color: var(--accent-orange);">Travel</span> <span class="title-emphasis">Insights</span>,<span class="title-emphasis"> Opinions</span>, & Planning Tips</h1>
                    <p class="hero-subtitle">Discover insider knowledge for your destination wedding planning, luxury honeymoon destinations, and travel insights to help you create extraordinary celebrations worldwide.</p>
                </div>
            </div>
        </section>

        <section class="blog-posts">
            <div class="blog-container">
                <div id="postsContainer" class="posts-grid">
                    ${cardsHtml}
                </div>
                <div class="pagination" id="pagination" style="display: none;">
                    <!-- Pagination handled by blog.js for client-side interactivity -->
                </div>
            </div>
        </section>
    </main>

${FOOTER_HTML}

    <!-- Core Essential JavaScript Module -->
    <script src="/js/core-essential.js"></script>

    <!-- Blog Module - handles pagination and animations as progressive enhancement -->
    <script src="/js/blog.js"></script>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (window.AisleToIslands && !window.AisleToIslands.isInitialized) {
                window.AisleToIslands.init({
                    animationDelay: 200,
                    staggerDelay: 100,
                    intersectionThreshold: 0.15
                });
            }
            if (window.AisleToIslands) {
                window.AisleToIslands.initGoogleAnalytics();
            }
        });
    </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Sitemap Generation
// ---------------------------------------------------------------------------

function generateSitemap(posts) {
  const staticPages = [
    '',
    '/blog/',
    '/destination-wedding.html',
    '/curated-honeymoon.html',
    '/meet-your-planner.html',
    '/inquire.html',
    '/privacy.html',
  ];

  const urls = staticPages.map(page => `
  <url>
    <loc>${SITE_URL}${page}</loc>
    <changefreq>${page === '/blog/' ? 'daily' : 'monthly'}</changefreq>
    <priority>${page === '' ? '1.0' : page === '/blog/' ? '0.9' : '0.7'}</priority>
  </url>`);

  for (const post of posts) {
    urls.push(`
  <url>
    <loc>${SITE_URL}/blog/${post.slug.current}/</loc>
    <lastmod>${post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

// ---------------------------------------------------------------------------
// Main Build
// ---------------------------------------------------------------------------

async function main() {
  console.log('========================================');
  console.log('  Blog SSG Build');
  console.log('========================================\n');

  // 1. Fetch all posts for listing
  console.log('Fetching posts from Sanity...');
  let posts;
  try {
    posts = await fetchAllPosts();
  } catch (err) {
    console.error('Failed to fetch posts from Sanity:', err.message);
    console.error('Build cannot proceed without CMS data.');
    process.exit(1);
  }

  if (posts.length === 0) {
    console.warn('No published posts found in Sanity. Generating empty listing page.');
  }

  console.log(`Found ${posts.length} published post(s).\n`);

  // 2. Generate blog listing page
  console.log('Generating blog listing page...');
  const blogDir = path.join(DIST_DIR, 'blog');
  ensureDir(blogDir);
  const listingHtml = generateBlogListingHtml(posts);
  fs.writeFileSync(path.join(blogDir, 'index.html'), listingHtml, 'utf-8');
  console.log('  -> dist/blog/index.html\n');

  // 3. Generate individual post pages
  console.log('Generating individual post pages...');
  let successCount = 0;
  let failCount = 0;

  for (const post of posts) {
    const slug = post.slug?.current;
    if (!slug) {
      console.warn(`  Skipping post "${post.title}" - no slug`);
      failCount++;
      continue;
    }

    try {
      // Fetch full post data (with body)
      const fullPost = await fetchPostBySlug(slug);
      if (!fullPost) {
        console.warn(`  Skipping "${slug}" - not found when fetching full data`);
        failCount++;
        continue;
      }

      const postDir = path.join(blogDir, slug);
      ensureDir(postDir);
      const html = generateBlogPostHtml(fullPost);
      fs.writeFileSync(path.join(postDir, 'index.html'), html, 'utf-8');
      console.log(`  -> dist/blog/${slug}/index.html`);
      successCount++;
    } catch (err) {
      console.error(`  Error generating "${slug}":`, err.message);
      failCount++;
    }
  }

  // 4. Generate sitemap
  console.log('\nGenerating sitemap...');
  const sitemapXml = generateSitemap(posts);
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log('  -> dist/sitemap.xml');

  // Summary
  console.log('\n========================================');
  console.log('  Build Complete');
  console.log('========================================');
  console.log(`  Posts generated: ${successCount}`);
  if (failCount > 0) console.log(`  Failed: ${failCount}`);
  console.log(`  Listing page: dist/blog/index.html`);
  console.log(`  Sitemap: dist/sitemap.xml`);
  console.log('========================================\n');

  if (failCount > 0 && successCount === 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
