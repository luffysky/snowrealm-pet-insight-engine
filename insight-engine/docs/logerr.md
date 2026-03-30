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

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 16.78MB / 43.23MB 0.2s

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 0.1s done

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.3s

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.3s done

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#4 ...

#5 [internal] load build context

#5 transferring context: 84.45MB 0.6s done

#5 DONE 0.7s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 0.9s done

#4 DONE 1.3s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.0s done

#4 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 done

#4 DONE 1.4s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 0.485 (1/3) Installing musl-obstack (1.2.3-r2)

#6 0.492 (2/3) Installing libucontext (1.3.3-r0)

#6 0.494 (3/3) Installing gcompat (1.1.0-r4)

#6 0.509 OK: 11.0 MiB in 21 packages

#6 ...

#7 [builder 1/4] WORKDIR /app

#7 DONE 1.5s

#6 [deps 1/4] RUN apk add --no-cache libc6-compat

#6 DONE 1.5s

#8 [deps 2/4] WORKDIR /app

#8 DONE 0.1s

#9 [deps 3/4] COPY package.json package-lock.json* ./

#9 DONE 0.0s

#10 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#10 DONE 0.2s

#11 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#11 DONE 0.1s

#12 [deps 4/4] RUN npm ci

#12 0.910 npm warn EBADENGINE Unsupported engine {

#12 0.910 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#12 0.910 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#12 0.910 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#12 0.910 npm warn EBADENGINE }

#12 8.495 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#12 15.43

#12 15.43 added 801 packages, and audited 802 packages in 15s

#12 15.43

#12 15.43 208 packages are looking for funding

#12 15.43   run `npm fund` for details

#12 15.44

#12 15.44 2 vulnerabilities (1 moderate, 1 high)

#12 15.44

#12 15.44 To address all issues, run:

#12 15.44   npm audit fix

#12 15.44

#12 15.44 Run `npm audit` for details.

#12 15.44 npm notice

#12 15.44 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#12 15.44 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#12 15.44 npm notice To update run: npm install -g npm@11.12.1

#12 15.44 npm notice

#12 DONE 27.7s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 10.6s

#14 [builder 3/4] COPY . .

#14 DONE 1.5s

#15 [builder 4/4] RUN npm run build

#15 0.508

#15 0.508 > insight-engine@0.1.0 build

#15 0.508 > next build

#15 0.508

#15 2.077 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 2.077 This information is used to shape Next.js' roadmap and prioritize features.

#15 2.077 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 2.077 https://nextjs.org/telemetry

#15 2.077

#15 2.090 ▲ Next.js 16.1.7 (Turbopack)

#15 2.090 - Experiments (use with caution):

#15 2.090   · proxyClientMaxBodySize: "50mb"

#15 2.090

#15 2.156 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

#15 2.312   Creating an optimized production build ...

#15 34.05

#15 34.05 > Build error occurred

#15 34.05 Error: Turbopack build failed with 1 errors:

#15 34.05 ./src/lib/guideEngine.ts:236:74

#15 34.05 Parsing ecmascript source code failed

#15 34.05   234 | - 句子不超過 3 行（解讀結果除外）

#15 34.05   235 | - 大量語助詞：「欸」「啊」「喔」「嘛」「啦」「齁」「捏」

#15 34.05 > 236 | - 用顏文字代替 emoji：(´・ω・\`) (≧∀≦) (°д°) (´;ω;`) (≧ω≦) (｡•̀ᴗ-)

#15 34.05       |                                                                          ^

#15 34.05   237 | - 可以用「...」表達思考或欲言又止

#15 34.05   238 | - 偶爾打錯字然後用 *更正

#15 34.05   239 | - 可以善意吐槽使用者

#15 34.05

#15 34.05 Expected a semicolon

#15 34.05

#15 34.05 Import trace:

#15 34.05   App Route:

#15 34.05     ./src/lib/guideEngine.ts

#15 34.05     ./src/app/api/guide/chat/route.ts

#15 34.05

#15 34.05

#15 34.05     at <unknown> (./src/lib/guideEngine.ts:236:74)

#15 34.27 npm notice

#15 34.27 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 34.27 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 34.27 npm notice To update run: npm install -g npm@11.12.1

#15 34.27 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

34.05     ./src/lib/guideEngine.ts

34.05     ./src/app/api/guide/chat/route.ts

34.05

34.05

34.05     at <unknown> (./src/lib/guideEngine.ts:236:74)

34.27 npm notice

34.27 npm notice New major version of npm available! 10.8.2 -> 11.12.1

34.27 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

34.27 npm notice To update run: npm install -g npm@11.12.1

34.27 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1