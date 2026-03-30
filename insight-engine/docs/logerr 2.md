Initializing builder ...

Cloning source code from git ...

Using token authentication (x-access-token)

🔧 Pre-processing Dockerfile...

🔌 Initializing build environment...

⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile: 27.71kB done

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

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.3s done

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#4 ...

#5 [internal] load build context

#5 transferring context: 64.80MB 0.6s done

#5 DONE 0.6s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 0.9s done

#4 DONE 1.4s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.0s done

#4 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 0.0s done

#4 DONE 1.4s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 0.605 (1/3) Installing musl-obstack (1.2.3-r2)

#6 0.747 (2/3) Installing libucontext (1.3.3-r0)

#6 0.749 (3/3) Installing gcompat (1.1.0-r4)

#6 0.784 OK: 11.0 MiB in 21 packages

#6 ...

#7 [builder 1/4] WORKDIR /app

#7 DONE 3.9s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 DONE 3.9s

#8 [deps 2/4] WORKDIR /app

#8 DONE 0.1s

#9 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#9 DONE 0.3s

#10 [deps 3/4] COPY package.json package-lock.json* ./

#10 DONE 0.2s

#11 [deps 4/4] RUN npm ci

#11 ...

#12 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#12 DONE 0.2s

#11 [deps 4/4] RUN npm ci

#11 1.152 npm warn EBADENGINE Unsupported engine {

#11 1.152 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#11 1.152 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#11 1.152 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#11 1.152 npm warn EBADENGINE }

#11 13.43 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#11 20.70

#11 20.70 added 801 packages, and audited 802 packages in 20s

#11 20.70

#11 20.70 208 packages are looking for funding

#11 20.70   run `npm fund` for details

#11 20.71

#11 20.71 2 vulnerabilities (1 moderate, 1 high)

#11 20.71

#11 20.71 To address all issues, run:

#11 20.71   npm audit fix

#11 20.71

#11 20.71 Run `npm audit` for details.

#11 20.71 npm notice

#11 20.71 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#11 20.71 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#11 20.71 npm notice To update run: npm install -g npm@11.12.1

#11 20.71 npm notice

#11 DONE 36.1s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 6.4s

#14 [builder 3/4] COPY . .

#14 DONE 0.6s

#15 [builder 4/4] RUN npm run build

#15 0.549

#15 0.549 > insight-engine@0.1.0 build

#15 0.549 > next build

#15 0.549

#15 2.236 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 2.236 This information is used to shape Next.js' roadmap and prioritize features.

#15 2.236 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 2.236 https://nextjs.org/telemetry

#15 2.236

#15 2.250 ▲ Next.js 16.1.7 (Turbopack)

#15 2.250 - Experiments (use with caution):

#15 2.250   · proxyClientMaxBodySize: "50mb"

#15 2.250

#15 2.325 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

#15 2.452   Creating an optimized production build ...

#15 36.80 ✓ Compiled successfully in 33.7s

#15 36.81   Running TypeScript ...

#15 64.38 Failed to compile.

#15 64.38

#15 64.38 ./src/components/public/yukirin/YukirinChatPanel.tsx:106:18

#15 64.38 Type error: Property 'badge' does not exist on type '{ readonly key: "s"; readonly zcoins: 5; readonly turns: 20; readonly label: "20 次"; } | { readonly key: "m"; readonly zcoins: 10; readonly turns: 50; readonly label: "50 次"; } | { readonly key: "l"; readonly zcoins: 20; readonly turns: 120; readonly label: "120 次"; readonly badge: "最划算"; }'.

#15 64.38   Property 'badge' does not exist on type '{ readonly key: "s"; readonly zcoins: 5; readonly turns: 20; readonly label: "20 次"; }'.

#15 64.38

#15 64.38   104 |               }}

#15 64.38   105 |             >

#15 64.38 > 106 |               {p.badge && (

#15 64.38       |                  ^

#15 64.38   107 |                 <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] bg-[#b8a9e8] text-black rounded-full px-1.5 py-0 font-bold whitespace-nowrap">

#15 64.38   108 |                   {p.badge}

#15 64.38   109 |                 </span>

#15 64.53 Next.js build worker exited with code: 1 and signal: null

#15 64.67 npm notice

#15 64.67 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 64.67 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 64.67 npm notice To update run: npm install -g npm@11.12.1

#15 64.67 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

64.38       |                  ^

64.38   107 |                 <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] bg-[#b8a9e8] text-black rounded-full px-1.5 py-0 font-bold whitespace-nowrap">

64.38   108 |                   {p.badge}

64.38   109 |                 </span>

64.53 Next.js build worker exited with code: 1 and signal: null

64.67 npm notice

64.67 npm notice New major version of npm available! 10.8.2 -> 11.12.1

64.67 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

64.67 npm notice To update run: npm install -g npm@11.12.1

64.67 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1