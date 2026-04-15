# IntroHub - TanStack Start Application

A modern contact management and introduction platform built with TanStack Start, featuring CRM integrations, real-time notifications, and subscription management.

## Features

- 🔐 **Authentication**: Secure auth with Better Auth (OAuth, email/password)
- 👥 **Contact Management**: Add, import, and manage contacts with bulk operations
- 🔄 **CRM Integrations**: Sync contacts from HubSpot (more CRMs coming soon)
- 📊 **Analytics Dashboard**: Real-time metrics and sync analytics
- 💳 **Subscription Management**: Stripe-powered subscription tiers
- 🔔 **Real-time Notifications**: Server-Sent Events (SSE) for live updates
- 📧 **Email Notifications**: Automated notifications for key events
- 🎨 **Modern UI**: Responsive design with Tailwind CSS and Ecme components

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 14+
- Redis 6+ (for background jobs)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/introhub

# Authentication
BETTER_AUTH_SECRET=your_secret_here # Generate with: npx @better-auth/cli secret

# HubSpot CRM Integration
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/crm/hubspot/callback

# Token Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key # Generate with: openssl rand -base64 32

# Redis (for background jobs)
REDIS_URL=redis://localhost:6379

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=noreply@yourdomain.com

# Stripe (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# PostHog Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Building For Production

```bash
pnpm build
pnpm start
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
pnpm test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Linting & Formatting

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
pnpm lint
pnpm format
pnpm check
```

## Setting up Better Auth

1. Generate and set the `BETTER_AUTH_SECRET` environment variable in your `.env.local`:

   ```bash
   npx @better-auth/cli secret
   ```

2. Visit the [Better Auth documentation](https://www.better-auth.com) to unlock the full potential of authentication in your app.

### Adding a Database (Optional)

Better Auth can work in stateless mode, but to persist user data, add a database:

```typescript
// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  // ... rest of config
})
```

Then run migrations:

```bash
npx @better-auth/cli migrate
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router'
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Link } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/people',
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json() as Promise<{
      results: {
        name: string
      }[]
    }>
  },
  component: () => {
    const data = peopleRoute.useLoaderData()
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    )
  },
})
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

### React-Query

React-Query is an excellent addition or alternative to route loading and integrating it into you application is a breeze.

First add your dependencies:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

Next we'll need to create a query client and provider. We recommend putting those in `main.tsx`.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ...

const queryClient = new QueryClient()

// ...

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)

  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
```

You can also add TanStack Query Devtools to the root route (optional).

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools />
    </>
  ),
})
```

Now you can use `useQuery` to fetch your data.

```tsx
import { useQuery } from '@tanstack/react-query'

import './App.css'

function App() {
  const { data } = useQuery({
    queryKey: ['people'],
    queryFn: () =>
      fetch('https://swapi.dev/api/people')
        .then((res) => res.json())
        .then((data) => data.results as { name: string }[]),
    initialData: [],
  })

  return (
    <div>
      <ul>
        {data.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
```

You can find out everything you need to know on how to use React-Query in the [React-Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview).

## State Management

Another common requirement for React applications is state management. There are many options for state management in React. TanStack Store provides a great starting point for your project.

First you need to add TanStack Store as a dependency:

```bash
pnpm add @tanstack/store
```

Now let's create a simple counter in the `src/App.tsx` file as a demonstration.

```tsx
import { useStore } from '@tanstack/react-store'
import { Store } from '@tanstack/store'
import './App.css'

const countStore = new Store(0)

function App() {
  const count = useStore(countStore)
  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
    </div>
  )
}

export default App
```

One of the many nice features of TanStack Store is the ability to derive state from other state. That derived state will update when the base state updates.

Let's check this out by doubling the count using derived state.

```tsx
import { useStore } from '@tanstack/react-store'
import { Store, Derived } from '@tanstack/store'
import './App.css'

const countStore = new Store(0)

const doubledStore = new Derived({
  fn: () => countStore.state * 2,
  deps: [countStore],
})
doubledStore.mount()

function App() {
  const count = useStore(countStore)
  const doubledCount = useStore(doubledStore)

  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
      <div>Doubled - {doubledCount}</div>
    </div>
  )
}

export default App
```

We use the `Derived` class to create a new store that is derived from another store. The `Derived` class has a `mount` method that will start the derived store updating.

Once we've created the derived store we can use it in the `App` component just like we would any other store using the `useStore` hook.

You can find out everything you need to know on how to use TanStack Store in the [TanStack Store documentation](https://tanstack.com/store/latest).

## CRM Integration

IntroHub supports syncing contacts from CRM platforms. Currently supported:

- ✅ **HubSpot** - Full contact sync with automatic updates

### Setting Up HubSpot Integration

1. Create a HubSpot app in the [Developer Portal](https://developers.hubspot.com/)
2. Configure OAuth with redirect URI: `http://localhost:3000/api/crm/hubspot/callback`
3. Add required scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`
4. Add credentials to `.env.local`
5. Users can connect via **CRM Integrations** page in the app

For detailed setup and usage instructions, see:

- [CRM Integration Guide](./documentation/crm-integration-guide.md)
- [CRM Deployment Guide](./documentation/crm-deployment-guide.md)

## Documentation

Comprehensive documentation is available in the `/documentation` folder:

- **CRM Integration**
  - [Complete Integration Guide](./documentation/crm-integration-guide.md)
  - [Production Deployment Guide](./documentation/crm-deployment-guide.md)
- **Features**
  - [Subscription System](./documentation/subscription-system-prd.md)
  - [Notification System](./documentation/notification-system.md)
  - [Email Notifications](./documentation/email-notifications.md)
  - [Dashboard Implementation](./documentation/dashboard-implementation-plan.md)
- **Development**
  - [Docker Setup](./documentation/docker-setup.md)
  - [Testing Guide](./documentation/subscription-testing-guide.md)
  - [SSE Architecture](./documentation/SSE_ARCHITECTURE.md)

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication forms
│   ├── layouts/        # Layout components
│   ├── shared/         # Shared/common components
│   └── ui/             # UI library components (Ecme)
├── db/                 # Database schema and migrations
├── integrations/       # Third-party integrations
│   └── trpc/          # tRPC API routes
├── routes/            # File-based routing
│   ├── api/           # API endpoints
│   └── _authenticated/ # Protected routes
├── services/          # Business logic services
├── schemas/           # Zod validation schemas
└── jobs/              # Background jobs
```

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)
- **API Layer**: [tRPC](https://trpc.io)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **Authentication**: [Better Auth](https://better-auth.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [Ecme](https://ecme-react.themenate.net)
- **Background Jobs**: [BullMQ](https://docs.bullmq.io)
- **Payments**: [Stripe](https://stripe.com)
- **Analytics**: [PostHog](https://posthog.com)

## Testing

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test src/__tests__/crm

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Deployment

See the [Production Deployment Guide](./documentation/PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions.

Quick deployment checklist:

- [ ] Configure environment variables
- [ ] Set up PostgreSQL database
- [ ] Set up Redis instance
- [ ] Run database migrations
- [ ] Configure HubSpot OAuth app
- [ ] Set up email service (optional)
- [ ] Configure Stripe webhooks (optional)
- [ ] Deploy application

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Learn More

- [TanStack Documentation](https://tanstack.com)
- [TanStack Start Guide](https://tanstack.com/start/latest)
- [Better Auth Documentation](https://better-auth.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
