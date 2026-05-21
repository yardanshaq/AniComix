import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const UPSTREAM = 'https://www.sankavollerei.com';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const search = req.nextUrl.search;
  const upstreamUrl = `${UPSTREAM}/${path.join('/')}${search}`;

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AniComix/1.0)',
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    const body = await upstreamRes.text();
    return new NextResponse(body, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': upstreamRes.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Upstream fetch failed', message: (err as Error).message },
      { status: 502 }
    );
  }
}
