✓ Starting...

✓ Ready in 115ms

⨯ error: operator does not exist: text = uuid

    at async s (.next/server/chunks/[root-of-the-server]__98ee3e37._.js:1:1446)

    at async l (.next/server/chunks/[root-of-the-server]__d164dd7a._.js:1:2657)

    at async d (.next/server/chunks/[root-of-the-server]__d164dd7a._.js:13:4723)

    at async u (.next/server/chunks/[root-of-the-server]__d164dd7a._.js:13:5764)

    at async Module.N (.next/server/chunks/[root-of-the-server]__d164dd7a._.js:13:6842) {

  length: 197,

  severity: 'ERROR',

  code: '42883',

  detail: undefined,

  hint: 'No operator matches the given name and argument types. You might need to add explicit type casts.',

  position: '116',

  internalPosition: undefined,

  internalQuery: undefined,

  where: undefined,

  schema: undefined,

  table: undefined,

  column: undefined,

  dataType: undefined,

  constraint: undefined,

  file: 'parse_oper.c',

  line: '647',

   routine: 'op_error'

}

⨯ error: column sc.one_liner does not exist

    at async s (.next/server/chunks/[root-of-the-server]__98ee3e37._.js:1:1446)

    at async i (.next/server/chunks/[root-of-the-server]__4cd51257._.js:1:1947)

    at async d (.next/server/chunks/[root-of-the-server]__4cd51257._.js:29:3624)

    at async u (.next/server/chunks/[root-of-the-server]__4cd51257._.js:29:4665)

    at async Module.f (.next/server/chunks/[root-of-the-server]__4cd51257._.js:29:5743) {

  length: 111,

  severity: 'ERROR',

  code: '42703',

  detail: undefined,

  hint: undefined,

  position: '128',

  internalPosition: undefined,

  internalQuery: undefined,

  where: undefined,

  schema: undefined,

  table: undefined,

  column: undefined,

  dataType: undefined,

  constraint: undefined,

  file: 'parse_relation.c',

  line: '3665',

  routine: 'errorMissingColumn'

}