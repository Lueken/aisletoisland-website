/**
 * ENHANCED BLOG MODULE WITH SANITY CONNECTION FIX
 * Handles blog listing, search, filtering, and pagination
 * Integrates with Sanity CMS with comprehensive debugging
 * Depends on: core.js
 */

class BlogManager {
    constructor() {
        this.config = {
            sanityClient: {
                projectId: 'etjqucnf',
                dataset: 'production',
                apiVersion: '2024-01-01',
                useCdn: true
            },
            postsPerPage: 9,
            searchDelay: 300,
            debug: true,
            showDates: false  // Set to false to hide dates, true to show them
        };

        this.state = {
            currentPosts: [],
            filteredPosts: [],
            currentPage: 1,
            currentCategory: 'all',
            currentSearch: '',
            isLoading: false,
            sanityConnected: false,
            lastError: null
        };

        this.elements = {};
        this.searchTimeout = null;
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    init() {
        console.log('📚 Initializing Enhanced Blog Manager...');

        if (!this.cacheElements()) {
            console.error('❌ Required blog elements not found');
            return;
        }

        this.bindEvents();
        this.testSanityConnection().then(() => {
            this.loadInitialPosts();
        });

        console.log('✅ Enhanced Blog Manager initialized');
    }

    cacheElements() {
        this.elements = {
            postsContainer: document.getElementById('postsContainer'),
            pagination: document.getElementById('pagination'),
            searchInput: document.getElementById('searchInput'),
            filterBtns: document.querySelectorAll('.filter-btn')
        };

        // Validate required elements
        if (!this.elements.postsContainer) {
            console.error('❌ Posts container (#postsContainer) not found');
            return false;
        }

        return true;
    }

    bindEvents() {
        // Search functionality
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => this.handleSearch());
        }

        // Category filters
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleCategoryFilter(btn.dataset.category);
            });
        });
    }

    // ==========================================
    // SANITY CONNECTION TESTING
    // ==========================================

    async testSanityConnection() {
        console.log('🔌 Testing Sanity connection...');

        try {
            // Test basic connectivity with a simple query
            const testQuery = '*[_type == "post"][0]';
            const testUrl = `https://${this.config.sanityClient.projectId}.api.sanity.io/v${this.config.sanityClient.apiVersion}/data/query/${this.config.sanityClient.dataset}?query=${encodeURIComponent(testQuery)}`;

            if (this.config.debug) {
                console.log('🔍 Testing URL:', testUrl);
            }

            const response = await fetch(testUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(`Sanity API Error: ${data.error.description || data.error}`);
            }

            this.state.sanityConnected = true;
            console.log('✅ Sanity connection successful');

            if (this.config.debug) {
                console.log('📊 Sanity response sample:', data);
            }

            if (data.result === null) {
                console.warn('⚠️ Sanity connected but no posts found. Check:');
                console.warn('   • Are posts published in Sanity Studio?');
                console.warn('   • Is the document type "post"?');
                console.warn('   • Do posts have publishedAt dates?');
            }

            return true;

        } catch (error) {
            this.state.sanityConnected = false;
            this.state.lastError = error;
            console.error('❌ Sanity connection failed:', error.message);
            console.warn('🔄 Will use mock data fallback');

            this.showSanityDebugInfo();
            return false;
        }
    }

    showSanityDebugInfo() {
        console.group('🔍 SANITY DEBUGGING INFORMATION');
        console.log('Project ID:', this.config.sanityClient.projectId);
        console.log('Dataset:', this.config.sanityClient.dataset);
        console.log('API Version:', this.config.sanityClient.apiVersion);
        console.log('Expected URL Pattern:', `https://${this.config.sanityClient.projectId}.api.sanity.io/v${this.config.sanityClient.apiVersion}/data/query/${this.config.sanityClient.dataset}`);
        console.log('Last Error:', this.state.lastError?.message);

        console.log('📋 TROUBLESHOOTING CHECKLIST:');
        console.log('   1. ✓ Check project ID in Sanity Studio settings');
        console.log('   2. ✓ Verify dataset name (usually "production")');
        console.log('   3. ✓ Ensure posts are published (not drafts)');
        console.log('   4. ✓ Check document type is "post"');
        console.log('   5. ✓ Verify publishedAt field exists with dates');
        console.log('   6. ✓ Check CORS settings in Sanity Studio');
        console.log('   7. ✓ Try accessing Sanity API directly in browser');
        console.groupEnd();
    }

    // ==========================================
    // DATA MANAGEMENT
    // ==========================================

    async loadInitialPosts() {
        await this.loadPosts();
    }

    async loadPosts(category = 'all', searchTerm = '') {
        if (this.state.isLoading) return;

        this.setLoadingState(true);
        this.state.currentCategory = category;
        this.state.currentSearch = searchTerm;

        try {
            const posts = await this.fetchPosts(category, searchTerm);
            this.state.currentPosts = posts;
            this.state.filteredPosts = posts;
            this.state.currentPage = 1;

            this.displayPosts();

        } catch (error) {
            console.error('Error loading posts:', error);
            this.showErrorState();
        } finally {
            this.setLoadingState(false);
        }
    }

    async fetchPosts(category = 'all', searchTerm = '') {
        // Try Sanity first, then fallback to mock data
        if (this.state.sanityConnected) {
            try {
                return await this.fetchFromSanity(category, searchTerm);
            } catch (error) {
                console.warn('⚠️ Sanity fetch failed, using mock data:', error.message);
                this.state.sanityConnected = false; // Mark as disconnected for this session
                return this.getMockPosts(category, searchTerm);
            }
        } else {
            console.log('📝 Using mock data (Sanity not connected)');
            return this.getMockPosts(category, searchTerm);
        }
    }

    async fetchFromSanity(category = 'all', searchTerm = '') {
        const query = this.buildSanityQuery(category, searchTerm);
        const url = `https://${this.config.sanityClient.projectId}.api.sanity.io/v${this.config.sanityClient.apiVersion}/data/query/${this.config.sanityClient.dataset}?query=${encodeURIComponent(query)}`;

        if (this.config.debug) {
            console.log('🔍 Sanity Query:', query);
            console.log('🌐 Sanity URL:', url);
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Sanity API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`Sanity query error: ${data.error.description || data.error}`);
        }

        if (this.config.debug) {
            console.log('📦 Sanity Response:', data);
            console.log(`📊 Found ${data.result ? data.result.length : 0} posts`);
        }

        return data.result || [];
    }

    buildSanityQuery(category = 'all', searchTerm = '') {
        let query = `*[_type == "post" && publishedAt <= now()`;

        if (category !== 'all') {
            query += ` && category->slug.current == "${category}"`;
        }

        if (searchTerm) {
            query += ` && (title match "${searchTerm}*" || excerpt match "${searchTerm}*")`;
        }

        query += `] | order(publishedAt desc) {
            _id,
            title,
            slug,
            excerpt,
            publishedAt,
            mainImage {
                asset->{
                    _id,
                    url
                }
            },
            category->{
                title,
                slug
            },
            author->{
                name,
                slug
            },
            featured
        }`;

        return query;
    }

    getMockPosts(category = 'all', searchTerm = '') {
        const mockPosts = [
            {
                _id: '1',
                title: 'The Ultimate Guide to Planning Your Destination Wedding in Bali',
                slug: { current: 'destination-wedding-bali-guide' },
                excerpt: 'Discover the secrets to planning an unforgettable destination wedding in Bali, from choosing the perfect venue to navigating local customs.',
                publishedAt: '2024-01-15T10:00:00Z',
                mainImage: { asset: { url: '/images/blog/pexels-alexander-mass-748453803-26201422.jpg' } },
                category: { title: 'Destination Weddings', slug: { current: 'destination-weddings' } },
                author: { name: 'Jessica', slug: { current: 'jessica' } },
                featured: true
            },
            {
                _id: '2',
                title: 'Top 10 Luxury Honeymoon Destinations for 2024',
                slug: { current: 'luxury-honeymoon-destinations-2024' },
                excerpt: 'Explore the most romantic and luxurious honeymoon destinations that offer the perfect blend of adventure, relaxation, and intimate moments.',
                publishedAt: '2024-01-10T14:30:00Z',
                mainImage: { asset: { url: '/images/blog/pexels-asadphoto-11118954.jpg' } },
                category: { title: 'Honeymoons', slug: { current: 'honeymoons' } },
                author: { name: 'Jessica', slug: { current: 'jessica' } },
                featured: false
            },
            {
                _id: '3',
                title: 'Wedding Planning Timeline: 12 Months to Your Perfect Day',
                slug: { current: 'wedding-planning-timeline-12-months' },
                excerpt: 'A comprehensive month-by-month guide to planning your destination wedding, ensuring no detail is overlooked.',
                publishedAt: '2024-01-05T09:15:00Z',
                mainImage: { asset: { url: '/images/blog/pexels-emma-bauso-1183828-3585806.jpg' } },
                category: { title: 'Planning Guides', slug: { current: 'planning-guides' } },
                author: { name: 'Jessica', slug: { current: 'jessica' } },
                featured: false
            },
            {
                _id: '4',
                title: 'Travel Tips: What to Pack for Your Tropical Wedding',
                slug: { current: 'tropical-wedding-packing-tips' },
                excerpt: 'Essential packing tips for couples getting married in tropical destinations, including weather considerations.',
                publishedAt: '2024-01-01T16:45:00Z',
                mainImage: { asset: { url: '/images/blog/pexels-leeloothefirst-4679176.jpg' } },
                category: { title: 'Travel Tips', slug: { current: 'travel-tips' } },
                author: { name: 'Jessica', slug: { current: 'jessica' } },
                featured: false
            },
            {
                _id: '5',
                title: 'Creating Unforgettable Moments: Wedding Guest Experience',
                slug: { current: 'wedding-guest-experience-guide' },
                excerpt: 'Learn how to create an extraordinary experience for your wedding guests, from welcome packages to local experiences.',
                publishedAt: '2023-12-28T11:20:00Z',
                mainImage: { asset: { url: '/images/blog/pexels-gustavo-fring-4172923.jpg' } },
                category: { title: 'Destination Weddings', slug: { current: 'destination-weddings' } },
                author: { name: 'Jessica', slug: { current: 'jessica' } },
                featured: false
            },
            {
                _id: '6',
                title: 'Honeymoon Photography: Capturing Your Love Story',
                slug: { current: 'honeymoon-photography-tips' },
                excerpt: 'Professional tips for capturing beautiful honeymoon photos, from choosing the right photographer to creating lasting memories.',
                publishedAt: '2023-12-25T13:00:00Z',
                mainImage: { asset: { url: '/images/blog/pexels-asadphoto-1024967.jpg' } },
                category: { title: 'Honeymoons', slug: { current: 'honeymoons' } },
                author: { name: 'Jessica', slug: { current: 'jessica' } },
                featured: false
            }
        ];

        // Apply filtering
        let filtered = mockPosts;

        if (category !== 'all') {
            filtered = filtered.filter(post =>
                post.category?.slug?.current === category
            );
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(term) ||
                post.excerpt.toLowerCase().includes(term)
            );
        }

        return filtered;
    }

    // ==========================================
    // DISPLAY MANAGEMENT
    // ==========================================

    displayPosts() {
        if (!this.elements.postsContainer) return;

        if (this.state.filteredPosts.length === 0) {
            this.showEmptyState();
            return;
        }

        const startIndex = (this.state.currentPage - 1) * this.config.postsPerPage;
        const endIndex = startIndex + this.config.postsPerPage;
        const postsToShow = this.state.filteredPosts.slice(startIndex, endIndex);

        let html = '';

        // Show featured post on first page
        if (this.state.currentPage === 1) {
            const featuredPost = this.state.filteredPosts.find(post => post.featured);
            if (featuredPost) {
                html += this.createPostCard(featuredPost, true);
                // Remove featured post from regular posts
                const remainingPosts = postsToShow.filter(post => post._id !== featuredPost._id);
                html += remainingPosts.map(post => this.createPostCard(post, false)).join('');
            } else {
                html = postsToShow.map(post => this.createPostCard(post, false)).join('');
            }
        } else {
            html = postsToShow.map(post => this.createPostCard(post, false)).join('');
        }

        this.elements.postsContainer.innerHTML = html;

        // IMPORTANT: Bind click handlers after updating DOM
        this.bindCardClickHandlers();

        this.updatePagination();
        this.showDataSource();

        // Ensure posts start hidden, then trigger animations
        this.preparePostsForAnimation();
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            this.initPostAnimations();
        }, 50);
    }

    // ==========================================
    // ANIMATION MANAGEMENT
    // ==========================================

    preparePostsForAnimation() {
        // Ensure all new posts start in hidden state
        const newPosts = document.querySelectorAll('.post-card.blog-fade-element:not(.animation-prepared)');
        newPosts.forEach(post => {
            post.classList.add('animation-prepared');
            // Force initial hidden state
            post.style.opacity = '0';
            post.style.transform = 'translateY(30px)';
        });
    }

    initPostAnimations() {
        const newPostCards = document.querySelectorAll('.post-card.blog-fade-element:not(.animation-observed)');
        
        if (newPostCards.length === 0) return;

        // Show posts immediately on page load with staggered delays
        newPostCards.forEach((card, index) => {
            card.classList.add('animation-observed');
            
            // Set transition timing
            card.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            // Animate in with delay
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                card.classList.add('is-visible');
            }, 200 + (index * 150)); // Start after 200ms, then stagger by 150ms each
        });
    }

    // FIXED: Simplified createPostCard method with cleaner date logic
    createPostCard(post, featured = false) {
        const imageUrl = post.mainImage?.asset?.url || '/images/blog/default-post-image.jpg';
        const categoryTitle = post.category?.title || 'General';
        const formattedDate = this.formatDate(post.publishedAt);
        const postUrl = `/blog/${post.slug.current}`;

        if (featured) {
            // Build meta content for featured posts
            let metaContent = '';
            if (this.config.showDates) {
                metaContent += `<span class="post-date">📅 ${formattedDate}</span>`;
            }
            if (categoryTitle) {
                metaContent += `<span class="post-category">${categoryTitle}</span>`;
            }

            return `
                <article class="post-card featured-post blog-fade-element clickable-card" data-href="${postUrl}">
                    <div class="post-image" style="background-image: url('${imageUrl}')"></div>
                    <div class="post-content">
                        <div class="featured-badge">Featured</div>
                        ${metaContent ? `<div class="post-meta">${metaContent}</div>` : ''}
                        <h2 class="post-title">${post.title}</h2>
                        <p class="post-excerpt">${post.excerpt}</p>
<!--                        <span class="read-more">Read Full Article →</span>-->
                    </div>
                </article>
            `;
        }

        // Regular post card - use blog-fade-element instead of fade-in-element to avoid core.js conflicts
        return `
            <article class="post-card blog-fade-element clickable-card" data-href="${postUrl}">
                <div class="post-image" style="background-image: url('${imageUrl}')">
                    <span class="post-category">${categoryTitle}</span>
                </div>
                <div class="post-content">
                    ${this.config.showDates ? `<div class="post-meta"><span class="post-date">📅 ${formattedDate}</span></div>` : ''}
                    <h2 class="post-title">${post.title}</h2>
                    <p class="post-excerpt">${post.excerpt}</p>
                    <span class="read-more">Read Full Article →</span>
                </div>
            </article>
        `;
    }

    bindCardClickHandlers() {
        // Remove existing event listeners to prevent duplicates
        document.querySelectorAll('.clickable-card').forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        });

        // Add click handlers to all clickable cards
        document.querySelectorAll('.clickable-card').forEach(card => {
            // Add hover effect
            card.style.cursor = 'pointer';

            card.addEventListener('click', (e) => {
                e.preventDefault();
                const href = card.getAttribute('data-href');
                if (href) {
                    window.location.href = href;
                }
            });

            // Add keyboard accessibility
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'link');
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const href = card.getAttribute('data-href');
                    if (href) {
                        window.location.href = href;
                    }
                }
            });
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showDataSource() {
        // Add visual indicator of data source for debugging
        if (!this.config.debug) return; // Only show in debug mode

        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${this.state.sanityConnected ? '#4caf50' : '#ff9800'};
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            opacity: 0.8;
            pointer-events: none;
        `;
        indicator.textContent = this.state.sanityConnected ? '✅ Sanity CMS' : '📝 Mock Data';

        // Remove existing indicator
        const existing = document.querySelector('.data-source-indicator');
        if (existing) existing.remove();

        indicator.className = 'data-source-indicator';
        document.body.appendChild(indicator);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
        }, 3000);
    }

    // ==========================================
    // PAGINATION, SEARCH, FILTERS
    // ==========================================

    updatePagination() {
        if (!this.elements.pagination) return;

        const totalPages = Math.ceil(this.state.filteredPosts.length / this.config.postsPerPage);

        if (totalPages <= 1) {
            this.elements.pagination.style.display = 'none';
            return;
        }

        this.elements.pagination.style.display = 'flex';

        let html = '';

        // Previous button
        if (this.state.currentPage > 1) {
            html += `<button class="pagination-btn" onclick="window.BlogManager.changePage(${this.state.currentPage - 1})">← Previous</button>`;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const active = i === this.state.currentPage ? 'active' : '';
            html += `<button class="pagination-btn ${active}" onclick="window.BlogManager.changePage(${i})">${i}</button>`;
        }

        // Next button
        if (this.state.currentPage < totalPages) {
            html += `<button class="pagination-btn" onclick="window.BlogManager.changePage(${this.state.currentPage + 1})">Next →</button>`;
        }

        this.elements.pagination.innerHTML = html;
    }

    changePage(page) {
        this.state.currentPage = page;
        this.displayPosts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    handleSearch() {
        const searchTerm = this.elements.searchInput?.value || '';

        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadPosts(this.state.currentCategory, searchTerm);
        }, this.config.searchDelay);
    }

    handleCategoryFilter(category) {
        // Update active filter button
        this.elements.filterBtns.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-category="${category}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.loadPosts(category, this.state.currentSearch);
    }

    // ==========================================
    // UI STATES
    // ==========================================

    setLoadingState(loading) {
        this.state.isLoading = loading;

        if (this.elements.postsContainer) {
            if (loading) {
                this.elements.postsContainer.innerHTML = '<div class="loading">Loading posts...</div>';
            }
        }
    }

    showEmptyState() {
        if (this.elements.postsContainer) {
            this.elements.postsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No posts found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                    ${!this.state.sanityConnected ? '<p><em>Using mock data - check Sanity connection.</em></p>' : ''}
                </div>
            `;
        }

        if (this.elements.pagination) {
            this.elements.pagination.style.display = 'none';
        }
    }

    showErrorState() {
        if (this.elements.postsContainer) {
            this.elements.postsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to load posts</h3>
                    <p>Please try again later.</p>
                    <button onclick="window.BlogManager.refresh()" style="margin-top: 10px; padding: 8px 16px; background: var(--primary-teal); color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
                </div>
            `;
        }
    }

    // ==========================================
    // DEBUGGING METHODS
    // ==========================================

    async debugSanity() {
        console.group('🔍 COMPREHENSIVE SANITY DEBUG');

        console.log('📊 Current State:', {
            connected: this.state.sanityConnected,
            postsCount: this.state.currentPosts.length,
            lastError: this.state.lastError?.message
        });

        console.log('⚙️ Configuration:', this.config.sanityClient);

        // Test various queries
        console.log('🧪 Testing basic query...');
        try {
            const basicQuery = '*[_type == "post"]';
            const basicUrl = `https://${this.config.sanityClient.projectId}.api.sanity.io/v${this.config.sanityClient.apiVersion}/data/query/${this.config.sanityClient.dataset}?query=${encodeURIComponent(basicQuery)}`;
            const response = await fetch(basicUrl);
            const data = await response.json();
            console.log('Basic query result:', data);
        } catch (error) {
            console.error('Basic query failed:', error);
        }

        // Test document types
        console.log('🧪 Testing document types...');
        try {
            const typesQuery = '*[]{_type}';
            const typesUrl = `https://${this.config.sanityClient.projectId}.api.sanity.io/v${this.config.sanityClient.apiVersion}/data/query/${this.config.sanityClient.dataset}?query=${encodeURIComponent(typesQuery)}`;
            const response = await fetch(typesUrl);
            const data = await response.json();
            const types = [...new Set(data.result.map(doc => doc._type))];
            console.log('Available document types:', types);
        } catch (error) {
            console.error('Document types query failed:', error);
        }

        console.groupEnd();
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    refresh() {
        this.state.sanityConnected = false;
        this.testSanityConnection().then(() => {
            this.loadPosts(this.state.currentCategory, this.state.currentSearch);
        });
    }

    search(term) {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = term;
        }
        this.loadPosts(this.state.currentCategory, term);
    }

    filterByCategory(category) {
        this.handleCategoryFilter(category);
    }

    getState() {
        return {
            ...this.state,
            config: this.config,
            hasRequiredElements: !!this.elements.postsContainer
        };
    }

    // Update Sanity configuration
    updateSanityConfig(projectId, dataset = 'production') {
        this.config.sanityClient.projectId = projectId;
        this.config.sanityClient.dataset = dataset;
        console.log('📝 Sanity config updated:', this.config.sanityClient);
        this.refresh();
    }

    // Configuration methods
    setShowDates(show) {
        this.config.showDates = show;
        console.log(`📅 Date display ${show ? 'enabled' : 'disabled'}`);
        this.displayPosts(); // Refresh display
    }

    toggleShowDates() {
        this.setShowDates(!this.config.showDates);
    }
}

// ==========================================
// MOBILE MENU HANDLER
// ==========================================

function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');

    if (toggle && mobileNav) {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

            toggle.classList.toggle('active');
            toggle.setAttribute('aria-expanded', !isExpanded);

            if (!isExpanded) {
                mobileNav.classList.add('active');
                mobileNav.style.display = 'block';
            } else {
                mobileNav.classList.remove('active');
                setTimeout(() => {
                    mobileNav.style.display = 'none';
                }, 300);
            }
        });

        // Close mobile menu when clicking links
        const links = mobileNav.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                mobileNav.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                setTimeout(() => {
                    mobileNav.style.display = 'none';
                }, 300);
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
                toggle.classList.remove('active');
                mobileNav.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                setTimeout(() => {
                    mobileNav.style.display = 'none';
                }, 300);
            }
        });
    }
}

// ==========================================
// HERO ANIMATION
// ==========================================

function initHeroAnimation() {
    setTimeout(() => {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.classList.add('loaded');
        }
    }, 300);
}

// ==========================================
// AUTO-INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Blog page initialization starting...');

    // Initialize mobile menu
    initMobileMenu();

    // Initialize hero animation
    initHeroAnimation();

    // Initialize blog listing page
    if (document.getElementById('postsContainer')) {
        window.BlogManager = new BlogManager();
        window.BlogManager.init();

        // Add global debug functions
        window.debugSanity = function() {
            if (window.BlogManager) {
                window.BlogManager.debugSanity();
            } else {
                console.log('BlogManager not initialized');
            }
        };

        window.updateSanityConfig = function(projectId, dataset = 'production') {
            if (window.BlogManager) {
                window.BlogManager.updateSanityConfig(projectId, dataset);
            } else {
                console.log('BlogManager not initialized');
            }
        };

        // Testing functions
        window.testBlogSearch = function(term) {
            if (window.BlogManager) {
                window.BlogManager.search(term);
            }
        };

        window.testBlogFilter = function(category) {
            if (window.BlogManager) {
                window.BlogManager.filterByCategory(category);
            }
        };

        window.debugBlogPage = function() {
            if (window.BlogManager) {
                console.log('Blog Manager State:', window.BlogManager.getState());
            }
        };

        // Date configuration functions
        window.showDates = function() {
            if (window.BlogManager) {
                window.BlogManager.setShowDates(true);
            }
        };

        window.hideDates = function() {
            if (window.BlogManager) {
                window.BlogManager.setShowDates(false);
            }
        };

        window.toggleDates = function() {
            if (window.BlogManager) {
                window.BlogManager.toggleShowDates();
            }
        };
    }

    console.log('✅ Blog page initialization complete');
    console.log('💡 Available commands:');
    console.log('  • debugBlogPage() - Check blog status');
    console.log('  • debugSanity() - Debug Sanity connection');
    console.log('  • showDates() / hideDates() / toggleDates() - Control date display');
    console.log('  • testBlogSearch("term") - Test search');
    console.log('  • testBlogFilter("category") - Test filters');
});

// Export for global access
window.BlogManager = BlogManager;