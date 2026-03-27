Initializing builder ...

Cloning source code from git ...

Using token authentication (x-access-token)

🔧 Pre-processing Dockerfile...

🔌 Initializing build environment...

⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile: 26.73kB done

#1 DONE 0.1s

#2 [internal] load metadata for docker.io/library/node:20-alpine

#2 DONE 0.6s

#3 [internal] load .dockerignore

#3 transferring context: 2B done

#3 DONE 0.0s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 resolve docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c 0.0s done

#4 ...

#5 [internal] load build context

#5 transferring context: 3.92MB 0.1s done

#5 DONE 0.2s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 446B / 446B 0.0s done

#4 sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 1.26MB / 1.26MB 0.0s done

#4 sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 3.86MB / 3.86MB 0.0s done

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 17.83MB / 43.23MB 0.2s

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 0.1s done

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 37.75MB / 43.23MB 0.3s

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.4s done

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 1.0s done

#4 DONE 1.5s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.0s done

#4 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 done

#4 DONE 1.6s

#6 [builder 1/4] WORKDIR /app

#6 DONE 0.6s

#7 [deps 1/4] RUN apk add --no-cache libc6-compat

#7 0.614 (1/3) Installing musl-obstack (1.2.3-r2)

#7 0.618 (2/3) Installing libucontext (1.3.3-r0)

#7 0.620 (3/3) Installing gcompat (1.1.0-r4)

#7 0.625 OK: 11.0 MiB in 21 packages

#7 DONE 0.7s

#8 [deps 2/4] WORKDIR /app

#8 DONE 0.0s

#9 [deps 3/4] COPY package.json package-lock.json* ./

#9 DONE 0.0s

#10 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#10 DONE 0.2s

#11 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#11 DONE 0.2s

#12 [deps 4/4] RUN npm ci

#12 1.111 npm warn EBADENGINE Unsupported engine {

#12 1.111 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#12 1.111 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#12 1.111 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#12 1.111 npm warn EBADENGINE }

#12 8.183 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#12 17.49

#12 17.49 added 749 packages, and audited 750 packages in 17s

#12 17.49

#12 17.49 192 packages are looking for funding

#12 17.49   run `npm fund` for details

#12 17.49

#12 17.49 2 vulnerabilities (1 moderate, 1 high)

#12 17.49

#12 17.49 To address all issues, run:

#12 17.49   npm audit fix

#12 17.49

#12 17.49 Run `npm audit` for details.

#12 17.49 npm notice

#12 17.49 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#12 17.49 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#12 17.49 npm notice To update run: npm install -g npm@11.12.1

#12 17.49 npm notice

#12 DONE 31.7s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 6.6s

#14 [builder 3/4] COPY . .

#14 DONE 0.4s

#15 [builder 4/4] RUN npm run build

#15 0.517

#15 0.517 > insight-engine@0.1.0 build

#15 0.517 > next build

#15 0.517

#15 2.150 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 2.151 This information is used to shape Next.js' roadmap and prioritize features.

#15 2.151 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 2.151 https://nextjs.org/telemetry

#15 2.151

#15 2.163 ▲ Next.js 16.1.7 (Turbopack)

#15 2.163

#15 2.336   Creating an optimized production build ...

#15 28.85 ✓ Compiled successfully in 25.8s

#15 28.86   Running TypeScript ...

#15 51.49   Collecting page data using 7 workers ...

#15 54.19 ⚠ Using edge runtime on a page currently disables static generation for that page

#15 54.50   Generating static pages using 7 workers (0/198) ...

#15 54.79   Generating static pages using 7 workers (49/198)

#15 54.96   Generating static pages using 7 workers (98/198)

#15 55.71   Generating static pages using 7 workers (148/198)

#15 55.87 ⨯ useSearchParams() should be wrapped in a suspense boundary at page "/story/view". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout

#15 55.87     at Q (/app/.next/server/chunks/ssr/node_modules_next_920e7746._.js:2:2111)

#15 55.87     at o (/app/.next/server/chunks/ssr/node_modules_next_920e7746._.js:4:5314)

#15 55.87     at j (/app/.next/server/chunks/ssr/_5cac5581._.js:1:1229)

#15 55.87     at an (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:84360)

#15 55.87     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:86179)

#15 55.87     at al (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:107953)

#15 55.87     at as (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:105368)

#15 55.87     at aa (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:84712)

#15 55.87     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:86228)

#15 55.87     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:104708)

#15 55.87 Error occurred prerendering page "/story/view". Read more: https://nextjs.org/docs/messages/prerender-error

#15 55.87 Export encountered an error on /story/view/page: /story/view, exiting the build.

#15 55.96 ⨯ Next.js build worker exited with code: 1 and signal: null

#15 56.13 npm notice

#15 56.13 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 56.13 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 56.13 npm notice To update run: npm install -g npm@11.12.1

#15 56.13 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

55.87     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:86228)

55.87     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:104708)

55.87 Error occurred prerendering page "/story/view". Read more: https://nextjs.org/docs/messages/prerender-error

55.87 Export encountered an error on /story/view/page: /story/view, exiting the build.

55.96 ⨯ Next.js build worker exited with code: 1 and signal: null

56.13 npm notice

56.13 npm notice New major version of npm available! 10.8.2 -> 11.12.1

56.13 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

56.13 npm notice To update run: npm install -g npm@11.12.1

56.13 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1