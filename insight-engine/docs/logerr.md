Initializing builder ...

Cloning source code from git ...

Using token authentication (x-access-token)

🔧 Pre-processing Dockerfile...

🔌 Initializing build environment...

⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile:

#1 transferring dockerfile: 27.71kB done

#1 DONE 0.4s

#2 [internal] load metadata for docker.io/library/node:20-alpine

#2 DONE 0.6s

#3 [internal] load .dockerignore

#3 transferring context: 2B done

#3 DONE 0.0s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 resolve docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c 0.0s done

#4 DONE 0.1s

#5 [internal] load build context

#5 transferring context: 64.80MB 1.3s done

#5 DONE 1.4s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 446B / 446B 0.1s done

#4 sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 1.26MB / 1.26MB 0.1s done

#4 sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 3.86MB / 3.86MB 0.1s done

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 0.4s done

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.6s done

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 2.4s done

#4 DONE 3.2s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.1s done

#4 DONE 3.3s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 0.1s done

#4 DONE 3.4s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 1.069 (1/3) Installing musl-obstack (1.2.3-r2)

#6 1.394 (2/3) Installing libucontext (1.3.3-r0)

#6 1.396 (3/3) Installing gcompat (1.1.0-r4)

#6 1.446 OK: 11.0 MiB in 21 packages

#6 ...

#7 [builder 1/4] WORKDIR /app

#7 DONE 21.8s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 DONE 21.8s

#8 [deps 2/4] WORKDIR /app

#8 DONE 0.1s

#9 [deps 3/4] COPY package.json package-lock.json* ./

#9 DONE 0.1s

#10 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#10 DONE 0.2s

#11 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#11 DONE 0.2s

#12 [deps 4/4] RUN npm ci

#12 1.518 npm warn EBADENGINE Unsupported engine {

#12 1.518 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#12 1.518 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#12 1.518 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#12 1.518 npm warn EBADENGINE }

#12 18.57 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#12 32.54

#12 32.54 added 801 packages, and audited 802 packages in 32s

#12 32.54

#12 32.54 208 packages are looking for funding

#12 32.54   run `npm fund` for details

#12 32.55

#12 32.55 2 vulnerabilities (1 moderate, 1 high)

#12 32.55

#12 32.55 To address all issues, run:

#12 32.55   npm audit fix

#12 32.55

#12 32.55 Run `npm audit` for details.

#12 32.55 npm notice

#12 32.55 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#12 32.55 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#12 32.55 npm notice To update run: npm install -g npm@11.12.1

#12 32.55 npm notice

#12 DONE 54.3s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 6.4s

#14 [builder 3/4] COPY . .

#14 DONE 0.6s

#15 [builder 4/4] RUN npm run build

#15 0.589

#15 0.589 > insight-engine@0.1.0 build

#15 0.589 > next build

#15 0.589

#15 2.276 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 2.277 This information is used to shape Next.js' roadmap and prioritize features.

#15 2.277 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 2.277 https://nextjs.org/telemetry

#15 2.277

#15 2.294 ▲ Next.js 16.1.7 (Turbopack)

#15 2.294 - Experiments (use with caution):

#15 2.294   · proxyClientMaxBodySize: "50mb"

#15 2.295

#15 2.373 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

#15 2.501   Creating an optimized production build ...

#15 43.18 ✓ Compiled successfully in 40s

#15 43.22   Running TypeScript ...

#15 69.79 Failed to compile.

#15 69.79

#15 69.79 ./src/app/api/guide/buy-turns/route.ts:64:29

#15 69.79 Type error: Property 'balance' does not exist on type '{ ok: boolean; newBalance?: number | undefined; error?: string | undefined; }'.

#15 69.79

#15 69.79   62 |     addedTurns: packDef.turns,

#15 69.79   63 |     totalCredits: creditRow?.credits ?? packDef.turns,

#15 69.79 > 64 |     newZcoinBalance: result.balance,

#15 69.79      |                             ^

#15 69.79   65 |   })

#15 69.79   66 | }

#15 69.79   67 |

#15 69.94 Next.js build worker exited with code: 1 and signal: null

#15 70.10 npm notice

#15 70.10 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 70.10 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 70.10 npm notice To update run: npm install -g npm@11.12.1

#15 70.10 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

69.79      |                             ^

69.79   65 |   })

69.79   66 | }

69.79   67 |

69.94 Next.js build worker exited with code: 1 and signal: null

70.10 npm notice

70.10 npm notice New major version of npm available! 10.8.2 -> 11.12.1

70.10 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

70.10 npm notice To update run: npm install -g npm@11.12.1

70.10 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1