'use client';

import { usePathname } from 'next/navigation';

/** Floating click-to-chat button on every public page. The message says which page the visitor was on. */
export default function WhatsAppFloat({ number }: { number: string }) {
  const pathname = usePathname();
  if (!number) return null;
  const href = () => {
    const page = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Hello Barods Global, I'd like to make an enquiry.${page ? `\n\n(From your website: ${page})` : ''}`;
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  };
  return (
    <a
      key={pathname}
      href={`https://wa.me/${number}`}
      onClick={(e) => {
        e.preventDefault();
        window.open(href(), '_blank', 'noopener,noreferrer');
      }}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Barods Global on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-[#25D366] px-[14px] text-white shadow-lg ring-4 ring-white/70 transition-all hover:bg-[#1DA851] sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3ZM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
      </svg>
      {/* Label slides out on hover (desktop), so the button never covers page content */}
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[120px] group-focus-visible:max-w-[120px] sm:inline">Chat with us</span>
    </a>
  );
}
