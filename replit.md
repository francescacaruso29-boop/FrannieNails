# Frannie - Nail Salon Client Management System

## Overview
Frannie is a web application for nail salon client management, featuring a pink-themed UI, React frontend, and Express.js backend. It enables client authentication and provides an Instagram-style dashboard for viewing nail art, booking appointments, and managing profiles. The system streamlines client interactions, automates reminders via WhatsApp, and provides comprehensive management tools for salon owners, aiming to enhance client experience and operational efficiency in the nail salon industry.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, built with Vite.
- **UI/UX**: Radix UI components, shadcn/ui styling, and Tailwind CSS with a custom pink theme.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Form Handling**: React Hook Form with Zod validation.
- **Design Elements**: Animated SVG logo, accessible form components, toast notifications, and mobile-first responsive layouts.
- **Client Flow**: Unique code system for client authentication; all fields mandatory with Zod validation.
- **Dashboard**: Features an Instagram-style client gallery, calendar for booking, and profile management.
- **Calendar**: Italian localized, displays availability (red for booked, green for available), and integrates with automatic slot management.
- **Notifications**: Integrated push notifications (via Service Worker and WebSockets) for all user actions (booking, photo management, swaps) and automated WhatsApp/SMS reminders via Twilio.
- **Profile**: Instagram-style layout with customizable images, client financial tracking (credit/advance balance), and appointment history.

### Advanced Features (NEW - January 2025)
- **Onboarding System**: Contextual tooltips with interactive guidance for new users across all admin pages.
- **Theme Customization**: Dynamic color palette selector with real-time preview and preset themes (Pink Classic, Ocean Blue, Elegant Purple, Luxury Gold, Emerald Green).
- **AI Recommendation Engine**: Intelligent nail art suggestions based on user preferences, trends, and style compatibility with 95% match scoring.
- **Intelligent Comment Filtering**: Automatic detection and filtering of inappropriate content with sentiment analysis and spam detection (None/Moderate/Strict levels).
- **Batch Photo Actions**: Multi-select functionality for bulk approve/reject/delete/download/share operations on gallery photos.
- **Client Feedback Reel**: Auto-playing carousel of highlighted positive client reviews with rating statistics and sentiment analysis.
- **Smooth Micro-Interactions**: Enhanced hover effects, button animations, and fluid navigation transitions throughout the application.
- **Database Fallback System**: Seamless switch between PostgreSQL database and in-memory demo mode when database is unavailable.

### Backend
- **Runtime**: Node.js with Express.js and TypeScript.
- **Database**: PostgreSQL with Neon serverless database.
- **ORM**: Drizzle ORM for type-safe operations.
- **Session Management**: Express sessions with PostgreSQL store.
- **API Design**: RESTful endpoints with JSON responses.
- **Admin Panel**: Dedicated admin interface for client creation (with unique codes), appointment management, and comprehensive activity monitoring (appointments, photos, swap requests). Includes an optimized "fast calendar" for manual client booking.
- **Advanced Admin Gallery**: Enhanced with theme customization, AI recommendations, batch actions, and intelligent filtering. Supports real-time photo management with smooth navigation and micro-interactions.
- **Admin Swaps Page**: Complete appointment swap management with advanced UI features, theme customization, and onboarding guidance.
- **Swap System**: Implements a complete appointment swap system with database transactions and admin management.
- **Client Data Update**: API endpoint for clients to update their name and phone number.
- **Demo Mode Support**: Fully functional demo mode with sample data when database connection is unavailable, ensuring continuous service.

### Core System Decisions
- Emphasis on type safety (TypeScript, Zod, Drizzle ORM) across the stack.
- Optimized for performance with lightweight libraries and removal of heavy media (videos replaced with CSS gradients).
- Focus on mobile-first, responsive design with clean, professional UI elements.
- Secure authentication with unique client codes.
- WhatsApp-based communication system with automated reminders and notifications.
- **Advanced UX/UI Philosophy**: Zero animation preference respected, focus on smooth micro-interactions, contextual help, and intelligent automation.
- **Resilient Architecture**: Graceful database fallback ensuring 100% uptime with demo mode when needed.
- **Intelligent Content Management**: AI-powered recommendations and automatic content filtering for enhanced user experience.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL serverless database client.
- **drizzle-orm**: Type-safe ORM for database interactions.
- **@tanstack/react-query**: Server state management.
- **@radix-ui/***: Accessible UI component primitives.
- **react-hook-form**: Form management.
- **zod**: Runtime type validation.
- **Twilio**: For WhatsApp and SMS notifications.
- **node-cron**: For scheduling automated tasks (e.g., reminders).
- **date-fns**: For date manipulation and localization.

## Deployment Architecture

### Independent Deployment Solution
- **Railway**: Primary hosting platform (500h free/month, then $5/month)
- **Render**: Backup hosting (free tier with sleep mode)
- **Neon/Railway PostgreSQL**: Database hosting
- **Android Studio**: Native mobile app wrapper
- **Docker**: Containerized deployment option

### Mobile App
- **Android Studio project**: Complete WebView wrapper
- **Native permissions**: Camera, storage, geolocation
- **Offline caching**: Service worker implementation
- **Custom splash screen**: Brand-consistent loading experience
```