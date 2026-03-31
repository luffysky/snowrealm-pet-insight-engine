⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile: 33.58kB done

#1 DONE 0.1s

#2 [internal] load metadata for docker.io/library/node:20-alpine

#2 DONE 0.6s

#3 [internal] load .dockerignore

#3 transferring context: 2B done

#3 DONE 0.0s

#4 [internal] load build context

#4 DONE 0.0s

#5 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#5 resolve docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c 0.0s done

#5 DONE 0.0s

#5 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#5 DONE 0.1s

#4 [internal] load build context

#4 transferring context: 86.39MB 0.8s done

#4 DONE 0.9s

#5 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#5 sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 446B / 446B 0.0s done

#5 sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 1.26MB / 1.26MB 0.0s done

#5 sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 3.86MB / 3.86MB 0.1s done

#5 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 0.2s done

#5 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.3s done

#5 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#5 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 1.1s done

#5 DONE 1.6s

#5 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#5 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.0s done

#5 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 0.0s done

#5 DONE 1.7s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 0.733 (1/3) Installing musl-obstack (1.2.3-r2)

#6 0.754 (2/3) Installing libucontext (1.3.3-r0)

#6 0.756 (3/3) Installing gcompat (1.1.0-r4)

#6 0.773 OK: 11.0 MiB in 21 packages

#6 DONE 3.5s

#7 [builder 1/4] WORKDIR /app

#7 DONE 3.5s

#8 [deps 2/4] WORKDIR /app

#8 DONE 0.1s

#9 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#9 DONE 0.3s

#10 [deps 3/4] COPY package.json package-lock.json* ./

#10 DONE 0.1s

#11 [deps 4/4] RUN npm ci

#11 ...

#12 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#12 DONE 0.4s

#11 [deps 4/4] RUN npm ci

#11 1.104 npm warn EBADENGINE Unsupported engine {

#11 1.104 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#11 1.104 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#11 1.104 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#11 1.104 npm warn EBADENGINE }

#11 11.02 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#11 18.45

#11 18.45 added 827 packages, and audited 828 packages in 18s

#11 18.45

#11 18.45 209 packages are looking for funding

#11 18.45   run `npm fund` for details

#11 18.45

#11 18.45 2 vulnerabilities (1 moderate, 1 high)

#11 18.45

#11 18.45 To address all issues, run:

#11 18.45   npm audit fix

#11 18.45

#11 18.45 Run `npm audit` for details.

#11 18.45 npm notice

#11 18.45 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#11 18.45 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#11 18.45 npm notice To update run: npm install -g npm@11.12.1

#11 18.45 npm notice

#11 DONE 31.8s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 6.5s

#14 [builder 3/4] COPY . .

#14 DONE 1.1s

#15 [builder 4/4] RUN npm run build

#15 0.535

#15 0.535 > insight-engine@0.1.0 build

#15 0.535 > next build

#15 0.535

#15 2.211 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 2.211 This information is used to shape Next.js' roadmap and prioritize features.

#15 2.212 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 2.212 https://nextjs.org/telemetry

#15 2.212

#15 2.225 ▲ Next.js 16.1.7 (Turbopack)

#15 2.226 - Experiments (use with caution):

#15 2.226   · proxyClientMaxBodySize: "50mb"

#15 2.226

#15 2.299 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

#15 2.440   Creating an optimized production build ...

#15 40.19 ✓ Compiled successfully in 37.0s

#15 40.19   Running TypeScript ...

#15 67.29 Failed to compile.

#15 67.29

#15 67.29 ./src/lib/lineNotify.ts:108:20

#15 67.29 Type error: Property 'type' is missing in type 'Record<string, unknown>' but required in type 'LineMessage'.

#15 67.29

#15 67.29   106 |  */

#15 67.29   107 | function pushToAdmin(message: Record<string, unknown>): void {

#15 67.29 > 108 |   pushLineMessage([message]).catch((err) => {

#15 67.29       |                    ^

#15 67.29   109 |     console.error('[lineNotify pushToAdmin] 失敗:', err)

#15 67.29   110 |   })

#15 67.29   111 | }

#15 67.45 Next.js build worker exited with code: 1 and signal: null

#15 67.63 npm notice

#15 67.63 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 67.63 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 67.63 npm notice To update run: npm install -g npm@11.12.1

#15 67.63 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

67.29       |                    ^

67.29   109 |     console.error('[lineNotify pushToAdmin] 失敗:', err)

67.29   110 |   })

67.29   111 | }

67.45 Next.js build worker exited with code: 1 and signal: null

67.63 npm notice

67.63 npm notice New major version of npm available! 10.8.2 -> 11.12.1

67.63 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

67.63 npm notice To update run: npm install -g npm@11.12.1

67.63 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1