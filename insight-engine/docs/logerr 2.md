Initializing builder ...

Cloning source code from git ...

Using token authentication (x-access-token)

🔧 Pre-processing Dockerfile...

🔌 Initializing build environment...

⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile: 33.58kB done

#1 DONE 0.1s

#2 [internal] load metadata for docker.io/library/node:20-alpine

#2 DONE 0.6s

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

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 27.26MB / 43.23MB 0.2s

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.3s done

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#4 ...

#5 [internal] load build context

#5 transferring context: 86.96MB 0.7s done

#5 DONE 0.8s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 1.0s done

#4 DONE 1.4s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.0s done

#4 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 0.0s done

#4 DONE 1.4s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 0.507 (1/3) Installing musl-obstack (1.2.3-r2)

#6 0.550 (2/3) Installing libucontext (1.3.3-r0)

#6 0.553 (3/3) Installing gcompat (1.1.0-r4)

#6 0.603 OK: 11.0 MiB in 21 packages

#6 DONE 0.9s

#7 [builder 1/4] WORKDIR /app

#7 DONE 0.9s

#8 [deps 2/4] WORKDIR /app

#8 DONE 0.1s

#9 [deps 3/4] COPY package.json package-lock.json* ./

#9 DONE 0.0s

#10 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#10 DONE 0.2s

#11 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#11 DONE 0.1s

#12 [deps 4/4] RUN npm ci

#12 0.955 npm warn EBADENGINE Unsupported engine {

#12 0.955 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#12 0.955 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#12 0.955 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#12 0.955 npm warn EBADENGINE }

#12 7.952 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#12 17.18

#12 17.18 added 827 packages, and audited 828 packages in 17s

#12 17.18

#12 17.18 209 packages are looking for funding

#12 17.18   run `npm fund` for details

#12 17.18

#12 17.18 2 vulnerabilities (1 moderate, 1 high)

#12 17.18

#12 17.18 To address all issues, run:

#12 17.18   npm audit fix

#12 17.18

#12 17.18 Run `npm audit` for details.

#12 17.18 npm notice

#12 17.18 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#12 17.18 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#12 17.18 npm notice To update run: npm install -g npm@11.12.1

#12 17.18 npm notice

#12 DONE 37.2s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 6.2s

#14 [builder 3/4] COPY . .

#14 DONE 0.6s

#15 [builder 4/4] RUN npm run build

#15 0.489

#15 0.489 > insight-engine@0.1.0 build

#15 0.489 > next build

#15 0.489

#15 2.150 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 2.151 This information is used to shape Next.js' roadmap and prioritize features.

#15 2.151 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 2.151 https://nextjs.org/telemetry

#15 2.151

#15 2.171 ▲ Next.js 16.1.7 (Turbopack)

#15 2.171 - Experiments (use with caution):

#15 2.171   · proxyClientMaxBodySize: "50mb"

#15 2.171

#15 2.266 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

#15 2.421   Creating an optimized production build ...

#15 39.25 ✓ Compiled successfully in 36.1s

#15 39.26   Running TypeScript ...

#15 71.45 Failed to compile.

#15 71.45

#15 71.45 ./src/components/public/yukirin/YukirinChatPanel.tsx:259:12

#15 71.45 Type error: Type '"navigate_admin"' is not comparable to type '"navigate" | "highlight" | "scroll" | "open_modal" | "start_tour" | "show_survey" | "quick_replies"'.

#15 71.45

#15 71.45   257 |         router.push(action.target)

#15 71.45   258 |         break

#15 71.45 > 259 |       case 'navigate_admin': {

#15 71.45       |            ^

#15 71.45   260 |         // 從 pathname 提取租戶 slug 再組合後台路徑

#15 71.45   261 |         const m = pathname?.match(/^\/insight-admin\/([^/]+)/)

#15 71.45   262 |         const slug = m?.[1]

#15 71.60 Next.js build worker exited with code: 1 and signal: null

#15 71.76 npm notice

#15 71.76 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 71.76 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 71.76 npm notice To update run: npm install -g npm@11.12.1

#15 71.76 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

71.45       |            ^

71.45   260 |         // 從 pathname 提取租戶 slug 再組合後台路徑

71.45   261 |         const m = pathname?.match(/^\/insight-admin\/([^/]+)/)

71.45   262 |         const slug = m?.[1]

71.60 Next.js build worker exited with code: 1 and signal: null

71.76 npm notice

71.76 npm notice New major version of npm available! 10.8.2 -> 11.12.1

71.76 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

71.76 npm notice To update run: npm install -g npm@11.12.1

71.76 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1