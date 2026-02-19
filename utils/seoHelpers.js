/**
 * SEO Utilities for CampusMart
 * Helper functions for SEO optimization
 */

/**
 * Generate SEO-friendly slug from title
 * @param {string} title - The title to convert to slug
 * @returns {string} URL-friendly slug
 */
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-');      // Replace multiple hyphens with single hyphen
};

/**
 * Truncate text to specified length for meta descriptions
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 155)
 * @returns {string} Truncated text
 */
const truncateForMeta = (text, maxLength = 155) => {
    if (!text || text.length <= maxLength) return text;
    
    // Find last complete word within limit
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return truncated.substring(0, lastSpace) + '...';
};

/**
 * Generate structured data for a product
 * @param {Object} product - Product object from database
 * @returns {Object} JSON-LD structured data
 */
const generateProductStructuredData = (product) => {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.title,
        "description": product.description || product.title,
        "image": product.images.map(img => img.url),
        "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "USD",
            "availability": product.isSold 
                ? "https://schema.org/OutOfStock" 
                : "https://schema.org/InStock",
            "itemCondition": `https://schema.org/${product.condition === 'New' ? 'NewCondition' : 'UsedCondition'}`,
            "seller": {
                "@type": "Person",
                "name": product.owner.fullName || product.owner.username
            }
        },
        "category": product.category,
        "brand": product.brand || "Generic"
    };
    
    // Add ratings if available
    if (product.reviews && product.reviews.length > 0) {
        const avgRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
        structuredData.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": avgRating.toFixed(1),
            "reviewCount": product.reviews.length
        };
    }
    
    return structuredData;
};

/**
 * Generate Open Graph data for a page
 * @param {Object} options - Page options
 * @returns {Object} Open Graph data
 */
const generateOGData = (options) => {
    const {
        title,
        description,
        image,
        url,
        type = 'website',
        siteName = 'CampusMart'
    } = options;
    
    return {
        ogTitle: title,
        ogDescription: description,
        ogImage: image || 'https://campusmart.com/images/og-default.jpg',
        ogUrl: url,
        ogType: type,
        ogSiteName: siteName
    };
};

/**
 * Generate Twitter Card data
 * @param {Object} options - Page options
 * @returns {Object} Twitter Card data
 */
const generateTwitterData = (options) => {
    const {
        title,
        description,
        image,
        cardType = 'summary_large_image'
    } = options;
    
    return {
        twitterCard: cardType,
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: image || 'https://campusmart.com/images/twitter-default.jpg'
    };
};

/**
 * Build complete SEO data object for a page
 * @param {Object} options - Page options
 * @returns {Object} Complete SEO data
 */
const buildSEOData = (options) => {
    const {
        title,
        description,
        keywords,
        image,
        path,
        structuredData,
        product
    } = options;
    
    const baseUrl = process.env.BASE_URL || 'https://campusmart.com';
    const canonicalUrl = `${baseUrl}${path}`;
    
    const seoData = {
        pageTitle: title,
        pageDescription: truncateForMeta(description),
        pageKeywords: keywords,
        canonicalUrl: canonicalUrl,
        currentPath: path,
        ...generateOGData({ title, description, image, url: canonicalUrl }),
        ...generateTwitterData({ title, description, image })
    };
    
    // Add product structured data if product is provided
    if (product) {
        seoData.structuredData = generateProductStructuredData(product);
    } else if (structuredData) {
        seoData.structuredData = structuredData;
    }
    
    return seoData;
};

/**
 * Extract keywords from text
 * @param {string} text - Text to extract keywords from
 * @param {number} count - Number of keywords to extract
 * @returns {string} Comma-separated keywords
 */
const extractKeywords = (text, count = 10) => {
    if (!text) return '';
    
    // Common words to exclude
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might'
    ]);
    
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Count frequency
    const frequency = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Sort by frequency and take top N
    const topWords = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([word]) => word);
    
    return topWords.join(', ');
};

module.exports = {
    generateSlug,
    truncateForMeta,
    generateProductStructuredData,
    generateOGData,
    generateTwitterData,
    buildSEOData,
    extractKeywords
};
