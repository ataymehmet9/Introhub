# AGENTS.md - IntroHub TanStack Start Application

## Core Principles

- **TypeScript First**: Strict mode, no implicit any.
- **Explicit > Implicit**: Prioritize clear, direct code over complex magic [10].
- **Server-First**: Use {Link: tRPC https://trpc.io/docs/} for API calls, data mutations, and database access [9].
- **Type Safety**: Use {Link: Zod https://ai-sdk.dev/docs/getting-started/tanstack-start} for validation and end-to-end type safety [9].

## Project Structure (File-based Routing)

- Routes live in `src/routes/`.
- Use `createFileRoute` for route definition [11].
- Use `loader` functions in routes to fetch data on the server [9].
- Components are in `src/components/`.

## Data Management

- **{Link: TanStack Query https://tanstack.com/query/latest/docs/framework/react/overview}**: Use `useQuery` and `useMutation` for client-side state.
- **Server Functions**: Use these for mutations and fetching, replacing REST/TRPC endpoints [9].
- **Caching**: Use proper query keys and staleTime/gcTime configurations [14].

## Styling and Components

- **Styling**: {Link: Tailwind CSS https://github.com/tailwindlabs/tailwindcss} with `cn()` utility for class merging.
- **UI**: {Link: Ecme https://ecme-react.themenate.net/guide/documentation/introduction} for components and the UI components are in `src/components/ui/`.
- **Rendering**: {Link: Markdown https://tanstack.com/start/latest/docs/framework/react/guide/rendering-markdown} should be rendered using `html-react-parser` [12].

## Best Practices

- **Errors**: Implement Error Boundaries for routes.
- **Performance**: Use `React.Suspense` for loading states [9].
- **Formatting**: {Link: Prettier } for linting/formatting [13].
- **Dependencies**: Use `pnpm` [1].

## Example Structure

src/
├── components/
├── routes/
│ ├── index.tsx
│ └── login.tsx
├── schemas/
├── services/
├── store/
└── utils/

## Key Considrations

- **Authentication**: Use `useAuth` hook for auth state management [10].
- **Routing**: Use `createFileRoute` for route definitions [11].
- **Data Fetching**: Use `useQuery` for fetching data [14].
- **Database**: Pair with Drizzle ORM for database operations [20].
- **Mutations**: Use `useMutation` for mutations [14].
- **Forms**: Use react-hook-form for all forms, and `useForm` for form handling [15].
- **Validation**: Always use `zod` for validation [16], especially in forms
- **State Management**: Use `zustand` for UI state management, however you MUST use Tanstack Query for Server state, DO NOT ADD SERVER STATE INTO ZUSTAND UI STATE [17].
- **Error Handling**: Use `react-error-boundary` for error handling [18].
- **Testing**: Use `vitest` for testing [19].
- **File Upload**: Use `better-upload` for file uploads. The full documentation is available for you at https://better-upload.com/llms-full.txt
- **Analytics**: Use `posthog` from Analytics [21] - Documentation is available at https://posthog.com/llms.txt
