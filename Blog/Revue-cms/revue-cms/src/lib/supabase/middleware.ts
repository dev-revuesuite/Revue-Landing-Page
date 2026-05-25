import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  CMS_ACCESS_DENIED_MESSAGE,
  CMS_NOT_CONFIGURED_MESSAGE,
  getAllowedCmsEmail,
  isAllowedCmsEmail,
} from '@/lib/cms-auth';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith('/cms')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    if (!getAllowedCmsEmail()) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.delete('next');
      url.searchParams.set('error', CMS_NOT_CONFIGURED_MESSAGE);
      return NextResponse.redirect(url);
    }

    if (!isAllowedCmsEmail(user.email)) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.delete('next');
      url.searchParams.set('error', CMS_ACCESS_DENIED_MESSAGE);
      return NextResponse.redirect(url);
    }
  }

  return response;
}
