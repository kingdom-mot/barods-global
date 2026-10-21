/**
 * Barods' Google Business reviews, from the Google Places API (New).
 * Needs GOOGLE_PLACES_API_KEY in Vercel (server-only). Refreshed every 12 hours, so it costs a handful of
 * requests a month. Without a key, or if Google is unreachable, the homepage shows a few saved reviews instead.
 */
export const PLACE_ID = process.env.GOOGLE_PLACE_ID || 'ChIJX3Gh7dpLOhARZ02Vmo30ODc';
export const WRITE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;

export type Review = {
  author: string;
  authorUrl?: string;
  photo?: string;
  rating: number;
  text: string;
  when?: string; // "3 months ago"
  link?: string;
};
export type Reviews = { rating: number | null; count: number | null; mapsUrl: string; reviews: Review[]; live: boolean };

const SAVED: Review[] = [
  { author: 'Kehinde Opemipo', rating: 5, text: 'Hands down the best real estate company in Abeokuta you could ask for.' },
  { author: 'Yetunde Junaid', rating: 5, text: 'One of the best Real Estate company in Abeokuta, Ogun State.' },
  { author: 'Adekola Alagbe', rating: 4, text: 'Great people, no gimmicks. What you see is what you get.' },
];
const FALLBACK: Reviews = { rating: null, count: null, mapsUrl: `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`, reviews: SAVED, live: false };

type ApiReview = {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  relativePublishTimeDescription?: string;
  googleMapsUri?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
};

export async function getGoogleReviews(): Promise<Reviews> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return FALLBACK;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=en`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews' },
      next: { revalidate: 43200 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn('[google reviews]', res.status, (await res.text()).slice(0, 300));
      return FALLBACK;
    }
    const d = (await res.json()) as { rating?: number; userRatingCount?: number; googleMapsUri?: string; reviews?: ApiReview[] };
    const reviews = (d.reviews ?? [])
      .map((r) => ({
        author: r.authorAttribution?.displayName ?? 'Google user',
        authorUrl: r.authorAttribution?.uri,
        photo: r.authorAttribution?.photoUri,
        rating: r.rating ?? 5,
        text: (r.text?.text ?? r.originalText?.text ?? '').trim(),
        when: r.relativePublishTimeDescription,
        link: r.googleMapsUri,
      }))
      .filter((r) => r.text);
    return {
      rating: d.rating ?? null,
      count: d.userRatingCount ?? null,
      mapsUrl: d.googleMapsUri ?? FALLBACK.mapsUrl,
      reviews: reviews.length ? reviews : SAVED,
      live: true,
    };
  } catch (e) {
    console.warn('[google reviews]', e);
    return FALLBACK;
  }
}
