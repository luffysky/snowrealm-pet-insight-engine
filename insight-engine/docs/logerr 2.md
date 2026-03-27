Initializing builder ...

Cloning source code from git ...

Using token authentication (x-access-token)

🔧 Pre-processing Dockerfile...

🔌 Initializing build environment...

⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile: 26.73kB done

#1 DONE 0.0s

#2 [internal] load metadata for docker.io/library/node:20-alpine

#2 DONE 0.6s

#3 [internal] load .dockerignore

#3 transferring context: 2B done

#3 DONE 0.0s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 resolve docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c 0.0s done

#4 ...

#5 [internal] load build context

#5 transferring context: 7.37MB 0.1s done

#5 DONE 0.2s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 446B / 446B 0.0s done

#4 sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 1.26MB / 1.26MB 0.0s done

#4 sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 3.86MB / 3.86MB 0.0s done

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 33.55MB / 43.23MB 0.2s

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 0.1s done

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.2s done

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 0.9s done

#4 DONE 1.3s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.1s done

#4 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 0.0s done

#4 DONE 1.3s

#6 [builder 1/4] WORKDIR /app

#6 DONE 0.1s

#7 [deps 1/4] RUN apk add --no-cache libc6-compat

#7 ...

#8 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#8 DONE 0.1s

#9 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#9 DONE 0.2s

#7 [deps 1/4] RUN apk add --no-cache libc6-compat

#7 0.523 (1/3) Installing musl-obstack (1.2.3-r2)

#7 0.527 (2/3) Installing libucontext (1.3.3-r0)

#7 0.529 (3/3) Installing gcompat (1.1.0-r4)

#7 0.535 OK: 11.0 MiB in 21 packages

#7 DONE 0.6s

#10 [deps 2/4] WORKDIR /app

#10 DONE 0.0s

#11 [deps 3/4] COPY package.json package-lock.json* ./

#11 DONE 0.0s

#12 [deps 4/4] RUN npm ci

#12 1.011 npm warn EBADENGINE Unsupported engine {

#12 1.011 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#12 1.011 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#12 1.011 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#12 1.011 npm warn EBADENGINE }

#12 10.04 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#12 16.96

#12 16.96 added 749 packages, and audited 750 packages in 17s

#12 16.96

#12 16.96 192 packages are looking for funding

#12 16.96   run `npm fund` for details

#12 16.96

#12 16.96 2 vulnerabilities (1 moderate, 1 high)

#12 16.96

#12 16.96 To address all issues, run:

#12 16.96   npm audit fix

#12 16.96

#12 16.96 Run `npm audit` for details.

#12 16.96 npm notice

#12 16.96 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#12 16.96 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#12 16.96 npm notice To update run: npm install -g npm@11.12.1

#12 16.96 npm notice

#12 DONE 24.3s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 6.0s

#14 [builder 3/4] COPY . .

#14 DONE 0.4s

#15 [builder 4/4] RUN npm run build

#15 0.517

#15 0.517 > insight-engine@0.1.0 build

#15 0.517 > next build

#15 0.517

#15 2.152 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 2.152 This information is used to shape Next.js' roadmap and prioritize features.

#15 2.152 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 2.152 https://nextjs.org/telemetry

#15 2.152

#15 2.165 ▲ Next.js 16.1.7 (Turbopack)

#15 2.165

#15 2.350   Creating an optimized production build ...

#15 28.77 ✓ Compiled successfully in 25.8s

#15 28.81   Running TypeScript ...

#15 51.13   Collecting page data using 7 workers ...

#15 52.87 ⚠ Using edge runtime on a page currently disables static generation for that page

#15 53.14   Generating static pages using 7 workers (0/200) ...

#15 53.26   Generating static pages using 7 workers (50/200)

#15 53.50   Generating static pages using 7 workers (100/200)

#15 54.22   Generating static pages using 7 workers (150/200)

#15 54.34 ⨯ useSearchParams() should be wrapped in a suspense boundary at page "/super-login". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout

#15 54.34     at Q (/app/.next/server/chunks/ssr/node_modules_next_920e7746._.js:2:2111)

#15 54.34     at o (/app/.next/server/chunks/ssr/node_modules_next_920e7746._.js:4:5314)

#15 54.34     at g (/app/.next/server/chunks/ssr/_a11739e0._.js:1:601)

#15 54.34     at an (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:84360)

#15 54.34     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:86179)

#15 54.34     at al (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:107953)

#15 54.34     at as (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:105368)

#15 54.34     at aa (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:84712)

#15 54.34     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:86228)

#15 54.34     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:104708)

#15 54.34 Error occurred prerendering page "/super-login". Read more: https://nextjs.org/docs/messages/prerender-error

#15 54.34 Export encountered an error on /super-login/page: /super-login, exiting the build.

#15 54.42 ⨯ Next.js build worker exited with code: 1 and signal: null

#15 54.60 npm notice

#15 54.60 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 54.60 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 54.60 npm notice To update run: npm install -g npm@11.12.1

#15 54.60 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

54.34     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:86228)

54.34     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:104708)

54.34 Error occurred prerendering page "/super-login". Read more: https://nextjs.org/docs/messages/prerender-error

54.34 Export encountered an error on /super-login/page: /super-login, exiting the build.

54.42 ⨯ Next.js build worker exited with code: 1 and signal: null

54.60 npm notice

54.60 npm notice New major version of npm available! 10.8.2 -> 11.12.1

54.60 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

54.60 npm notice To update run: npm install -g npm@11.12.1

54.60 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1