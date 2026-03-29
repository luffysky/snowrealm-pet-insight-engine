Initializing builder ...

Cloning source code from git ...

Using token authentication (x-access-token)

🔧 Pre-processing Dockerfile...

🔌 Initializing build environment...

⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile: 27.43kB done

#1 DONE 0.0s

#2 [internal] load metadata for docker.io/library/node:20-alpine

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 resolve docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c 0.0s done

#4 sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 446B / 446B 0.0s done

#4 sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 1.26MB / 1.26MB 0.0s done

#4 sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 3.86MB / 3.86MB 0.0s done

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 0.1s done

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 28.31MB / 43.23MB 0.2s

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.3s done

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#4 ...

#5 [internal] load build context

#5 transferring context: 47.30MB 0.4s done

#5 DONE 0.5s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 0.9s done

#4 DONE 1.4s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.0s done

#4 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 done

#4 DONE 1.4s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 0.543 (1/3) Installing musl-obstack (1.2.3-r2)

#6 0.620 (2/3) Installing libucontext (1.3.3-r0)

#6 0.622 (3/3) Installing gcompat (1.1.0-r4)

#6 0.664 OK: 11.0 MiB in 21 packages

#6 ...

#7 [builder 1/4] WORKDIR /app

#7 DONE 1.2s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 DONE 1.2s

#8 [deps 2/4] WORKDIR /app

#8 DONE 0.1s

#9 [deps 3/4] COPY package.json package-lock.json* ./

#9 DONE 0.0s

#10 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#10 DONE 0.2s

#11 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#11 DONE 0.1s

#12 [deps 4/4] RUN npm ci

#12 1.002 npm warn EBADENGINE Unsupported engine {

#12 1.002 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#12 1.002 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#12 1.002 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#12 1.002 npm warn EBADENGINE }

#12 11.81 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#12 21.22

#12 21.22 added 785 packages, and audited 786 packages in 21s

#12 21.22

#12 21.22 208 packages are looking for funding

#12 21.22   run `npm fund` for details

#12 21.22

#12 21.22 2 vulnerabilities (1 moderate, 1 high)

#12 21.22

#12 21.22 To address all issues, run:

#12 21.22   npm audit fix

#12 21.22

#12 21.22 Run `npm audit` for details.

#12 21.22 npm notice

#12 21.22 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#12 21.22 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#12 21.22 npm notice To update run: npm install -g npm@11.12.1

#12 21.22 npm notice

#12 DONE 38.5s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 7.1s

#14 [builder 3/4] COPY . .

#14 DONE 1.0s

#15 [builder 4/4] RUN npm run build

#15 0.693

#15 0.693 > insight-engine@0.1.0 build

#15 0.693 > next build

#15 0.693

#15 3.941 ⚠ `experimental.middlewareClientMaxBodySize` is deprecated. Please use `experimental.proxyClientMaxBodySize` instead in next.config.ts.

#15 3.950 ⚠ Invalid next.config.ts options detected:

#15 3.950 ⚠     Unrecognized key(s) in object: 'serverBodySizeLimit' at "experimental"

#15 3.950 ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config

#15 3.984 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 3.984 This information is used to shape Next.js' roadmap and prioritize features.

#15 3.984 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 3.984 https://nextjs.org/telemetry

#15 3.984

#15 4.020 ▲ Next.js 16.1.7 (Turbopack)

#15 4.020 - Experiments (use with caution):

#15 4.020   · middlewareClientMaxBodySize: "50mb"

#15 4.020   ? serverBodySizeLimit (invalid experimental key)

#15 4.020

#15 4.237   Creating an optimized production build ...

#15 37.82 ✓ Compiled successfully in 32.3s

#15 37.83   Running TypeScript ...

#15 68.41 Failed to compile.

#15 68.41

#15 68.41 ./next.config.ts:7:5

#15 68.41 Type error: Object literal may only specify known properties, and 'serverBodySizeLimit' does not exist in type 'ExperimentalConfig'.

#15 68.41

#15 68.41    5 |   reactCompiler: true,

#15 68.41    6 |   experimental: {

#15 68.41 >  7 |     serverBodySizeLimit: '50mb',

#15 68.41      |     ^

#15 68.41    8 |     middlewareClientMaxBodySize: '50mb',

#15 68.41    9 |   },

#15 68.41   10 |   images: {

#15 68.65 Next.js build worker exited with code: 1 and signal: null

#15 68.88 npm notice

#15 68.88 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 68.88 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 68.88 npm notice To update run: npm install -g npm@11.12.1

#15 68.88 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

68.41      |     ^

68.41    8 |     middlewareClientMaxBodySize: '50mb',

68.41    9 |   },

68.41   10 |   images: {

68.65 Next.js build worker exited with code: 1 and signal: null

68.88 npm notice

68.88 npm notice New major version of npm available! 10.8.2 -> 11.12.1

68.88 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

68.88 npm notice To update run: npm install -g npm@11.12.1

68.88 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1