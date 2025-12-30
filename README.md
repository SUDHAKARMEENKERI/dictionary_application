# DictionaryApplication

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.15.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## ng deploy --base-href="dictionary_application" 

## SEO-friendly URLs (Important for deployment)

This app uses path-based routing (e.g. `/quiz`) which is more SEO-friendly than hash URLs.

When deploying to a static host or a server that serves the Angular `index.html`, you must configure a rewrite/fallback so that refreshing a deep link works:

- **Nginx**: `try_files $uri $uri/ /index.html;`
- **Netlify**: add a `public/_redirects` with `/* /index.html 200`
- **Vercel**: add a rewrite to `index.html`

Without this, direct navigation to URLs like `/quiz` may return 404 from the server.

## GitHub Pages deployment (SPA routing)

GitHub Pages does not support server-side rewrites. This project includes a GitHub Pages SPA fallback:

- [public/404.html](public/404.html): redirects deep links to `/?/...`
- [src/index.html](src/index.html): restores the original route before Angular boots

Make sure your deploy base href matches your repo name. Default is configured as:

- `baseHref`: `/dictionary_application/` in [angular.json](angular.json)

If your repository name is different, update `baseHref` accordingly.

Also update the sitemap base URL placeholder in [public/sitemap.xml](public/sitemap.xml):

- Replace `YOUR_GITHUB_USERNAME` and (if needed) `dictionary_application`.

## Ads (Google AdSense)

This project includes an AdSense integration that is **disabled by default**.

1) Open [src/environments/environment.prod.ts](src/environments/environment.prod.ts)
2) Set:

- `adsenseEnabled: true`
- `adsenseClient: 'ca-pub-XXXXXXXXXXXXXXX'`

### Auto Ads

If you enable **Auto Ads** in your AdSense dashboard, simply enabling the script is enough.

### Manual ad slots (optional)

Use the standalone component [src/app/shared/adsense-ad/adsense-ad.component.ts](src/app/shared/adsense-ad/adsense-ad.component.ts)
and add it to any page where you want an ad unit. Example inputs:

- `adSlot`: your AdSense slot id
- `adClient`: optional (usually omit; the script client is used)


### npm run deploy:gh --> 1st run this command 
### npm run deploy --> Next run this comman(might work this command only)

Note: Angular is an SPA, so ads are refreshed on route navigation automatically.
