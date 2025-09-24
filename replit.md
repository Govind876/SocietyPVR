# Overview

SocietyHub is a comprehensive society management platform designed to streamline residential community administration. The application serves three distinct user roles: super admins who manage multiple societies, admins who manage individual societies, and residents who interact with their community services. The platform handles resident management, maintenance requests through complaints, facility bookings, announcements, financial tracking, voting/polls, and marketplace features.

**Current State**: Fully imported and running in Replit environment with PostgreSQL database configured and schema pushed.

# Recent Changes

- **September 24, 2025**: GitHub project successfully imported to Replit
  - PostgreSQL database provisioned and schema pushed via Drizzle ORM
  - Simple authentication system configured (not using Replit Auth)
  - Frontend and backend properly configured to run on port 5000
  - Vite build system configured with `allowedHosts: true` for Replit proxy support
  - Deployment configuration set for autoscale deployment target

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client is built with React and TypeScript using Vite as the build tool. The architecture follows a component-based design with:

- **Component Library**: shadcn/ui components built on top of Radix UI primitives for consistent, accessible UI components
- **Styling**: Tailwind CSS with CSS variables for theme customization
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod for validation
- **Animations**: Framer Motion for smooth UI transitions

The frontend is organized into feature-based components with clear separation between UI components, pages, and business logic hooks.

## Backend Architecture

The server uses Express.js with TypeScript and follows a layered architecture:

- **API Layer**: RESTful endpoints with Express routers
- **Authentication**: Replit Auth integration with OpenID Connect for secure authentication
- **Data Access**: Storage abstraction layer that defines interfaces for all database operations
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple

The backend implements role-based access control with three distinct user types and their corresponding permissions.

## Database Architecture

The system uses PostgreSQL with Drizzle ORM for type-safe database operations:

- **Schema Design**: Well-normalized tables with proper relationships between users, societies, flats, complaints, facilities, and bookings
- **Type Safety**: Drizzle-Zod integration provides runtime validation that matches database schema
- **Enums**: PostgreSQL enums for user roles, complaint statuses, and booking statuses ensure data consistency

Key relationships include societies containing multiple flats and users, users creating complaints and bookings, and facilities belonging to specific societies.

## Authentication System

Authentication is currently handled through a simple authentication system (not Replit Auth):

- **Session-based Authentication**: Secure session management with PostgreSQL storage using connect-pg-simple
- **Role-based Authorization**: Middleware checks user roles before allowing access to protected routes
- **Simple Login/Signup**: Email/password authentication with role-based access control
- **Three User Roles**: super_admin, admin, resident with appropriate permissions

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL database hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations

## Authentication Services
- **Replit Auth**: OpenID Connect authentication provider
- **connect-pg-simple**: PostgreSQL session store for Express

## UI and Styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components for accessibility
- **Lucide React**: Icon library

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds

## Query and State Management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition