# SEO Quick Reference - CampusMart

## Quick Checklist ✅

### For Every New Page/Route:
```javascript
res.render("page.ejs", {
    pageTitle: "Page Title - CampusMart",
    pageDescription: "Description (155 chars max)",
    currentPath: req.path
});
```

### For Product Pages:
```javascript
const seoHelpers = require("../utils/seoHelpers");
const seoData = seoHelpers.buildSEOData({
    title: product.title + " - CampusMart",
    description: product.description,
    image: product.images[0].url,
    path: req.path,
    product: product
});
res.render("page.ejs", { product, ...seoData });
```

## Key Files Modified

| File | Changes |
|------|---------|
| `views/layouts/boilerplate.ejs` | Dynamic meta tags, OG, Twitter Cards, Schema |
| `controllers/products.js` | SEO data for all product pages |
| `controllers/users.js` | SEO data for user pages |
| `app.js` | Sitemap route |
| `public/robots.txt` | Crawler instructions |
| `utils/seoHelpers.js` | Utility functions |

## Important Meta Tags Reference

### Title (50-60 chars)
```html
<title>Product Name - Category | CampusMart</title>
```

### Description (155-160 chars)
```html
<meta name="description" content="Brief, compelling description...">
```

### Open Graph
```html
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="...">
<meta property="og:url" content="...">
```

## URL Structure (SEO-Friendly)

✅ **Good:**
- `/products`
- `/products/category/electronics`
- `/products/123abc`

❌ **Avoid:**
- `/prod.php?id=123`
- `/page?category=electronics&sort=asc`

## Content Guidelines

### Product Titles
- Be specific and descriptive
- Include brand/model if applicable
- 50-70 characters ideal

Example: "Apple MacBook Pro 13-inch 2020 - M1 Chip"

### Product Descriptions
- First 155 characters are crucial (meta description)
- Use relevant keywords naturally
- Include specifications
- Describe condition clearly

### Image Alt Text
```html
<img alt="Product Name - Category - Condition">
```
Not: `<img alt="image123">`

## Structured Data Types

### Product Schema
```json
{
  "@type": "Product",
  "name": "...",
  "description": "...",
  "image": [...],
  "offers": { "price": "...", "availability": "..." }
}
```

### WebSite Schema (Homepage)
```json
{
  "@type": "WebSite",
  "name": "CampusMart",
  "url": "https://campusmart.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "..."
  }
}
```

## Testing Tools

1. **Google Rich Results**: https://search.google.com/test/rich-results
2. **PageSpeed Insights**: https://pagespeed.web.dev/
3. **Meta Tags**: https://metatags.io/
4. **Lighthouse**: Built into Chrome DevTools

## Common Issues & Fixes

### Issue: Duplicate Title Tags
**Fix**: Ensure each page passes unique `pageTitle`

### Issue: Missing Meta Description
**Fix**: Always pass `pageDescription` to render

### Issue: Non-descriptive Alt Text
**Fix**: Use descriptive alt text: product name + context

### Issue: Slow Page Load
**Fix**: 
- Optimize images
- Use lazy loading
- Minimize JavaScript

### Issue: Broken Links
**Fix**: Regularly check with Google Search Console

## Best Practices Reminder

1. **Mobile-First**: Always test on mobile
2. **Page Speed**: Aim for <3s load time
3. **Unique Content**: Avoid duplicate descriptions
4. **Regular Updates**: Keep content fresh
5. **Internal Linking**: Link related products/pages
6. **HTTPS**: Always use secure connection
7. **Sitemap**: Update regularly (auto-generated)
8. **Alt Text**: Never skip image alt attributes

## Monitoring

### Weekly:
- Check Google Search Console for errors
- Review crawl stats
- Monitor Core Web Vitals

### Monthly:
- Analyze organic traffic trends
- Review top-performing pages
- Update meta descriptions for low CTR pages

### Quarterly:
- Comprehensive SEO audit
- Competitor analysis
- Content refresh

## Environment Variables

Required in `.env`:
```env
BASE_URL=https://your-domain.com
```

Used for:
- Canonical URLs
- Sitemap generation
- Open Graph URLs
- Structured data

## Quick Commands

### Test Sitemap
```
Visit: http://localhost:3000/sitemap.xml
```

### Test Robots.txt
```
Visit: http://localhost:3000/robots.txt
```

### Validate Structured Data
1. Visit product page
2. View source
3. Copy JSON-LD script
4. Test at: https://search.google.com/test/rich-results

## Need Help?

- See: `SEO_IMPROVEMENTS.md` for detailed documentation
- Check: `utils/seoHelpers.js` for utility functions
- Email: 23uj1a0504@mrem.ac.in

---

**Remember**: SEO is ongoing! Monitor, test, and improve continuously.

Last Updated: February 19, 2026
