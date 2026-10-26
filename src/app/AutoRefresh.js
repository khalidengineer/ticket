"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoRefresh({ interval = 15000 }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      // router.refresh() fetches the latest server component payload
      // without losing client-side state (like scroll position or open dropdowns)
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [router, interval]);

  return null;
}
