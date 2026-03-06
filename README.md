# AI Briefs

AI news and breakthroughs explained in plain English. No jargon. No hype. Just what matters, every week.

**Live site:** [getaibriefs.com](https://getaibriefs.com)

## Tech Stack

- **Framework:** [Astro](https://astro.build) (static site generation)
- **Content:** Markdown / MDX with Zod-validated schemas
- **Styling:** Vanilla CSS with CSS custom properties
- **Newsletter:** Beehiiv (embedded subscribe forms)
- **Fonts:** Atkinson Hyperlegible

## Getting Started

```sh
npm install
npm run dev        # Start dev server at localhost:4321
npm run build      # Build production site to ./dist/
npm run preview    # Preview production build locally
```

## Project Structure

```
src/
├── assets/          # Images (optimized at build time)
├── components/      # Astro components (Header, Footer, Newsletter, etc.)
├── content/blog/    # Markdown articles with frontmatter schema
├── layouts/         # BlogPost layout
├── pages/           # Routes (index, blog, about, privacy, 404, RSS)
├── styles/          # Global CSS
└── consts.ts        # Site-wide constants
```

## Content

Articles are written in Markdown inside `src/content/blog/`. Each article requires frontmatter matching the schema in `src/content.config.ts`:

```yaml
---
title: "Article Title"
description: "SEO description"
pubDate: 2026-03-01
updatedDate: 2026-03-01
category: "ai-explained"  # ai-explained | future-of-work | how-ai-works | ai-news | comparisons | guides
tags: ["tag1", "tag2"]
readingTime: "6 min read"
faqs:
  - question: "Question?"
    answer: "Answer."
---
```

## Newsletter

Newsletter forms are powered by Beehiiv. The embed is in `src/components/Newsletter.astro` and `src/components/Footer.astro`. To update the form, replace the iframe `src` URL with your Beehiiv form URL.

## License

All rights reserved.
