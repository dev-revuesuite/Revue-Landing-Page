'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { deletePost, duplicatePost } from './actions';
import { MoreVertical, Eye, Copy, Trash2, ExternalLink } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function PostRowActions({ id, slug, status }: { id: string; slug: string; status: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-2 hover:bg-mist"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-border bg-paper shadow-lg">
          <Link
            href={`/cms/posts/${id}/preview`}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-mist"
          >
            <Eye className="h-4 w-4" /> Preview
          </Link>
          {status === 'published' && (
            <a
              href={`/blog/${slug}`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-mist"
            >
              <ExternalLink className="h-4 w-4" /> View live
            </a>
          )}
          <button
            disabled={isPending}
            onClick={() => start(() => duplicatePost(id))}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-mist"
          >
            <Copy className="h-4 w-4" /> Duplicate
          </button>
          <button
            disabled={isPending}
            onClick={() => {
              if (confirm('Delete this post? This cannot be undone.')) start(() => deletePost(id));
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
