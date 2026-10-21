'use client';

import ErrorScreen from '@/components/ErrorScreen';

export default function PortalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} home={{ href: '/portal', label: 'Back to dashboard' }} />;
}
