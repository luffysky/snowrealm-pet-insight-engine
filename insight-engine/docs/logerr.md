#15 2.177 ▲ Next.js 16.1.7 (Turbopack)

#15 2.177

#15 2.358   Creating an optimized production build ...

#15 28.12

#15 28.12 > Build error occurred

#15 28.13 Error: Turbopack build failed with 1 errors:

#15 28.13 ./src/app/messages/page.tsx:1284:14

#15 28.13 Parsing ecmascript source code failed

#15 28.13   1282 |                 <span>🗑️</span> {msgMenu.msg.isMine ? '刪除' : '從我這邊刪除'}

#15 28.13   1283 |               </button>

#15 28.13 > 1284 |             )}

#15 28.13        |              ^

#15 28.13   1285 |           </div>

#15 28.13   1286 |         </>

#15 28.13   1287 |       )}

#15 28.13

#15 28.13 Unexpected token. Did you mean `{'}'}` or `&rbrace;`?

#15 28.13

#15 28.13

#15 28.13     at <unknown> (./src/app/messages/page.tsx:1284:14)

#15 28.32 npm notice

#15 28.32 npm notice New major version of npm available! 10.8.2 -> 11.12.1

#15 28.32 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

#15 28.32 npm notice To update run: npm install -g npm@11.12.1

#15 28.32 npm notice

#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

------

> [builder 4/4] RUN npm run build:

28.13

28.13 Unexpected token. Did you mean `{'}'}` or `&rbrace;`?

28.13

28.13

28.13     at <unknown> (./src/app/messages/page.tsx:1284:14)

28.32 npm notice

28.32 npm notice New major version of npm available! 10.8.2 -> 11.12.1

28.32 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1

28.32 npm notice To update run: npm install -g npm@11.12.1

28.32 npm notice

------

🔴 Build Failed. Reason: build image: build failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1