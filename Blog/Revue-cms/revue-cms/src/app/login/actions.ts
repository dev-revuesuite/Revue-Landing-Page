'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  CMS_ACCESS_DENIED_MESSAGE,
  CMS_NOT_CONFIGURED_MESSAGE,
  getAllowedCmsEmail,
  isAllowedCmsEmail,
} from '@/lib/cms-auth';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const next = (formData.get('next') as string) || '/cms';

  if (!getAllowedCmsEmail()) {
    redirect(`/login?error=${encodeURIComponent(CMS_NOT_CONFIGURED_MESSAGE)}`);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAllowedCmsEmail(user?.email)) {
    await supabase.auth.signOut();
    redirect(`/login?error=${encodeURIComponent(CMS_ACCESS_DENIED_MESSAGE)}`);
  }

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function signup() {
  redirect(
    `/login?error=${encodeURIComponent('Public signup is disabled. Use the admin account created in Supabase.')}`
  );
}

/** Prefer client SignOutButton in CMS; redirect from server actions can cause "Failed to fetch". */
export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
