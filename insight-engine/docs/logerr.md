Initializing builder ...

Cloning source code from git ...

Using token authentication (x-access-token)

🔧 Pre-processing Dockerfile...

🔌 Initializing build environment...

⏳ Building image...

#1 [internal] load build definition from Dockerfile

#1 transferring dockerfile: 27.99kB done

#1 DONE 0.1s

#2 [internal] load metadata for docker.io/library/node:20-alpine

#2 DONE 0.7s

#3 [internal] load .dockerignore

#3 transferring context: 2B done

#3 DONE 0.0s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 resolve docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c 0.0s done

#4 sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 446B / 446B 0.0s done

#4 sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 1.26MB / 1.26MB 0.0s done

#4 sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 3.86MB / 3.86MB 0.0s done

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 14.68MB / 43.23MB 0.2s

#4 extracting sha256:589002ba0eaed121a1dbf42f6648f29e5be55d5c8a6ee0f8eaa0285cc21ac153 0.1s done

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 37.75MB / 43.23MB 0.3s

#4 sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 43.23MB / 43.23MB 0.5s done

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46

#4 ...

#5 [internal] load build context

#5 transferring context: 85.69MB 0.9s done

#5 DONE 1.0s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:d7f6aca05b78f475975eeac3898b7ef0a618937174c469650e05e81cbf8c5f46 1.1s done

#4 DONE 1.7s

#4 [base 1/1] FROM docker.io/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

#4 extracting sha256:62e0e1181d88da8ed0e2fda221e9446ad0f09a004a375193ad7a38e31ec4eab4 0.1s done

#4 extracting sha256:c7734204880fafbd6297ce1844e07c137d82ee814ac8b5fa6ac1a3659101d503 0.0s done

#4 DONE 1.8s

#6 [builder 1/4] WORKDIR /app

#6 DONE 4.0s

#7 [deps 1/4] RUN apk add --no-cache libc6-compat

#7 0.687 (1/3) Installing musl-obstack (1.2.3-r2)

#7 0.721 (2/3) Installing libucontext (1.3.3-r0)

#7 0.723 (3/3) Installing gcompat (1.1.0-r4)

#7 0.742 OK: 11.0 MiB in 21 packages

#7 DONE 4.0s

#8 [deps 2/4] WORKDIR /app

#8 DONE 0.1s

#9 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#9 ...

#10 [deps 3/4] COPY package.json package-lock.json* ./

#10 DONE 0.1s

#9 [runner 2/6] RUN addgroup --system --gid 1001 nodejs

#9 DONE 0.3s

#11 [runner 3/6] RUN adduser --system --uid 1001 nextjs

#11 DONE 0.2s

#12 [deps 4/4] RUN npm ci

#12 1.613 npm warn EBADENGINE Unsupported engine {

#12 1.613 npm warn EBADENGINE   package: 'camera-controls@3.1.2',

#12 1.613 npm warn EBADENGINE   required: { node: '>=22.0.0', npm: '>=10.5.1' },

#12 1.613 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }

#12 1.613 npm warn EBADENGINE }

#12 14.26 npm warn deprecated fluent-ffmpeg@2.1.3: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.

#12 23.04

#12 23.04 added 827 packages, and audited 828 packages in 23s

#12 23.04

#12 23.04 209 packages are looking for funding

#12 23.04   run `npm fund` for details

#12 23.04

#12 23.04 2 vulnerabilities (1 moderate, 1 high)

#12 23.04

#12 23.04 To address all issues, run:

#12 23.04   npm audit fix

#12 23.04

#12 23.04 Run `npm audit` for details.

#12 23.05 npm notice

#12 23.05 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#12 23.05 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#12 23.05 npm notice To update run: npm install -g npm@11.12.1

#12 23.05 npm notice

#12 DONE 30.8s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules

#13 DONE 10.6s

#14 [builder 3/4] COPY . .

#14 DONE 1.6s

#15 [builder 4/4] RUN npm run build

#15 0.997

#15 0.997 > insight-engine@0.1.0 build

#15 0.997 > next build

#15 0.997

#15 2.700 Attention: Next.js now collects completely anonymous telemetry regarding usage.

#15 2.701 This information is used to shape Next.js' roadmap and prioritize features.

#15 2.701 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:

#15 2.701 https://nextjs.org/telemetry

#15 2.701

#15 2.713 ▲ Next.js 16.1.7 (Turbopack)

#15 2.713 - Experiments (use with caution):

#15 2.713   · proxyClientMaxBodySize: "50mb"

#15 2.713

#15 2.801 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

#15 2.968   Creating an optimized production build ...

#15 187.9 ✓ Compiled successfully in 3.1min

#15 188.0   Running TypeScript ...

#15 227.4   Collecting page data using 7 workers ...

#15 229.7 ⚠ Using edge runtime on a page currently disables static generation for that page

#15 230.1   Generating static pages using 7 workers (0/251) ...

#15 230.5   Generating static pages using 7 workers (62/251)

#15 230.7   Generating static pages using 7 workers (125/251)

#15 231.6   Generating static pages using 7 workers (188/251)

#15 232.9 ✓ Generating static pages using 7 workers (251/251) in 2.8s

#15 233.0   Finalizing page optimization ...

#15 234.5

#15 234.5 Route (app)                                                   Revalidate  Expire

#15 234.5 ┌ ○ /

#15 234.5 ├ ○ /_not-found

#15 234.5 ├ ƒ /[org]/[slug]

#15 234.5 ├ ƒ /add-friend/[userId]

#15 234.5 ├ ƒ /add-friend/qr/[token]

#15 234.5 ├ ƒ /api/ad-view

#15 234.5 ├ ƒ /api/admin/ab

#15 234.5 ├ ƒ /api/admin/account

#15 234.5 ├ ƒ /api/admin/ai-chat-generate

#15 234.5 ├ ƒ /api/admin/ai-generate

#15 234.5 ├ ƒ /api/admin/ai-generate-meta

#15 234.5 ├ ƒ /api/admin/ai-insight

#15 234.5 ├ ƒ /api/admin/ai-sentiment

#15 234.5 ├ ƒ /api/admin/ai-settings

#15 234.5 ├ ƒ /api/admin/ai-story

#15 234.5 ├ ƒ /api/admin/ai-usage

#15 234.5 ├ ƒ /api/admin/api-keys

#15 234.5 ├ ƒ /api/admin/broadcast

#15 234.5 ├ ƒ /api/admin/crosstab

#15 234.5 ├ ƒ /api/admin/delete-account

#15 234.5 ├ ƒ /api/admin/export

#15 234.5 ├ ƒ /api/admin/export-report

#15 234.5 ├ ƒ /api/admin/funnel

#15 234.5 ├ ƒ /api/admin/line-settings

#15 234.5 ├ ƒ /api/admin/line/test

#15 234.5 ├ ƒ /api/admin/my-responses

#15 234.5 ├ ƒ /api/admin/notification-logs

#15 234.5 ├ ƒ /api/admin/notification-rules

#15 234.5 ├ ƒ /api/admin/notification-styles

#15 234.5 ├ ƒ /api/admin/profile

#15 234.5 ├ ƒ /api/admin/questions

#15 234.5 ├ ƒ /api/admin/questions/[qid]

#15 234.5 ├ ƒ /api/admin/responses

#15 234.5 ├ ƒ /api/admin/responses/[id]

#15 234.5 ├ ƒ /api/admin/rich-menu

#15 234.5 ├ ƒ /api/admin/site-settings

#15 234.5 ├ ƒ /api/admin/social/active

#15 234.5 ├ ƒ /api/admin/social/album

#15 234.5 ├ ƒ /api/admin/social/albums

#15 234.5 ├ ƒ /api/admin/social/block

#15 234.5 ├ ƒ /api/admin/social/blog

#15 234.5 ├ ƒ /api/admin/social/blog/[id]

#15 234.5 ├ ƒ /api/admin/social/blog/ai-meta

#15 234.5 ├ ƒ /api/admin/social/blog/check-slug

#15 234.5 ├ ƒ /api/admin/social/blog/series

#15 234.5 ├ ƒ /api/admin/social/blog/series/[id]

#15 234.5 ├ ƒ /api/admin/social/blog/settings

#15 234.5 ├ ƒ /api/admin/social/bookmarks

#15 234.5 ├ ƒ /api/admin/social/comments

#15 234.5 ├ ƒ /api/admin/social/comments/[id]

#15 234.5 ├ ƒ /api/admin/social/contact-notes

#15 234.5 ├ ƒ /api/admin/social/follow

#15 234.5 ├ ƒ /api/admin/social/friend-qr

#15 234.5 ├ ƒ /api/admin/social/friends

#15 234.5 ├ ƒ /api/admin/social/messages

#15 234.5 ├ ƒ /api/admin/social/messages/[userId]

#15 234.5 ├ ƒ /api/admin/social/messages/audio-proxy

#15 234.5 ├ ƒ /api/admin/social/messages/sse

#15 234.5 ├ ƒ /api/admin/social/messages/theme-sync

#15 234.5 ├ ƒ /api/admin/social/messages/typing

#15 234.5 ├ ƒ /api/admin/social/messages/unread

#15 234.5 ├ ƒ /api/admin/social/messages/upload

#15 234.5 ├ ƒ /api/admin/social/notifications

#15 234.5 ├ ƒ /api/admin/social/posts

#15 234.5 ├ ƒ /api/admin/social/posts/[id]

#15 234.5 ├ ƒ /api/admin/social/reactions

#15 234.5 ├ ƒ /api/admin/social/reports

#15 234.5 ├ ƒ /api/admin/social/stories

#15 234.5 ├ ƒ /api/admin/social/stories/poll

#15 234.5 ├ ƒ /api/admin/social/stories/view

#15 234.5 ├ ƒ /api/admin/social/stories/viewers

#15 234.5 ├ ƒ /api/admin/stats

#15 234.5 ├ ƒ /api/admin/story-wall

#15 234.5 ├ ƒ /api/admin/subscription

#15 234.5 ├ ƒ /api/admin/subscription/cancel

#15 234.5 ├ ƒ /api/admin/summary

#15 234.5 ├ ƒ /api/admin/support

#15 234.5 ├ ƒ /api/admin/support/[ticketId]

#15 234.5 ├ ƒ /api/admin/support/[ticketId]/reply

#15 234.5 ├ ƒ /api/admin/support/templates

#15 234.5 ├ ƒ /api/admin/survey-templates

#15 234.5 ├ ƒ /api/admin/survey-templates/[id]

#15 234.5 ├ ƒ /api/admin/survey-templates/[id]/use

#15 234.5 ├ ƒ /api/admin/surveys

#15 234.5 ├ ƒ /api/admin/surveys/[id]

#15 234.5 ├ ƒ /api/admin/surveys/[id]/questions

#15 234.5 ├ ƒ /api/admin/system

#15 234.5 ├ ƒ /api/admin/tag-rules

#15 234.5 ├ ƒ /api/admin/tags

#15 234.5 ├ ƒ /api/admin/team

#15 234.5 ├ ƒ /api/admin/templates

#15 234.5 ├ ƒ /api/admin/tenants

#15 234.5 ├ ƒ /api/admin/theme-settings

#15 234.5 ├ ƒ /api/admin/trial-status

#15 234.5 ├ ƒ /api/admin/upload

#15 234.5 ├ ƒ /api/admin/utm

#15 234.5 ├ ƒ /api/admin/utm-links

#15 234.5 ├ ƒ /api/admin/waitlist

#15 234.5 ├ ƒ /api/admin/webhooks

#15 234.5 ├ ƒ /api/admin/zcoin

#15 234.5 ├ ƒ /api/ai/rules

#15 234.5 ├ ƒ /api/ai/validate

#15 234.5 ├ ƒ /api/auth/google

#15 234.5 ├ ƒ /api/auth/line

#15 234.5 ├ ƒ /api/auth/line/callback

#15 234.5 ├ ƒ /api/auth/line/super-admin

#15 234.5 ├ ƒ /api/auth/line/super-admin/callback

#15 234.5 ├ ƒ /api/auth/line/super-admin/confirm

#15 234.5 ├ ƒ /api/auth/login

#15 234.5 ├ ƒ /api/auth/logout

#15 234.5 ├ ƒ /api/auth/me

#15 234.5 ├ ƒ /api/auth/register

#15 234.5 ├ ƒ /api/auth/reset-password

#15 234.5 ├ ƒ /api/auth/send-code

#15 234.5 ├ ƒ /api/auth/switch-tenant

#15 234.5 ├ ƒ /api/blogs

#15 234.5 ├ ƒ /api/blogs/[userSlug]

#15 234.5 ├ ƒ /api/blogs/[userSlug]/[articleSlug]

#15 234.5 ├ ƒ /api/blogs/[userSlug]/[articleSlug]/comments

#15 234.5 ├ ƒ /api/blogs/[userSlug]/[articleSlug]/reactions

#15 234.5 ├ ƒ /api/cognitive-gap/calculate

#15 234.5 ├ ƒ /api/cognitive-gap/report

#15 234.5 ├ ƒ /api/cognitive-gap/snapshot

#15 234.5 ├ ƒ /api/cron/ai-alerts

#15 234.5 ├ ƒ /api/cron/broadcast

#15 234.5 ├ ƒ /api/cron/cleanup-sessions

#15 234.5 ├ ƒ /api/cron/daily-digest

#15 234.5 ├ ƒ /api/cron/daily-greeting

#15 234.5 ├ ƒ /api/cron/daily-reset

#15 234.5 ├ ƒ /api/cron/morning-brief

#15 234.5 ├ ƒ /api/cron/remind

#15 234.5 ├ ƒ /api/cron/scheduler

#15 234.5 ├ ƒ /api/cron/streak-reminder

#15 234.5 ├ ƒ /api/cron/subscription-check

#15 234.5 ├ ƒ /api/cron/survey-schedule

#15 234.5 ├ ƒ /api/cron/weekly-report

#15 234.5 ├ ƒ /api/cron/yukirin-agent

#15 234.5 ├ ƒ /api/explore

#15 234.5 ├ ƒ /api/guide/buy-turns

#15 234.5 ├ ƒ /api/guide/chat

#15 234.5 ├ ƒ /api/guide/history

#15 234.5 ├ ƒ /api/guide/turns

#15 234.5 ├ ƒ /api/img-proxy

#15 234.5 ├ ƒ /api/line-pay/confirm

#15 234.5 ├ ƒ /api/line-pay/request

#15 234.5 ├ ƒ /api/line/liff-bind

#15 234.5 ├ ƒ /api/line/webhook

#15 234.5 ├ ƒ /api/line/webhook/insight-engine

#15 234.5 ├ ƒ /api/line/webhook/official

#15 234.5 ├ ƒ /api/marketplace

#15 234.5 ├ ƒ /api/og

#15 234.5 ├ ƒ /api/og-fetch

#15 234.5 ├ ƒ /api/payment/create

#15 234.5 ├ ƒ /api/payment/notify

#15 234.5 ├ ƒ /api/payment/return

#15 234.5 ├ ƒ /api/posts

#15 234.5 ├ ƒ /api/posts/[id]

#15 234.5 ├ ƒ /api/posts/bookmark

#15 234.5 ├ ƒ /api/primary-survey

#15 234.5 ├ ƒ /api/quiz-result/[responseId]

#15 234.5 ├ ƒ /api/referral

#15 234.5 ├ ƒ /api/report/[slug]

#15 234.5 ├ ƒ /api/stickers

#15 234.5 ├ ƒ /api/story-card/[responseId]

#15 234.5 ├ ƒ /api/story-wall/[surveySlug]

#15 234.5 ├ ƒ /api/super-admin/ai-cost/by-model

#15 234.5 ├ ƒ /api/super-admin/ai-cost/by-task

#15 234.5 ├ ƒ /api/super-admin/ai-cost/daily

#15 234.5 ├ ƒ /api/super-admin/ai-cost/summary

#15 234.5 ├ ƒ /api/super-admin/ai-cost/top-expensive

#15 234.5 ├ ƒ /api/super-admin/ai-prompt

#15 234.5 ├ ƒ /api/super-admin/alerts

#15 234.5 ├ ƒ /api/super-admin/analytics

#15 234.5 ├ ƒ /api/super-admin/audit

#15 234.5 ├ ƒ /api/super-admin/audit/export

#15 234.5 ├ ƒ /api/super-admin/ban

#15 234.5 ├ ƒ /api/super-admin/conversations

#15 234.5 ├ ƒ /api/super-admin/conversations/[conversationId]/messages

#15 234.5 ├ ƒ /api/super-admin/files

#15 234.5 ├ ƒ /api/super-admin/health

#15 234.5 ├ ƒ /api/super-admin/live-feed

#15 234.5 ├ ƒ /api/super-admin/live-feed/stream

#15 234.5 ├ ƒ /api/super-admin/marketplace

#15 234.5 ├ ƒ /api/super-admin/moderation

#15 234.5 ├ ƒ /api/super-admin/notification-styles

#15 234.5 ├ ƒ /api/super-admin/notifications

#15 234.5 ├ ƒ /api/super-admin/notifications/[id]

#15 234.5 ├ ƒ /api/super-admin/notifications/[id]/send

#15 234.5 ├ ƒ /api/super-admin/orders

#15 234.5 ├ ƒ /api/super-admin/orders/[orderId]/refund

#15 234.5 ├ ƒ /api/super-admin/revenue/today

#15 234.5 ├ ƒ /api/super-admin/security/auto-bans

#15 234.5 ├ ƒ /api/super-admin/security/device-anomalies

#15 234.5 ├ ƒ /api/super-admin/security/ip-anomalies

#15 234.5 ├ ƒ /api/super-admin/security/risky-accounts

#15 234.5 ├ ƒ /api/super-admin/security/watchlist

#15 234.5 ├ ƒ /api/super-admin/site-settings

#15 234.5 ├ ƒ /api/super-admin/social

#15 234.5 ├ ƒ /api/super-admin/stats

#15 234.5 ├ ƒ /api/super-admin/stickers

#15 234.5 ├ ƒ /api/super-admin/stickers/[packId]

#15 234.5 ├ ƒ /api/super-admin/stickers/[packId]/stickers

#15 234.5 ├ ƒ /api/super-admin/stickers/[packId]/stickers/[stickerId]

#15 234.5 ├ ƒ /api/super-admin/support

#15 234.5 ├ ƒ /api/super-admin/tenants

#15 234.5 ├ ƒ /api/super-admin/upload

#15 234.5 ├ ƒ /api/super-admin/usage

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/ban

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/conversations

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/detail

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/files

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/force-logout

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/logins

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/orders

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/reports

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/stories

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/surveys

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/warn

#15 234.5 ├ ƒ /api/super-admin/users/[userId]/zcoin

#15 234.5 ├ ƒ /api/super-admin/users/platform-unlimited

#15 234.5 ├ ƒ /api/super-admin/zcoin

#15 234.5 ├ ƒ /api/surveys/[slug]

#15 234.5 ├ ƒ /api/surveys/click

#15 234.5 ├ ƒ /api/surveys/progress

#15 234.5 ├ ƒ /api/surveys/submit

#15 234.5 ├ ƒ /api/surveys/theme

#15 234.5 ├ ƒ /api/surveys/verify-password

#15 234.5 ├ ƒ /api/translate

#15 234.5 ├ ƒ /api/upload/audio

#15 234.5 ├ ƒ /api/upload/media

#15 234.5 ├ ƒ /api/upload/video

#15 234.5 ├ ƒ /api/users/[userId]

#15 234.5 ├ ƒ /api/waitlist

#15 234.5 ├ ƒ /api/zcoin

#15 234.5 ├ ƒ /api/zcoin/spend

#15 234.5 ├ ƒ /api/zcoin/tasks

#15 234.5 ├ ○ /apple-icon.png

#15 234.5 ├ ○ /articles

#15 234.5 ├ ƒ /articles/[id]

#15 234.5 ├ ○ /blogs                                                            1m      1y

#15 234.5 ├ ƒ /blogs/[userSlug]

#15 234.5 ├ ƒ /blogs/[userSlug]/[articleSlug]

#15 234.5 ├ ○ /cookies

#15 234.5 ├ ○ /done

#15 234.5 ├ ○ /explore

#15 234.5 ├ ○ /forgot-password

#15 234.5 ├ ƒ /gap-result/[userId]

#15 234.5 ├ ○ /icon.png

#15 234.5 ├ ○ /insight-admin

#15 234.5 ├ ○ /insight-admin/ab

#15 234.5 ├ ○ /insight-admin/account

#15 234.5 ├ ○ /insight-admin/ai-settings

#15 234.5 ├ ○ /insight-admin/blog

#15 234.5 ├ ○ /insight-admin/broadcast

#15 234.5 ├ ○ /insight-admin/crosstab

#15 234.5 ├ ○ /insight-admin/export

#15 234.5 ├ ○ /insight-admin/funnel

#15 234.5 ├ ○ /insight-admin/insight

#15 234.5 ├ ○ /insight-admin/line-settings

#15 234.5 ├ ○ /insight-admin/my-responses

#15 234.5 ├ ○ /insight-admin/notification-rules

#15 234.5 ├ ○ /insight-admin/notification-styles

#15 234.5 ├ ○ /insight-admin/panel

#15 234.5 ├ ○ /insight-admin/profile

#15 234.5 ├ ○ /insight-admin/responses

#15 234.5 ├ ƒ /insight-admin/responses/[id]

#15 234.5 ├ ○ /insight-admin/rich-menu

#15 234.5 ├ ○ /insight-admin/site-settings

#15 234.5 ├ ○ /insight-admin/social-posts

#15 234.5 ├ ○ /insight-admin/social-reports

#15 234.5 ├ ○ /insight-admin/story-wall

#15 234.5 ├ ○ /insight-admin/subscription

#15 234.5 ├ ○ /insight-admin/support

#15 234.5 ├ ○ /insight-admin/survey-templates

#15 234.5 ├ ○ /insight-admin/surveys

#15 234.5 ├ ○ /insight-admin/tag-rules

#15 234.5 ├ ○ /insight-admin/tags

#15 234.5 ├ ○ /insight-admin/team

#15 234.5 ├ ○ /insight-admin/templates

#15 234.5 ├ ○ /insight-admin/tenants

#15 234.5 ├ ○ /insight-admin/theme-settings

#15 234.5 ├ ○ /insight-admin/upgrade

#15 234.5 ├ ○ /insight-admin/utm

#15 234.5 ├ ○ /insight-admin/utm-links

#15 234.5 ├ ○ /insight-admin/waitlist

#15 234.5 ├ ○ /insight-admin/webhooks

#15 234.5 ├ ○ /insight-admin/zcoin

#15 234.5 ├ ƒ /invite/[code]

#15 234.5 ├ ○ /liff

#15 234.5 ├ ○ /login

#15 234.5 ├ ○ /marketplace

#15 234.5 ├ ○ /messages

#15 234.5 ├ ○ /notifications

#15 234.5 ├ ƒ /opengraph-image

#15 234.5 ├ ○ /post

#15 234.5 ├ ○ /pricing

#15 234.5 ├ ○ /privacy

#15 234.5 ├ ƒ /rate-friend/[userId]/[surveySlug]

#15 234.5 ├ ○ /register

#15 234.5 ├ ƒ /report/[slug]

#15 234.5 ├ ƒ /report/[slug]/opengraph-image

#15 234.5 ├ ƒ /result/[responseId]

#15 234.5 ├ ○ /rules

#15 234.5 ├ ○ /snowrealm-insight-ctrl

#15 234.5 ├ ○ /snowrealm-insight-ctrl/ai-cost

#15 234.5 ├ ○ /snowrealm-insight-ctrl/ai-settings

#15 234.5 ├ ○ /snowrealm-insight-ctrl/analytics

#15 234.5 ├ ○ /snowrealm-insight-ctrl/audit

#15 234.5 ├ ○ /snowrealm-insight-ctrl/conversations

#15 234.5 ├ ○ /snowrealm-insight-ctrl/files

#15 234.5 ├ ○ /snowrealm-insight-ctrl/health

#15 234.5 ├ ○ /snowrealm-insight-ctrl/marketplace

#15 234.5 ├ ○ /snowrealm-insight-ctrl/moderation

#15 234.5 ├ ○ /snowrealm-insight-ctrl/notification-styles

#15 234.5 ├ ○ /snowrealm-insight-ctrl/notifications

#15 234.5 ├ ○ /snowrealm-insight-ctrl/orders

#15 234.5 ├ ○ /snowrealm-insight-ctrl/plans

#15 234.5 ├ ○ /snowrealm-insight-ctrl/rich-menu

#15 234.5 ├ ○ /snowrealm-insight-ctrl/security

#15 234.5 ├ ○ /snowrealm-insight-ctrl/site-settings

#15 234.5 ├ ○ /snowrealm-insight-ctrl/social

#15 234.5 ├ ○ /snowrealm-insight-ctrl/stickers

#15 234.5 ├ ○ /snowrealm-insight-ctrl/support

#15 234.5 ├ ○ /snowrealm-insight-ctrl/tenants

#15 234.5 ├ ○ /snowrealm-insight-ctrl/usage

#15 234.5 ├ ○ /snowrealm-insight-ctrl/users

#15 234.5 ├ ƒ /snowrealm-insight-ctrl/users/[userId]

#15 234.5 ├ ○ /snowrealm-insight-ctrl/zcoin

#15 234.5 ├ ƒ /story-wall/[surveySlug]

#15 234.5 ├ ƒ /story/[responseId]

#15 234.5 ├ ƒ /story/[responseId]/opengraph-image

#15 234.5 ├ ○ /story/create

#15 234.5 ├ ○ /story/view

#15 234.5 ├ ○ /super-login

#15 234.5 ├ ○ /survey

#15 234.5 ├ ƒ /survey/[slug]

#15 234.5 ├ ○ /terms

#15 234.5 ├ ƒ /u/[userId]

#15 234.5 ├ ○ /wallet

#15 234.5 ├ ○ /write

#15 234.5 ├ ○ /zcoin-shop

#15 234.5 ├ ○ /zcoin/topup

#15 234.5 └ ○ /zcoin/topup/success

#15 234.5

#15 234.5

#15 234.5 ƒ Proxy (Middleware)

#15 234.5

#15 234.5 ○  (Static)   prerendered as static content

#15 234.5 ƒ  (Dynamic)  server-rendered on demand

#15 234.5

#15 234.7 npm notice

#15 234.7 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 234.7 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 234.7 npm notice To update run: npm install -g npm@11.12.1

#15 234.7 npm notice

#15 DONE 238.3s

#16 [runner 4/6] COPY --from=builder /app/public ./public

#16 DONE 0.1s

#17 [runner 5/6] COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

#17 DONE 1.4s

#18 [runner 6/6] COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

#18 DONE 0.2s

#19 exporting to oci image format

#19 exporting layers

#19 exporting layers 12.8s done

#19 exporting manifest sha256:f9f24aa38c1b60a6a939994f03b1d395a9fedd7a63b6626d002101d5179e9e9b 0.0s done

#19 exporting config sha256:bb4593a18977e2ee6f6f63a934a724e1fc94ed901163c3993a0e1c59ed37ada8 0.0s done

#19 ERROR: no active session for ym50r7exyetjx8m1waihukvj0: context deadline exceeded

------

> exporting to oci image format:

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: DeadlineExceeded: no active session for ym50r7exyetjx8m1waihukvj0: context deadline exceeded