/**
 * Fuller descriptions for the three main services, shown when a service has no write-up of its own in the portal
 * (Website → Services). Barods can replace any of these, and add past projects, from the portal.
 */
export const SERVICE_ACTION: Record<string, { cta: string; heading: string }> = {
  'architectural-designs': { cta: 'Request a design quote', heading: 'Request a design quote' },
  'building-construction': { cta: 'Request a building quote', heading: 'Request a building quote' },
  'property-management': { cta: 'Ask about property management', heading: 'Talk to us about managing your property' },
};

export function serviceAction(slug: string, name: string) {
  return SERVICE_ACTION[slug] ?? { cta: `Enquire about ${name.toLowerCase()}`, heading: `Enquire about ${name.toLowerCase()}` };
}

export const SERVICE_BODY: Record<string, string> = {
  'architectural-designs': `## What’s included

- **Concept and space planning:** we start from how you want to live or work, your plot size and your budget.
- **Architectural drawings:** floor plans, elevations and sections for homes, blocks of flats and commercial buildings.
- **3D views:** see the exterior (and key interior spaces) before anything is built.
- **Drawings for approval:** the drawing set needed for building plan approval in your state, coordinated with structural and services engineers.
- **Bill of quantities guidance:** so you can plan the cost of building what has been designed.

## How it works

1. **Free consultation:** tell us about the site, what you want to build and your budget.
2. **Site visit and brief:** we check the plot and agree the brief and fee in writing.
3. **Concept design:** first layouts and 3D views for your feedback.
4. **Final drawings:** detailed drawings, revised until you are happy.
5. **Approval support:** we help you prepare and submit for building plan approval.

## Why Barods

One team for design, construction and property advice, with local knowledge of Abeokuta, Lagos and Ibadan, and clear communication for clients at home and abroad.`,

  'building-construction': `## What’s included

- **New builds:** bungalows, duplexes, blocks of flats and commercial buildings.
- **Project management:** we coordinate the builders, engineers and suppliers, so you deal with one team.
- **Budget and timeline:** a written cost plan and schedule before work starts, with stage-by-stage payments.
- **Quality checks:** supervision at every stage, from foundation to finishing.
- **Progress updates:** regular photos and videos, ideal for clients living abroad.
- **Renovation and remodelling:** upgrades, extensions and finishing works on existing buildings.

## How it works

1. **Consultation:** share your drawings (or let us design them) and your budget.
2. **Site assessment:** we inspect the site and confirm what approvals are in place.
3. **Costing and agreement:** a detailed quote, timeline and payment schedule, agreed in writing.
4. **Construction:** work begins, with supervision and regular progress reports.
5. **Handover:** a final inspection with you before keys are handed over.

## Why Barods

Experienced site supervision, transparent costing and dependable communication, so your project is built right whether you are in Nigeria or abroad.`,

  'property-management': `## What’s included

- **Finding tenants:** marketing, viewings and tenant checks.
- **Rent collection:** on-time collection and clear statements.
- **Maintenance:** routine upkeep and repairs, with approval from you for larger jobs.
- **Inspections:** regular checks on the condition of the property, with photos.
- **Tenant relations:** one point of contact for your tenants.
- **Reporting:** simple updates so you always know how your property is doing, wherever you live.

## How it works

1. **Consultation:** tell us about the property and what you need managed.
2. **Inspection:** we visit the property and recommend rent and any work needed.
3. **Agreement:** our management terms and fee, agreed in writing.
4. **Management:** we take over the day-to-day running of the property.
5. **Reports:** regular updates on rent, tenants and maintenance.

## Why Barods

Local presence in Abeokuta, Lagos and Ibadan, honest reporting and a team that treats your property as an investment.`,
};
