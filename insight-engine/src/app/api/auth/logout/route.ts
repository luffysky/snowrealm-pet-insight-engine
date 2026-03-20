import { NextResponse } from 'next/server'

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin_session')
  response.cookies.delete('admin_token') // 清除舊版 cookie
  return response
}
