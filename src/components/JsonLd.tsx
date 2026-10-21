/** Structured data for search engines (schema.org), rendered as a JSON-LD script tag. */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape "<" so text from listings can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
