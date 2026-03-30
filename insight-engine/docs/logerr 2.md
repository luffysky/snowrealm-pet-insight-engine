Initializing builder ...

Cloning source code from git ...

Using token authentication (x-access-token)

🔧 Pre-processing Dockerfile...

🔌 Initializing build environment...

⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile: 27.99kB done

#1 DONE 0.0s

#2 [internal] load metadata for docker.io/library/node:20-alpine

#2 DONE 0.7s

#3 [internal] load .dockerignore

#3 transferring context: 2B done

#3 DONE 0.0s

#4 [internal] load build context

#4 DONE 0.0s

#5 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#5 resolve docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#5 resolve docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c 0.0s done

#5 DONE 0.1s

#4 [internal] load build context

#4 transferring context: 65.18MB 0.8s done

#4 DONE 0.9s

#5 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#5 sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 446B / 446B 0.0s done

#5 sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 1.26MB / 1.26MB 0.0s done

#5 sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 3.86MB / 3.86MB 0.1s done

#5 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 0.2s done

#5 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.4s done

#5 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#5 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 1.3s done

#5 DONE 1.9s

#5 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#5 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.1s done

#5 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 0.0s done

#5 DONE 1.9s

#6 [builder 1/4] WORKDIR /app

#6 DONE 0.8s

#7 [deps 1/4] RUN apk add --no-cache libc6-compat

#7 0.867 (1/3) Installing musl-obstack (1.2.3-r2)

#7 0.872 (2/3) Installing libucontext (1.3.3-r0)

#7 0.878 (3/3) Installing gcompat (1.1.0-r4)

#7 0.897 OK: 11.0 MiB in 21 packages

#7 DONE 1.0s

#8 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#8 DONE 0.2s

#9 [deps 2/4] WORKDIR /app

#9 DONE 0.1s

#10 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#10 DONE 0.2s

#11 [deps 3/4] COPY package.json package-lock.json* ./

#11 DONE 0.1s

#12 [deps 4/4] RUN npm ci

#12 1.447 npm warn EBADENGINE Unsupported engine {

#12 1.447 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#12 1.447 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#12 1.447 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#12 1.447 npm warn EBADENGINE }

#12 11.91 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#12 19.67

#12 19.67 added 801 packages, and audited 802 packages in 19s

#12 19.67

#12 19.67 208 packages are looking for funding

#12 19.67   run `npm fund` for details

#12 19.68

#12 19.68 2 vulnerabilities (1 moderate, 1 high)

#12 19.68

#12 19.68 To address all issues, run:

#12 19.68   npm audit fix

#12 19.68

#12 19.68 Run `npm audit` for details.

#12 19.68 npm notice

#12 19.68 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#12 19.68 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#12 19.68 npm notice To update run: npm install -g npm@11.12.1

#12 19.68 npm notice

#12 DONE 28.9s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 6.4s

#14 [builder 3/4] COPY . .

#14 DONE 0.6s

#15 [builder 4/4] RUN npm run build

#15 0.612

#15 0.612 > insight-engine@0.1.0 build

#15 0.612 > next build

#15 0.612

#15 4.349 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 4.349 This information is used to shape Next.js' roadmap and prioritize features.

#15 4.349 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 4.349 https://nextjs.org/telemetry

#15 4.349

#15 4.365 ▲ Next.js 16.1.7 (Turbopack)

#15 4.366 - Experiments (use with caution):

#15 4.366   · proxyClientMaxBodySize: "50mb"

#15 4.366

#15 4.463 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

#15 4.642   Creating an optimized production build ...

#15 44.54 ✓ Compiled successfully in 39.0s

#15 44.56   Running TypeScript ...

#15 75.04 Failed to compile.

#15 75.04

#15 75.04 ./src/app/(super-admin)/snowrealm-insight-ctrl/ai-settings/page.tsx:5:44

#15 75.04 Type error: Cannot find module '@/app/api/super-admin/ai-prompt/route' or its corresponding type declarations.

#15 75.04

#15 75.04   3 | import { useState, useEffect } from 'react'

#15 75.04   4 | import { Save, RotateCcw, Bot, Crown, TestTube2, Check } from 'lucide-react'

#15 75.04 > 5 | import type { YukirinPromptSettings } from '@/app/api/super-admin/ai-prompt/route'

#15 75.04     |                                            ^

#15 75.04   6 |

#15 75.04   7 | type Tab = 'user' | 'admin'

#15 75.04   8 |

#15 75.22 Next.js build worker exited with code: 1 and signal: null

#15 75.40 npm notice

#15 75.40 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 75.40 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 75.40 npm notice To update run: npm install -g npm@11.12.1

#15 75.40 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

75.04     |                                            ^

75.04   6 |

75.04   7 | type Tab = 'user' | 'admin'

75.04   8 |

75.22 Next.js build worker exited with code: 1 and signal: null

75.40 npm notice

75.40 npm notice New major version of npm available! 10.8.2 -> 11.12.1

75.40 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

75.40 npm notice To update run: npm install -g npm@11.12.1

75.40 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1