# Headless WordPress Setup

## Current Local Setup

1. Copy `.env.example` to `.env`.
2. Keep:
   - `NEXT_PUBLIC_WP_API_BASE_URL=https://ukrfish.org/wp-json`
3. Start frontend:
   - `npm run dev`

## Planned Production Split

- Frontend: `https://ukrfish.org`
- WordPress backend: `https://wp.ukrfish.org`

When WP is moved to subdomain, update:

- `NEXT_PUBLIC_WP_API_BASE_URL=https://wp.ukrfish.org/wp-json`
- Membership checkout URLs to the final PMPro endpoints.

## Legacy URL Redirect Strategy

Goal:

- old article URL: `https://ukrfish.org/<old-slug>`
- new URL: `https://ukrfish.org/news/<old-slug>`

### Nginx Example

```nginx
server {
  server_name ukrfish.org;

  # Known frontend routes should not be redirected.
  location ~ ^/(about|map|activities|membership|contact|news)(/.*)?$ {
    try_files $uri /index.html;
  }

  # Redirect one-segment legacy WordPress slugs to new news route.
  location ~ ^/([a-zA-Z0-9-_]+)/?$ {
    return 301 /news/$1;
  }

  location / {
    try_files $uri /index.html;
  }
}
```

### WordPress CORS

The live API already responds correctly for `http://localhost:5173`.
After switching to production frontend domain, ensure WP also allows:

- `https://ukrfish.org`

## Notes

- The frontend already handles client-side fallback from `/<slug>` to `/news/<slug>`.
- Server-side 301 redirects are still recommended for SEO and faster navigation.
