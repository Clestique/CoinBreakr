# Brand Website

A professional Next.js marketing website for mobile expense splitting application. This website serves as the brand presence and marketing landing page - the actual services and functionality are available only through the mobile app.

## 🎯 Purpose

This website is designed for **brand image and marketing purposes only**. It serves as:

- **Brand Showcase**: Professional presentation of the application
- **Marketing Landing Page**: Convert visitors to app downloads
- **Information Hub**: Features, benefits, and app information
- **Trust Building**: Privacy policy, contact information, and support
- **SEO Presence**: Search engine visibility for the brand

**Note**: All expense splitting functionality is exclusively available in the mobile application. This website does not provide any transactional or service features.

## ✨ Key Features

### 🎨 Brand & Design
- **Professional Design**: Clean, trustworthy design with custom brand colors
- **Responsive Layout**: Fully responsive design that works on all devices
- **Brand Consistency**: Consistent color scheme and typography throughout
- **Visual Hierarchy**: Clear information architecture and user flow

### 🚀 Performance & SEO
- **SEO Optimized**: Comprehensive meta tags and semantic HTML structure
- **Fast Performance**: Built with Next.js 16 and optimized for speed
- **Core Web Vitals**: Optimized for Google's performance metrics
- **Mobile-First**: Optimized for mobile user experience

### ♿ Accessibility & UX
- **WCAG Compliant**: Proper ARIA labels and keyboard navigation
- **User Experience**: Intuitive navigation and clear call-to-actions
- **Cross-Browser**: Compatible with all modern browsers
- **Progressive Enhancement**: Works without JavaScript enabled

## 📱 Website Sections

### 🏠 Homepage
- **Hero Section**: Compelling value proposition and app download CTA
- **Features Overview**: Key benefits and functionality highlights
- **How It Works**: Simple explanation of the app usage flow
- **Download Section**: App store links and social proof
- **Trust Indicators**: User statistics and ratings

### 📄 Supporting Pages
- **Contact**: Contact form and support information
- **FAQ**: Frequently asked questions about the app
- **Privacy Policy**: Comprehensive privacy policy for app users
- **Terms of Service**: Legal terms and conditions
- **Release Notes**: App updates and version history with launch countdown

### 🧭 Navigation & UX
- **Sticky Header**: Easy navigation with app download CTA
- **Mobile Menu**: Responsive navigation for mobile devices
- **Footer**: Links to all pages and social media
- **Smooth Scrolling**: Enhanced user experience with smooth transitions

## 🛠️ Technical Stack

### Core Technologies
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS 4 for utility-first styling
- **Icons**: Custom SVG icons and Heroicons

### Development Tools
- **ESLint**: Code linting and quality assurance
- **PostCSS**: CSS processing and optimization
- **TypeScript**: Static type checking
- **Next.js Config**: Optimized build configuration

### Design System
- **Custom Color Palette**: Brand-specific color scheme
- **Typography**: Inter font family for readability
- **Component Library**: Reusable React components
- **Responsive Breakpoints**: Mobile-first responsive design

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone and navigate to website directory:**
   ```bash
   cd website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```bash
   # Development server will be available at:
   http://localhost:3000
   ```

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📁 Project Structure

```
website/
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── contact/             # Contact page
│   │   │   └── page.tsx
│   │   ├── faq/                 # FAQ page
│   │   │   └── page.tsx
│   │   ├── privacy/             # Privacy policy page
│   │   │   └── page.tsx
│   │   ├── terms/               # Terms of service page
│   │   │   └── page.tsx
│   │   ├── release/             # Release notes page
│   │   │   └── page.tsx
│   │   ├── globals.css          # Global styles and CSS variables
│   │   ├── layout.tsx           # Root layout with metadata
│   │   ├── page.tsx             # Homepage
│   │   ├── sitemap.ts           # SEO sitemap generation
│   │   └── favicon.ico          # Website favicon
│   ├── components/              # Reusable React components
│   │   ├── Header.tsx           # Navigation header
│   │   ├── Footer.tsx           # Website footer
│   │   ├── Hero.tsx             # Homepage hero section
│   │   ├── Features.tsx         # Features showcase
│   │   ├── HowItWorks.tsx       # Process explanation
│   │   └── Download.tsx         # App download section
│   └── lib/                     # Utility functions and helpers
├── public/                      # Static assets
├── tailwind.config.js           # Tailwind CSS configuration
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This documentation
```

## 🎨 Design System

### Color Palette
```css
/* Primary Brand Colors */
--primary-50: #F0FDFA;
--primary-500: #14B8A6;  /* Main brand color */
--primary-700: #0F766E;  /* Darker variant */

/* Background Colors */
--background-primary: #FFFFFF;
--background-secondary: #F8FAFC;
--background-tertiary: #F1F5F9;

/* Text Colors */
--text-primary: #0F172A;
--text-secondary: #334155;
--text-tertiary: #64748B;
```

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold weights (600-700)
- **Body Text**: Regular weight (400)
- **Responsive Sizing**: Mobile-first approach

### Components
- **Cards**: Elevated surfaces with hover effects
- **Buttons**: Primary and secondary variants
- **Forms**: Consistent input styling
- **Navigation**: Responsive header and footer

### Environment Variables
```bash
# Create .env.local for local development
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_APP_STORE_URL=https://apps.apple.com/app/your-app
NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=your.app
```

## ⚙️ Customization

### Brand Configuration

1. **Update Brand Colors:**
   ```css
   /* In src/app/globals.css */
   :root {
     --primary-500: #your-brand-color;
     --primary-700: #your-darker-color;
   }
   ```

2. **Update Tailwind Config:**
   ```js
   // In tailwind.config.js
   theme: {
     extend: {
       colors: {
         primary: {
           500: '#your-brand-color',
           700: '#your-darker-color',
         }
       }
     }
   }
   ```

### Content Updates

1. **Homepage Content:**
   - Hero section: `src/components/Hero.tsx`
   - Features: `src/components/Features.tsx`
   - How it works: `src/components/HowItWorks.tsx`

2. **App Store Links:**
   - Header: `src/components/Header.tsx`
   - Download section: `src/components/Download.tsx`

3. **SEO Metadata:**
   - Root layout: `src/app/layout.tsx`
   - Individual pages: respective `page.tsx` files

### Adding New Pages

1. **Create page directory:**
   ```bash
   mkdir src/app/new-page
   ```

2. **Add page component:**
   ```tsx
   // src/app/new-page/page.tsx
   export default function NewPage() {
     return <div>New Page Content</div>
   }
   ```

3. **Update navigation:**
   - Add link to `src/components/Header.tsx`
   - Add link to `src/components/Footer.tsx`

## 📊 SEO & Analytics

### Built-in SEO Features
- **Meta Tags**: Comprehensive meta tag configuration
- **Open Graph**: Social media sharing optimization
- **Twitter Cards**: Twitter-specific meta tags
- **Sitemap**: Automatic sitemap generation
- **Robots.txt**: Search engine crawling instructions

### Analytics Integration
```tsx
// Add to src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 🔧 Development Guidelines

### Code Style
- **TypeScript**: Use strict type checking
- **ESLint**: Follow configured linting rules
- **Components**: Use functional components with hooks
- **Styling**: Prefer Tailwind utility classes

### Performance Best Practices
- **Image Optimization**: Use Next.js Image component
- **Code Splitting**: Leverage Next.js automatic code splitting
- **Bundle Analysis**: Use `@next/bundle-analyzer`
- **Core Web Vitals**: Monitor and optimize performance metrics

### Accessibility Guidelines
- **Semantic HTML**: Use proper HTML elements
- **ARIA Labels**: Add descriptive labels for screen readers
- **Keyboard Navigation**: Ensure all interactive elements are accessible
- **Color Contrast**: Maintain WCAG AA compliance

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Styling Issues
```bash
# Rebuild Tailwind CSS
npm run build

# Check Tailwind configuration
npx tailwindcss --help
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update type definitions
npm update @types/node @types/react @types/react-dom
```

## � Recent Fegatures & Components

### ⏰ Launch Countdown System
- **CountdownTimer Component**: Real-time countdown timer with days, hours, minutes, seconds
- **Launch Integration**: Integrated countdown in Download section and Release page
- **Dynamic Updates**: Live countdown that updates every second
- **Completion Handling**: Automatic callback when countdown reaches zero

### 📱 Beta Testing Integration
- **AndroidDownloadButton**: Smart download button for beta testing
- **Environment Configuration**: Testing app URL stored in `.env` file
- **User Flow**: Direct users to beta testing while countdown is active
- **Seamless Transition**: Automatic switch to production app store after launch

### 🎨 Enhanced UI Components
- **Improved Contrast**: Better visibility for countdown timer with white background
- **Brand Colors**: Consistent use of teal (`#14B8A6`) throughout components
- **Responsive Design**: All components work seamlessly across devices
- **Accessibility**: Proper ARIA labels and keyboard navigation support

### ⚙️ Environment Variables
```bash
# Beta testing configuration
NEXT_PUBLIC_TESTING_APP_URL=https://play.google.com/apps/testing/com.splitlyr.app
NEXT_PUBLIC_API_URL=http://staging.splitlyr.clestiq.com:3000
```

### 🔧 Component Architecture
```
Components Structure:
├── CountdownTimer.tsx       # Reusable countdown with customizable styling
├── AndroidDownloadButton.tsx # Beta testing download functionality  
├── Download.tsx            # Main download section with countdown integration
├── Features.tsx            # Updated feature list (removed non-implemented features)
├── ContactForm.tsx         # Contact form with API integration
└── Header/Footer.tsx       # Navigation with absolute path links
```

### 📊 Content Management
- **Feature Accuracy**: Removed non-implemented features (receipt upload, full offline mode)
- **Realistic Messaging**: Updated from marketing claims to actual app capabilities
- **Beta Communication**: Clear messaging about beta testing availability
- **Launch Timing**: Flexible countdown system for launch date management

## 📈 Monitoring & Maintenance

### Performance Monitoring
- **Core Web Vitals**: Monitor LCP, FID, CLS
- **Lighthouse**: Regular performance audits
- **Bundle Size**: Monitor JavaScript bundle size
- **Loading Speed**: Track page load times

### Content Updates
- **Regular Reviews**: Update content quarterly
- **App Store Links**: Keep download links current
- **Feature Updates**: Sync with mobile app releases
- **Legal Pages**: Review privacy policy and terms annually
- **Countdown Management**: Update launch dates in environment variables
- **Beta Testing**: Monitor and update testing app URLs as needed

## 🔗 Integration with Mobile App

### App Download Flow
1. **Website Visitor**: Lands on marketing website
2. **Value Proposition**: Learns about app features and benefits
3. **Download CTA**: Clicks app store download button
4. **App Installation**: Downloads and installs mobile app
5. **App Usage**: Uses actual expense splitting functionality in app

### Data Flow
- **Website**: Marketing and information only
- **Mobile App**: All user data and functionality
- **No Data Sharing**: Website doesn't access app data
- **Separate Systems**: Independent deployment and maintenance

---

**Website Purpose**: Brand marketing and app promotion only  
**Actual Services**: Available exclusively in mobile application  
**Next.js Version**: 16.0.0  
**Target Audience**: Potential app users and brand awareness