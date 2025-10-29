# Splitlyr Website

A professional Next.js website for the Splitlyr mobile expense splitting app.

## Features

- **Modern Design**: Clean, trustworthy design with gradient accents
- **Responsive**: Fully responsive design that works on all devices
- **SEO Optimized**: Proper meta tags and semantic HTML structure
- **Fast Performance**: Built with Next.js 15 and optimized for speed
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation

## Pages

- **Home**: Hero section, features overview, how it works, and download CTA
- **Privacy Policy**: Comprehensive privacy policy for the app
- **Contact**: Contact form and company information

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Icons**: Heroicons (SVG)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── contact/
│   │   └── page.tsx
│   ├── privacy/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
└── components/
    ├── Download.tsx
    ├── Features.tsx
    ├── Footer.tsx
    ├── Header.tsx
    ├── Hero.tsx
    └── HowItWorks.tsx
```

## Deployment

The website can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **AWS Amplify**
- **Google Cloud Platform**

## Customization

### Colors
The website uses a blue-to-purple gradient theme. You can customize colors in:
- Tailwind classes throughout components
- CSS custom properties in `globals.css`

### Content
Update content in the respective component files:
- Hero section: `src/components/Hero.tsx`
- Features: `src/components/Features.tsx`
- Privacy policy: `src/app/privacy/page.tsx`

### App Store Links
Update the app store URLs in:
- `src/components/Header.tsx`
- `src/components/Hero.tsx`
- `src/components/Download.tsx`

## License

This project is part of the Splitlyr application suite.