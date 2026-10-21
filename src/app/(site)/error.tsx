'use client';

import ErrorScreen from '@/components/ErrorScreen';

export default function SiteError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} home={{ href: '/', label: 'Go to the homepage' }} />;
}
