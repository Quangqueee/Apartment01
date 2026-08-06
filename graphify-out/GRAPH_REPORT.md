# Graph Report - .  (2026-08-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 828 nodes · 1735 edges · 87 communities (37 shown, 50 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e7ad5495`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.ts
- use-toast.ts
- apartment-form.tsx
- sidebar.tsx
- auth-service.ts
- devDependencies
- errors.ts
- compilerOptions
- actions.ts
- cn
- card.tsx
- image-lightbox.tsx
- data-client.ts
- components.json
- data.ts
- apartment-details-page-client.tsx
- menubar.tsx
- chart.tsx
- users/page.tsx
- react
- utils.ts
- dependencies
- apartments/page.tsx
- contact-card.tsx
- filter-controls.tsx
- user-nav.tsx
- generate-listing-summary.ts
- server-init.ts
- ApartmentDetailsPageClient
- accordion.tsx
- tabs.tsx
- @radix-ui/react-tabs
- class-variance-authority
- clsx
- date-fns
- date-fns-tz
- @dnd-kit/core
- @dnd-kit/sortable
- dotenv
- embla-carousel-react
- firebase
- firebase-admin
- framer-motion
- genkit
- @genkit-ai/next
- hono
- @hookform/resolvers
- lucide-react
- next
- next.config.js
- node-cache
- @opentelemetry/exporter-jaeger
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-tooltip
- react-day-picker
- react-markdown
- react-phone-number-input
- recharts
- sharp
- tailwind-merge
- tailwindcss-animate
- uuid
- postcss.config.mjs
- genkit.ts
- global.d.ts
- tailwind.config.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 77 edges
2. `cn()` - 71 edges
3. `useToast()` - 28 edges
4. `useAuth()` - 23 edges
5. `db` - 18 edges
6. `Button` - 17 edges
7. `compilerOptions` - 17 edges
8. `useUser()` - 16 edges
9. `Apartment` - 14 edges
10. `Header()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `ImageLightbox()` --references--> `jszip`  [EXTRACTED]
  src/components/image-lightbox.tsx → package.json
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useSidebar()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json

## Import Cycles
- 3-file cycle: `src/context/auth-context.tsx -> src/firebase/index.ts -> src/firebase/client-provider.tsx -> src/context/auth-context.tsx`

## Communities (87 total, 50 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.05
Nodes (53): AboutSection(), fetchApartmentsAction(), AdminLayoutContent(), PageProps, revalidate, UserData, beVietnamPro, metadata (+45 more)

### Community 1 - "use-toast.ts"
Cohesion: 0.06
Nodes (53): AddBookingModal(), removeVietnameseTones(), CancelConfirmModal(), DeleteConfirmModal(), DetailsModal(), formatBookingTime(), formatCreationDate(), NoteModal() (+45 more)

### Community 2 - "apartment-form.tsx"
Cohesion: 0.06
Nodes (42): ACCEPTED_IMAGE_TYPES, ApartmentForm(), ApartmentFormProps, compressImage(), createInitialPreviewItems(), createPreviewId(), flattenImageSources(), formSchema (+34 more)

### Community 3 - "sidebar.tsx"
Cohesion: 0.06
Nodes (39): formatNotificationTime(), NOTIFICATION_ICONS, NotificationBell(), PopoverContent, Separator, SheetContent, SheetContentProps, SheetDescription (+31 more)

### Community 4 - "auth-service.ts"
Cohesion: 0.08
Nodes (19): ForgotPasswordPage(), LoginContent(), ResetPasswordContent(), SignupContent(), useUserRole(), confirmResetPassword(), getCurrentUserRole(), login() (+11 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (38): genkit-cli, devDependencies, genkit-cli, patch-package, postcss, tailwindcss, @tailwindcss/typography, @types/node (+30 more)

### Community 6 - "errors.ts"
Cohesion: 0.09
Nodes (19): FirebaseErrorListener(), AppEvents, Callback, errorEmitter, buildAuthObject(), buildErrorMessage(), buildRequestObject(), FirebaseAuthObject (+11 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (30): react-dom, react-dom, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node (+22 more)

### Community 8 - "actions.ts"
Cohesion: 0.11
Nodes (24): apartmentActionSchema, apartmentBaseSchema, checkFavoriteStatusAction(), createUserDocument(), deleteApartmentAction(), flattenImageUrls(), generateSummarySchema, getUnmigratedAiApartmentsAction() (+16 more)

### Community 9 - "cn"
Cohesion: 0.15
Nodes (19): DocNode, docsTree, SOPDocsPage(), NavLink(), Button, ButtonProps, buttonVariants, Calendar() (+11 more)

### Community 10 - "card.tsx"
Cohesion: 0.15
Nodes (12): ApartmentForm, EditApartmentPageProps, ApartmentForm, PENDING_BOOKING_COLLECTIONS, ApartmentFormSkeleton(), Card, CardContent, CardDescription (+4 more)

### Community 11 - "image-lightbox.tsx"
Cohesion: 0.16
Nodes (17): ApartmentImageGallery(), ApartmentImageGalleryProps, ImageLightbox(), ImageLightboxProps, Carousel, CarouselApi, CarouselContent, CarouselContext (+9 more)

### Community 12 - "data-client.ts"
Cohesion: 0.19
Nodes (16): Home(), FavoritesListClient(), FavoritesListClientProps, apartmentsCollection, { firestore }, getApartmentById(), getApartments(), getFullFavoriteApartments() (+8 more)

### Community 13 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 14 - "data.ts"
Cohesion: 0.19
Nodes (15): createOrUpdateApartmentAction(), uploadAndCleanupImages(), ApartmentPage(), generateMetadata(), apartmentsCollection, createApartment(), getApartmentById(), getFavoriteApartments() (+7 more)

### Community 15 - "apartment-details-page-client.tsx"
Cohesion: 0.14
Nodes (7): getRoomTypeLabel(), montserrat, titleFont, ClientFormattedDate(), ClientFormattedDateProps, Progress, ROOM_TYPES

### Community 16 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 17 - "chart.tsx"
Cohesion: 0.12
Nodes (13): react, react, useCarousel(), ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent (+5 more)

### Community 18 - "users/page.tsx"
Cohesion: 0.19
Nodes (13): ManageableRole, UserData, Badge(), BadgeProps, badgeVariants, Table, TableBody, TableCaption (+5 more)

### Community 19 - "react"
Cohesion: 0.13
Nodes (9): react, Alert, AlertDescription, AlertTitle, alertVariants, RadioGroup, RadioGroupItem, Slider (+1 more)

### Community 20 - "utils.ts"
Cohesion: 0.19
Nodes (8): montserrat, titleFont, AuthModal(), Checkbox, ScrollArea, ScrollBar, formatPrice(), formatRelativeTime()

### Community 21 - "dependencies"
Cohesion: 0.18
Nodes (12): @genkit-ai/googleai, openai, dependencies, @genkit-ai/google-genai, @genkit-ai/googleai, openai, @radix-ui/react-switch, react-hook-form (+4 more)

### Community 22 - "apartments/page.tsx"
Cohesion: 0.36
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 23 - "contact-card.tsx"
Cohesion: 0.29
Nodes (5): ContactCardProps, Avatar, AvatarFallback, AvatarImage, TooltipContent

### Community 24 - "filter-controls.tsx"
Cohesion: 0.27
Nodes (8): DEFAULT_FILTERS, FilterControls(), FilterState, parsePriceInput(), Hero(), PRICE_FILTER_MAX, PRICE_FILTER_MIN, serializePriceRange()

### Community 25 - "user-nav.tsx"
Cohesion: 0.29
Nodes (8): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSubContent, DropdownMenuSubTrigger

### Community 26 - "generate-listing-summary.ts"
Cohesion: 0.28
Nodes (7): generateListingSummary(), generateSlug(), groq, tokenWindow, waitForTokenBudget(), generateSummaryAction(), migrateAiApartmentsBatchAction()

### Community 27 - "server-init.ts"
Cohesion: 0.36
Nodes (5): getApartmentEntries(), sitemap(), firebaseConfig, auth, firestore

### Community 28 - "ApartmentDetailsPageClient"
Cohesion: 0.29
Nodes (4): jszip, jszip, PageProps, ApartmentDetailsPageClient()

### Community 29 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 30 - "tabs.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 31 - "@radix-ui/react-tabs"
Cohesion: 0.67
Nodes (3): @radix-ui/react-tabs, @radix-ui/react-toast, @radix-ui/react-tabs

## Knowledge Gaps
- **289 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+284 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `compilerOptions`, `chart.tsx`, `ApartmentDetailsPageClient`, `@radix-ui/react-tabs`, `class-variance-authority`, `clsx`, `date-fns`, `date-fns-tz`, `@dnd-kit/core`, `@dnd-kit/sortable`, `dotenv`, `embla-carousel-react`, `firebase`, `firebase-admin`, `framer-motion`, `genkit`, `@genkit-ai/next`, `hono`, `@hookform/resolvers`, `lucide-react`, `next`, `node-cache`, `@opentelemetry/exporter-jaeger`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-tooltip`, `react-day-picker`, `react-markdown`, `react-phone-number-input`, `recharts`, `sharp`, `tailwind-merge`, `tailwindcss-animate`, `uuid`?**
  _High betweenness centrality (0.299) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `index.ts`, `use-toast.ts`, `apartment-form.tsx`, `sidebar.tsx`, `auth-service.ts`, `errors.ts`, `compilerOptions`, `cn`, `card.tsx`, `image-lightbox.tsx`, `data-client.ts`, `apartment-details-page-client.tsx`, `menubar.tsx`, `chart.tsx`, `users/page.tsx`, `utils.ts`, `apartments/page.tsx`, `contact-card.tsx`, `filter-controls.tsx`, `user-nav.tsx`, `ApartmentDetailsPageClient`, `accordion.tsx`, `tabs.tsx`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._
- **Why does `react` connect `chart.tsx` to `use-toast.ts`, `image-lightbox.tsx`, `dependencies`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _289 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05289450484866295 - nodes in this community are weakly interconnected._
- **Should `use-toast.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `apartment-form.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06095791001451379 - nodes in this community are weakly interconnected._