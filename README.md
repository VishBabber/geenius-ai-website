# Geenius AI flat site

A static, dependency-free version of the Lovable/React site.
No build step, no framework, no npm. Every page is plain HTML you can open,
edit, and upload anywhere.

## Layout

```
index.html                    /            home
funnel.html                   /funnel
mycallhandler.html            /mycallhandler
databasereactivation.html     /databasereactivation
onboarding.html               /onboarding
showupscaler.html             /showupscaler
pricing.html                  /pricing
partnerpricing.html           /partnerpricing
bookacall.html                /bookacall
callcostcalculator.html       /callcostcalculator
callconfirmed.html            /callconfirmed
bookacall-personalised.html   /bookacall-personalised
bookacall-ai-demo.html        /bookacall-ai-demo
10things-ai-guide.html        /10things-ai-guide
404.html                      catch-all

assets/styles.css             the compiled Tailwind sheet from the original build
assets/site.css               styles for behaviour React used to apply at runtime
assets/site.js                the interactivity, rewritten without React (~700 lines)
assets/*.png|jpg              images, un-hashed
favicon.ico  robots.txt  sitemap.xml
```

## How it was made

Each route was rendered by the real React app in a headless browser and the
resulting DOM was captured as static HTML, so the markup and the compiled
Tailwind classes are exactly what the original produced. Anything React only
rendered on interaction, such as the form popups, the demo-widget panel and the
FAQ answers, was captured too and inlined in a closed state. Interactive elements
carry `data-gx="…"` hooks that `assets/site.js` binds to on load.

FAQ answers are now present in the HTML (collapsed with CSS) instead of being
mounted on click, so they are visible to crawlers.

## Editing

* **Text and layout.** Edit the HTML directly. Classes come from
  `assets/styles.css`, which is the compiled Tailwind output; utility classes
  that aren't already used somewhere in the site won't exist in it. To add a
  genuinely new utility, write the rule by hand in `assets/site.css`.
* **Behaviour.** `assets/site.js` is organised by feature (popups, demo widget,
  cookie consent, accordion, checkboxes, forms, tooltips, carousel, sliders, the
  two calculators, scroll buttons, video overlays, fade-in sections, parallax).
* **Don't remove `data-gx` attributes.** They're what the script binds to.

## Forms

Forms post JSON to the same LeadConnector webhooks as the original. The endpoint
and behaviour live on each `<form>`:

```html
<form data-gx-form="contact"
      data-gx-webhook="https://services.leadconnectorhq.com/hooks/…"
      data-gx-success="We'll call you shortly to demo Geenius AI."
      data-gx-error="Something went wrong. Please try again."
      data-gx-reset="1">
```

`data-gx-redirect` (used by the AI-guide lead magnet) sends the visitor to a URL
on success instead of showing a toast.

## Hosting

Upload the repository contents as-is. `index.html` at the root is the home page.

To keep the original clean URLs (`/pricing` rather than `/pricing.html`), most
hosts can do it with a rewrite rule, for example Netlify `_redirects`:

```
/pricing   /pricing.html   200
```

…or Cloudflare Pages / Vercel equivalents. Canonical tags and `sitemap.xml`
already point at the clean URLs on `https://ai.geeniusdigital.com`.

## Third-party pieces (unchanged)

* Meta Pixel `1123335949846125`, inline in every `<head>`
* LeadConnector booking iframes
* Testimonial videos on `storage.googleapis.com` / `assets.cdn.filesafe.space`

## Known quirk carried over from the original

On `showupscaler.html` the navbar's **Get Started** button does nothing. In the
React app that button called `window.showGeeniusForm()`, which only the home
page defined, so it was already dead there. It has been left as-is rather than
silently changed. To wire it to that page's popup, add `data-gx="open-popup"`
to the button.
