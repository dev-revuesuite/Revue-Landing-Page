'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAllowedCmsEmail, isAllowedCmsEmail } from '@/lib/cms-auth';
import { loginErrorPath } from '@/lib/login-errors';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const next = (formData.get('next') as string) || '/cms';

  if (!getAllowedCmsEmail()) {
    redirect(loginErrorPath('not_configured', next));
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(loginErrorPath('invalid_credentials', next));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAllowedCmsEmail(user?.email)) {
    await supabase.auth.signOut();
    redirect(loginErrorPath('access_denied', next));
  }

  revalidatePath('/', 'layout');
  redirect(next);
}

/** Prefer client SignOutButton in CMS; redirect from server actions can cause "Failed to fetch". */
export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
