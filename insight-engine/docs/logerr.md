🔧 Pre-processing Dockerfile...

🔌 Initializing build environment...

⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile: 33.58kB done

#1 DONE 0.0s

#2 [internal] load metadata for docker.io/library/node:20-alpine

#2 DONE 1.1s

#3 [internal] load .dockerignore

#3 transferring context: 2B done

#3 DONE 0.0s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 resolve docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c 0.0s done

#4 sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 446B / 446B 0.0s done

#4 sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 1.26MB / 1.26MB 0.0s done

#4 sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 3.86MB / 3.86MB 0.0s done

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 0.1s done

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 20.97MB / 43.23MB 0.2s

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.3s done

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#4 ...

#5 [internal] load build context

#5 transferring context: 86.96MB 0.7s done

#5 DONE 0.8s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 0.9s done

#4 DONE 1.4s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.0s done

#4 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 0.0s done

#4 DONE 1.4s

#6 [builder 1/4] WORKDIR /app

#6 DONE 1.2s

#7 [deps 1/4] RUN apk add --no-cache libc6-compat

#7 0.538 (1/3) Installing musl-obstack (1.2.3-r2)

#7 0.611 (2/3) Installing libucontext (1.3.3-r0)

#7 0.613 (3/3) Installing gcompat (1.1.0-r4)

#7 0.657 OK: 11.0 MiB in 21 packages

#7 DONE 1.2s

#8 [deps 2/4] WORKDIR /app

#8 DONE 0.1s

#9 [deps 3/4] COPY package.json package-lock.json* ./

#9 DONE 0.0s

#10 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#10 DONE 0.2s

#11 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#11 DONE 0.1s

#12 [deps 4/4] RUN npm ci

#12 0.988 npm warn EBADENGINE Unsupported engine {

#12 0.988 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#12 0.988 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#12 0.988 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#12 0.988 npm warn EBADENGINE }

#12 7.383 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#12 16.35

#12 16.35 added 827 packages, and audited 828 packages in 16s

#12 16.35

#12 16.35 209 packages are looking for funding

#12 16.35   run `npm fund` for details

#12 16.36

#12 16.36 2 vulnerabilities (1 moderate, 1 high)

#12 16.36

#12 16.36 To address all issues, run:

#12 16.36   npm audit fix

#12 16.36

#12 16.36 Run `npm audit` for details.

#12 16.36 npm notice

#12 16.36 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#12 16.36 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#12 16.36 npm notice To update run: npm install -g npm@11.12.1

#12 16.36 npm notice

#12 DONE 24.7s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 32.0s

#14 [builder 3/4] COPY . .

#14 DONE 1.8s

#15 [builder 4/4] RUN npm run build

#15 0.557

#15 0.557 > insight-engine@0.1.0 build

#15 0.557 > next build

#15 0.557

#15 2.056 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 2.056 This information is used to shape Next.js' roadmap and prioritize features.

#15 2.056 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 2.057 https://nextjs.org/telemetry

#15 2.057

#15 2.075 ▲ Next.js 16.1.7 (Turbopack)

#15 2.075 - Experiments (use with caution):

#15 2.075   · proxyClientMaxBodySize: "50mb"

#15 2.075

#15 2.153 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

#15 2.288   Creating an optimized production build ...

#15 40.81 ✓ Compiled successfully in 37.9s

#15 40.82   Running TypeScript ...

#15 75.07 Failed to compile.

#15 75.07

#15 75.07 ./src/lib/agent/pageTracker.ts:135:3

#15 75.07 Type error: Property 'isOwner' is missing in type '{ userId: string; nickname: string; isAdmin: boolean; selectedCharacter: "yukirin" | "riku"; currentPage: string; timeOnPage: number; scrollPosition: number; scrollSpeed: "normal" | "idle" | "fast" | "crazy"; ... 15 more ...; isWeekend: boolean; }' but required in type 'UserState'.

#15 75.07

#15 75.07   133 |   const dayOfWeek = now.getDay()

#15 75.07   134 |

#15 75.07 > 135 |   return {

#15 75.07       |   ^

#15 75.07   136 |     userId: opts.userId ?? '',

#15 75.07   137 |     nickname: opts.nickname ?? '',

#15 75.07   138 |     isAdmin: opts.isAdmin ?? false,

#15 75.22 Next.js build worker exited with code: 1 and signal: null

#15 75.37 npm notice

#15 75.37 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 75.37 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 75.37 npm notice To update run: npm install -g npm@11.12.1

#15 75.37 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

75.07       |   ^

75.07   136 |     userId: opts.userId ?? '',

75.07   137 |     nickname: opts.nickname ?? '',

75.07   138 |     isAdmin: opts.isAdmin ?? false,

75.22 Next.js build worker exited with code: 1 and signal: null

75.37 npm notice

75.37 npm notice New major version of npm available! 10.8.2 -> 11.12.1

75.37 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

75.37 npm notice To update run: npm install -g npm@11.12.1

75.37 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1