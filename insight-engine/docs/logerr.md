Initializing builder ...

Cloning source code from git ...

Using token authentication (x-access-token)

🔧 Pre-processing Dockerfile...

🔌 Initializing build environment...

⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile:

#1 transferring dockerfile: 27.43kB done

#1 DONE 0.3s

#2 [internal] load metadata for docker.io/library/node:20-alpine

#2 DONE 0.6s

#3 [internal] load .dockerignore

#3 transferring context: 2B done

#3 DONE 0.0s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 resolve docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c 0.0s done

#4 sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 446B / 446B 0.0s done

#4 sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 1.26MB / 1.26MB 0.0s done

#4 sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 3.86MB / 3.86MB 0.1s done

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 15.73MB / 43.23MB 0.2s

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 0.2s done

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.4s done

#4 ...

#5 [internal] load build context

#5 transferring context: 47.87MB 0.5s done

#5 DONE 0.6s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 1.2s done

#4 DONE 1.7s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.2s done

#4 DONE 2.0s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 0.1s done

#4 DONE 2.1s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 0.881 (1/3) Installing musl-obstack (1.2.3-r2)

#6 0.989 (2/3) Installing libucontext (1.3.3-r0)

#6 0.992 (3/3) Installing gcompat (1.1.0-r4)

#6 1.040 OK: 11.0 MiB in 21 packages

#6 ...

#7 [builder 1/4] WORKDIR /app

#7 DONE 3.3s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 DONE 3.3s

#8 [deps 2/4] WORKDIR /app

#8 DONE 0.1s

#9 [deps 3/4] COPY package.json package-lock.json* ./

#9 DONE 0.1s

#10 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#10 DONE 0.2s

#11 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#11 DONE 0.2s

#12 [deps 4/4] RUN npm ci

#12 1.088 npm warn EBADENGINE Unsupported engine {

#12 1.088 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#12 1.088 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#12 1.088 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#12 1.088 npm warn EBADENGINE }

#12 10.61 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#12 19.00

#12 19.00 added 785 packages, and audited 786 packages in 19s

#12 19.00

#12 19.00 208 packages are looking for funding

#12 19.00   run `npm fund` for details

#12 19.01

#12 19.01 2 vulnerabilities (1 moderate, 1 high)


#12 19.01

#12 19.01 To address all issues, run:

#12 19.01   npm audit fix

#12 19.01

#12 19.01 Run `npm audit` for details.

#12 19.01 npm notice

#12 19.01 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#12 19.01 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#12 19.01 npm notice To update run: npm install -g npm@11.12.1

#12 19.01 npm notice

#12 DONE 30.3s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 5.9s

#14 [builder 3/4] COPY . .

#14 DONE 0.5s

#15 [builder 4/4] RUN npm run build

#15 0.451

#15 0.451 > insight-engine@0.1.0 build

#15 0.451 > next build

#15 0.451

#15 2.079 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 2.079 This information is used to shape Next.js' roadmap and prioritize features.

#15 2.079 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 2.079 https://nextjs.org/telemetry

#15 2.079

#15 2.092 ▲ Next.js 16.1.7 (Turbopack)

#15 2.092 - Experiments (use with caution):

#15 2.092   · proxyClientMaxBodySize: "50mb"

#15 2.092

#15 2.509

#15 2.510 > Build error occurred

#15 2.515 Error: Both middleware file "./src/src/middleware.ts" and proxy file "./src/src/proxy.ts" are detected. Please use "./src/src/proxy.ts" only. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

#15 2.515     at ignore-listed frames

#15 2.534 npm notice

#15 2.534 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 2.534 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 2.534 npm notice To update run: npm install -g npm@11.12.1

#15 2.534 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

2.092

2.509

2.510 > Build error occurred

2.515 Error: Both middleware file "./src/src/middleware.ts" and proxy file "./src/src/proxy.ts" are detected. Please use "./src/src/proxy.ts" only. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

2.515     at ignore-listed frames

2.534 npm notice

2.534 npm notice New major version of npm available! 10.8.2 -> 11.12.1

2.534 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

2.534 npm notice To update run: npm install -g npm@11.12.1

2.534 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1