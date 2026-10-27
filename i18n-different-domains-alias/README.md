# `differentDomains` drops a page's route alias on the domain's own locale

Source: not reported yet.

A page with `definePageMeta({ alias: '/' })` is served at `/` on every domain up to `@nuxtjs/i18n` 10.4.1. From 10.5.0, with `differentDomains` and the default `prefix_except_default` strategy, `/` returns 404 on each domain. The page itself still renders at its own path.

The route table after `i18n:plugin` shows why. On each domain, the domain's locale route is unprefixed but has no alias, while the other locale keeps a prefixed alias (`/de/` on `example.com`):

```
example.com
  products-category___de /de/ (alias of /de/products/:category?)
  products-category___de /de/products/:category?
  products-category___en /products/:category?
```

Two changes combine:

- **Build (10.6.0).** `resolveDefaultLocales()` returns `[]` for domain setups under the `*_default` strategies, so every locale gets prefixed routes and `localizeAliases()` turns the alias `/` into `/en/` and `/de/`. Only the `___default` variants keep `/`.
- **Runtime (since 10.5.0).** `setupMultiDomainLocales()` now also runs for `differentDomains`. It removes all `___default` variants, then unprefixes the domain locale's routes with `router.addRoute({ ...route, path })`.
  - `router.getRoutes()` also returns alias records, with the same `name` as their main record.
  - A normalized record has no `alias` key, so the re-added route has no alias.
  - Re-adding a name first calls `removeRoute(name)`, which removes that route's aliases too.
  - The main record and its alias record therefore replace each other, and the main record wins.

## Environment

- Node 24.19.0, pnpm 12.6.0.
- `nuxt` 4.6.2, `vue-router` 5.4.0.
- `@nuxtjs/i18n` 10.6.0 here and 10.4.1 in the control (`../i18n-different-domains-alias-10.4.1`).
- Production build (`nuxt build`, `node .output/server/index.mjs`). Requests pick the domain through the `Host` header.

## Verify

```sh
git clone --depth 1 --branch repro/i18n-different-domains-alias https://github.com/adamkasper/repros.git
cd repros
node verify.mjs --routes
```

`verify.mjs` installs and builds both fixtures. On `example.com` and `example.de` it checks that `/products` renders the page, then requests `/`. `--routes` prints the route table from the `x-repro-routes` header.

- **Expected:** `/` renders the products page on both domains.
- **Actual (this fixture, 10.6.0):**

  ```
  i18n-different-domains-alias: example.com/products -> 200, example.com/ -> 404 (expected 404)
  i18n-different-domains-alias: example.de/products -> 200, example.de/ -> 404 (expected 404)
  ```

- **Control (10.4.1):**

  ```
  i18n-different-domains-alias-10.4.1: example.com/products -> 200, example.com/ -> 200 (expected 200)
  i18n-different-domains-alias-10.4.1: example.de/products -> 200, example.de/ -> 200 (expected 200)
  ```

## Why each part is here

- `nuxt.config.ts`: the smallest `differentDomains` setup, two locales on their own domains, both `domainDefault`. Domains have no protocol, so the protocol matching fixed in 10.6.0 doesn't play a part.
- `app/pages/products/[[category]].vue`: the aliased page.
- `app/plugins/route-table.server.ts`: instrumentation only. It runs after `i18n:plugin` and puts the route table into the `x-repro-routes` response header.
