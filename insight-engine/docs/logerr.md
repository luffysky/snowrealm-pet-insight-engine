Cloning source code from git ...

Using token authentication (x-access-token)

🔧 Pre-processing Dockerfile...

🔌 Initializing build environment...

⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile: 27.99kB done

#1 DONE 0.0s

#2 [internal] load metadata for docker.io/library/node:20-alpine

#2 DONE 0.6s

#3 [internal] load .dockerignore

#3 transferring context: 2B done

#3 DONE 0.0s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 resolve docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c done

#4 sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 446B / 446B 0.0s done

#4 sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 1.26MB / 1.26MB 0.0s done

#4 sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 3.86MB / 3.86MB 0.0s done

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 29.36MB / 43.23MB 0.2s

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 0.1s done

#4 ...

#5 [internal] load build context

#5 transferring context: 85.72MB 0.4s done

#5 DONE 0.4s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.3s done

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 0.8s done

#4 DONE 1.2s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.0s done

#4 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 done

#4 DONE 1.2s

#6 [builder 1/4] WORKDIR /app

#6 ...

#7 [deps 1/4] RUN apk add --no-cache libc6-compat

#7 0.467 (1/3) Installing musl-obstack (1.2.3-r2)

#7 0.569 (2/3) Installing libucontext (1.3.3-r0)

#7 0.571 (3/3) Installing gcompat (1.1.0-r4)

#7 0.652 OK: 11.0 MiB in 21 packages

#7 DONE 3.1s

#6 [builder 1/4] WORKDIR /app

#6 DONE 3.1s

#8 [deps 2/4] WORKDIR /app

#8 DONE 0.1s

#9 [deps 3/4] COPY package.json package-lock.json* ./

#9 DONE 0.0s

#10 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#10 DONE 0.2s

#11 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#11 DONE 0.1s

#12 [deps 4/4] RUN npm ci

#12 0.860 npm warn EBADENGINE Unsupported engine {

#12 0.860 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#12 0.860 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#12 0.860 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#12 0.860 npm warn EBADENGINE }

#12 7.157 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#12 14.29

#12 14.29 added 827 packages, and audited 828 packages in 14s

#12 14.29

#12 14.29 209 packages are looking for funding

#12 14.29   run `npm fund` for details

#12 14.29

#12 14.29 2 vulnerabilities (1 moderate, 1 high)

#12 14.29

#12 14.29 To address all issues, run:

#12 14.29   npm audit fix

#12 14.29

#12 14.29 Run `npm audit` for details.

#12 14.29 npm notice

#12 14.29 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#12 14.29 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#12 14.29 npm notice To update run: npm install -g npm@11.12.1

#12 14.29 npm notice

#12 DONE 25.8s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 9.3s

#14 [builder 3/4] COPY . .

#14 DONE 0.7s

#15 [builder 4/4] RUN npm run build

#15 0.436

#15 0.436 > insight-engine@0.1.0 build

#15 0.436 > next build

#15 0.436

#15 1.941 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 1.942 This information is used to shape Next.js' roadmap and prioritize features.

#15 1.942 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 1.942 https://nextjs.org/telemetry

#15 1.942

#15 1.952 ▲ Next.js 16.1.7 (Turbopack)

#15 1.952 - Experiments (use with caution):

#15 1.952   · proxyClientMaxBodySize: "50mb"

#15 1.952

#15 2.011 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

#15 2.129   Creating an optimized production build ...

#15 27.77

#15 27.77 > Build error occurred

#15 27.77 Error: Turbopack build failed with 4 errors:

#15 27.77 ./src/app/(public)/u/[userId]/page.tsx:9:1

#15 27.77 Export FLOATING_CHAT_ENABLED_KEY doesn't exist in target module

#15 27.77    7 | import { ArrowLeft, Globe, Heart, MessageSquare, Loader2, X, Settings, ChevronRight, Bell, MessageCircle, LayoutDashboard, BookOpen, Image, MoreHorizontal, Pencil, Trash2, Camera, Wallet, Library } from 'lucide-react';

#15 27.77    8 | import { UserAlbum } from '@/components/social/UserAlbum';

#15 27.77 >  9 | import { setFloatingChatEnabled, FLOATING_CHAT_ENABLED_KEY } from '@/components/social/FloatingChat';

#15 27.77      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

#15 27.77   10 | function stripHtml(html: string): string {

#15 27.77   11 |   return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

#15 27.77   12 | }

#15 27.77

#15 27.77 The export FLOATING_CHAT_ENABLED_KEY was not found in module [project]/src/components/social/FloatingChat.tsx [app-client] (ecmascript).

#15 27.77 Did you mean to import FloatingChat?

#15 27.77 All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

#15 27.77

#15 27.77 Import traces:

#15 27.77   Client Component Browser:

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Client Component Browser]

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Server Component]

#15 27.77

#15 27.77   Client Component SSR:

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Client Component SSR]

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Server Component]

#15 27.77

#15 27.77

#15 27.77 ./src/app/(public)/u/[userId]/page.tsx:8:1

#15 27.77 Export FLOATING_CHAT_ENABLED_KEY doesn't exist in target module

#15 27.77    6 | import { ArrowLeft, Globe, Heart, MessageSquare, Loader2, X, Settings, ChevronRight, Bell, MessageCircle, LayoutDashboard, BookOpen, Image, MoreHorizontal, Pencil, Trash2, Camera, Wallet, Library } from 'lucide-react'

#15 27.77    7 | import { UserAlbum } from '@/components/social/UserAlbum'

#15 27.77 >  8 | import { setFloatingChatEnabled, FLOATING_CHAT_ENABLED_KEY } from '@/components/social/FloatingChat'

#15 27.77      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

#15 27.77    9 |

#15 27.77   10 | function stripHtml(html: string): string {

#15 27.77   11 |   return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

#15 27.77

#15 27.77 The export FLOATING_CHAT_ENABLED_KEY was not found in module [project]/src/components/social/FloatingChat.tsx [app-ssr] (ecmascript).

#15 27.77 Did you mean to import FloatingChat?

#15 27.77 All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

#15 27.77

#15 27.77 Import traces:

#15 27.77   Client Component Browser:

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Client Component Browser]

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Server Component]

#15 27.77

#15 27.77   Client Component SSR:

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Client Component SSR]

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Server Component]

#15 27.77

#15 27.77

#15 27.77 ./src/app/(public)/u/[userId]/page.tsx:9:1

#15 27.77 Export setFloatingChatEnabled doesn't exist in target module

#15 27.77    7 | import { ArrowLeft, Globe, Heart, MessageSquare, Loader2, X, Settings, ChevronRight, Bell, MessageCircle, LayoutDashboard, BookOpen, Image, MoreHorizontal, Pencil, Trash2, Camera, Wallet, Library } from 'lucide-react';

#15 27.77    8 | import { UserAlbum } from '@/components/social/UserAlbum';

#15 27.77 >  9 | import { setFloatingChatEnabled, FLOATING_CHAT_ENABLED_KEY } from '@/components/social/FloatingChat';

#15 27.77      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

#15 27.77   10 | function stripHtml(html: string): string {

#15 27.77   11 |   return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

#15 27.77   12 | }

#15 27.77

#15 27.77 The export setFloatingChatEnabled was not found in module [project]/src/components/social/FloatingChat.tsx [app-client] (ecmascript).

#15 27.77 Did you mean to import FloatingChat?

#15 27.77 All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

#15 27.77

#15 27.77 Import traces:

#15 27.77   Client Component Browser:

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Client Component Browser]

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Server Component]

#15 27.77

#15 27.77   Client Component SSR:

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Client Component SSR]

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Server Component]

#15 27.77

#15 27.77

#15 27.77 ./src/app/(public)/u/[userId]/page.tsx:8:1

#15 27.77 Export setFloatingChatEnabled doesn't exist in target module

#15 27.77    6 | import { ArrowLeft, Globe, Heart, MessageSquare, Loader2, X, Settings, ChevronRight, Bell, MessageCircle, LayoutDashboard, BookOpen, Image, MoreHorizontal, Pencil, Trash2, Camera, Wallet, Library } from 'lucide-react'

#15 27.77    7 | import { UserAlbum } from '@/components/social/UserAlbum'

#15 27.77 >  8 | import { setFloatingChatEnabled, FLOATING_CHAT_ENABLED_KEY } from '@/components/social/FloatingChat'

#15 27.77      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

#15 27.77    9 |

#15 27.77   10 | function stripHtml(html: string): string {

#15 27.77   11 |   return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

#15 27.77

#15 27.77 The export setFloatingChatEnabled was not found in module [project]/src/components/social/FloatingChat.tsx [app-ssr] (ecmascript).

#15 27.77 Did you mean to import FloatingChat?

#15 27.77 All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

#15 27.77

#15 27.77 Import traces:

#15 27.77   Client Component Browser:

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Client Component Browser]

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Server Component]

#15 27.77

#15 27.77   Client Component SSR:

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Client Component SSR]

#15 27.77     ./src/app/(public)/u/[userId]/page.tsx [Server Component]

#15 27.77

#15 27.77

#15 27.77     at <unknown> (./src/app/(public)/u/[userId]/page.tsx:9:1)

#15 27.77     at <unknown> (./src/app/(public)/u/[userId]/page.tsx:8:1)

#15 27.77     at <unknown> (./src/app/(public)/u/[userId]/page.tsx:9:1)

#15 27.77     at <unknown> (./src/app/(public)/u/[userId]/page.tsx:8:1)

#15 27.99 npm notice

#15 27.99 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 27.99 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 27.99 npm notice To update run: npm install -g npm@11.12.1

#15 27.99 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

27.77

27.77     at <unknown> (./src/app/(public)/u/[userId]/page.tsx:9:1)

27.77     at <unknown> (./src/app/(public)/u/[userId]/page.tsx:8:1)

27.77     at <unknown> (./src/app/(public)/u/[userId]/page.tsx:9:1)

27.77     at <unknown> (./src/app/(public)/u/[userId]/page.tsx:8:1)

27.99 npm notice

27.99 npm notice New major version of npm available! 10.8.2 -> 11.12.1

27.99 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

27.99 npm notice To update run: npm install -g npm@11.12.1

27.99 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1