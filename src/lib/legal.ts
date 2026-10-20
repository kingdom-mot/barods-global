/**
 * Privacy Policy and Terms of Use, from the documents Barods Global supplied (October 2026).
 * Each block is a paragraph, or a bulleted list when it's an array.
 */
export type LegalSection = { id: string; heading: string; blocks: (string | string[])[] };
export type LegalDoc = { title: string; subtitle: string; updated: string; sections: LegalSection[] };

const ADDRESS = 'Suite B104, Providence Mall, Opposite Globus Bank, Leme Abiola Way, Abeokuta, Ogun State, Nigeria';
const UPDATED = '20 October 2026';

const s = (heading: string, ...blocks: (string | string[])[]): LegalSection => ({
  id: heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  heading,
  blocks,
});

export const privacyPolicy: LegalDoc = {
  title: 'Privacy Policy',
  subtitle: 'How we collect, use, protect and manage personal information',
  updated: UPDATED,
  sections: [
    s(
      'Introduction',
      'Barods Global Limited (“Barods”, “we”, “us” or “our”) respects your privacy. This Privacy Policy explains how we collect, use, disclose, store and protect personal information when you visit our website, browse property listings, contact us, submit an enquiry, request a viewing, ask to receive updates, or use an agent or staff portal.',
      'This policy is intended to align with applicable Nigerian data-protection law, including the Nigeria Data Protection Act 2023 and relevant regulations. It should be read alongside any specific notice shown when you use a particular service.',
    ),
    s(
      'Who is responsible for your data?',
      'The data controller is Barods Global Limited, a Nigerian real estate and property advisory business.',
      [`Address: ${ADDRESS}.`, 'Email: support@barodsglobal.com', 'Telephone: +234 802 228 8806'],
    ),
    s(
      'Information we may collect',
      [
        'Contact and enquiry details: name, phone number, email address, message and preferred contact method.',
        'Property preferences: location, property type, budget, intended use, viewing requests and related requirements.',
        'Account information: login identifiers and information needed to manage authorised agent or staff portal access.',
        'Communications: correspondence, enquiry history and viewing arrangements.',
        'Technical information: browser/device details, logs, security events and website usage information where collected by hosting, security or analytics providers.',
        'Cookie preferences: information used to remember cookie choices, currency preferences, portal sessions and whether an update form has already been shown.',
      ],
      'Please do not send sensitive personal information unless it is necessary for a specific service and we have explained why it is required.',
    ),
    s(
      'How we collect information',
      'We collect information when you complete a form, contact us by telephone or email, request a property viewing, ask to receive updates, communicate with our agents or use an authorised portal. Limited technical information and preferences may also be collected automatically by the website or its service providers.',
    ),
    s(
      'Why we use information',
      'We may use information to respond to enquiries; connect you with an appropriate agent; provide property details; arrange viewings; send updates you requested; operate, maintain and secure the website; administer authorised accounts; improve services; keep business records; handle complaints or legal claims; and comply with legal obligations.',
      'We process information where an applicable lawful basis exists, such as your consent, steps taken at your request before a contract, performance of a contract, a legal obligation or a legitimate interest that is not overridden by your rights. Where consent is required, you may withdraw it without affecting prior lawful processing.',
    ),
    s(
      'When we share information',
      'We do not sell personal information. Where necessary and appropriate, we may share relevant information with authorised employees, agents and property consultants; property owners, developers, landlords or service providers involved in your enquiry or viewing; technology providers supporting hosting, email, security, analytics or customer communications; and professional advisers, regulators, law-enforcement bodies or courts where legally required or necessary to protect legal rights.',
      'We expect service providers processing information for us to use appropriate confidentiality and security measures. Third parties collecting information under their own terms may have separate privacy policies.',
    ),
    s(
      'International transfers',
      'Some technology providers or business partners may process information outside Nigeria. Where information is transferred internationally, we will take steps required by applicable law, which may include assessing the recipient and using appropriate safeguards.',
    ),
    s(
      'Cookies and similar technologies',
      'This website uses the following cookies and similar technologies:',
      [
        'cookie_consent remembers whether you accepted or declined cookies, for up to one year.',
        'currency remembers the currency prices are shown in, for up to six months.',
        'Sign-in cookies support authorised agent and staff portal sessions.',
        'If you accept cookies, the site remembers whether you have already seen the “Stay updated” form, so we don’t ask again.',
      ],
      'You can control cookies through your browser settings, although disabling some may affect website functionality.',
    ),
    s(
      'Retention',
      'We retain personal information only for as long as reasonably necessary to respond to enquiries, manage client relationships, maintain business records, meet legal obligations and resolve disputes. Retention depends on the type and purpose of the information. When it is no longer needed, we will take reasonable steps to delete it or securely de-identify it, subject to legal requirements.',
    ),
    s(
      'Security',
      'We use reasonable technical, organisational and administrative measures designed to protect information from unauthorised access, loss, misuse, alteration or disclosure. No website or transmission method can be guaranteed completely secure. Please contact us promptly if you suspect misuse of your information or account.',
    ),
    s(
      'Your rights',
      'Subject to applicable law and exceptions, you may request access to your personal information, correction of inaccurate information, deletion, objection to or restriction of certain processing, withdrawal of consent where applicable, or a portable copy where the law provides that right. You may also complain to the relevant data-protection authority.',
      'To make a request, email support@barodsglobal.com and explain what you need. We may verify your identity before acting and will respond within the legally required timeframe. Some information may need to be retained where the law permits or requires it.',
    ),
    s(
      'Marketing and updates',
      'If you ask to receive updates, we may use your contact details to send relevant property or company information. You can opt out at any time using an unsubscribe instruction where available or by contacting support@barodsglobal.com. We may still send service-related messages needed to respond to your request.',
    ),
    s(
      'Children',
      'Our website and services are intended for adults involved in property enquiries, transactions or investment. We do not knowingly seek children’s personal information in circumstances where parental consent or another legal basis is required. Contact us if you believe a child has provided information improperly.',
    ),
    s(
      'Third-party websites',
      'Our website may link to third-party websites, maps, social platforms, messaging services or other external resources. We do not control their privacy practices. Please review their privacy notices before providing information.',
    ),
    s(
      'Changes to this policy',
      'We may update this policy to reflect changes in services, technology or legal requirements. The revised version will be published on the website with an updated effective or last-updated date. Significant changes may be highlighted where appropriate.',
    ),
    s('Contact us', ['Barods Global Limited', ADDRESS, 'Email: support@barodsglobal.com', 'Telephone: +234 802 228 8806']),
  ],
};

export const termsOfUse: LegalDoc = {
  title: 'Terms of Use',
  subtitle: 'Rules for using the Barods Global Limited website',
  updated: UPDATED,
  sections: [
    s(
      'Acceptance',
      'These Terms of Use govern access to and use of the Barods Global Limited website, including property listings, service information, enquiry and viewing forms, blog content and any agent or staff portal (“Website”). By using the Website, you agree to these Terms. If you do not agree, do not use the Website.',
      'Separate written agreements, property-specific documents, agency terms or booking conditions may apply to a particular service or transaction. Where applicable, the signed or property-specific agreement governs that transaction to the extent stated in it and permitted by law.',
    ),
    s(
      'About Barods Global Limited',
      `Barods Global Limited is a Nigerian real estate and property advisory company registered under RC 1728787. Address: ${ADDRESS}. Contact: support@barodsglobal.com | +234 802 228 8806.`,
    ),
    s(
      'Website purpose',
      'The Website provides general information about Barods, its real estate services and properties that may be available for sale, rent or shortlet. It may allow users to search listings, contact agents, request information or viewings, and request updates. Features may change.',
      'Unless a written agreement expressly states otherwise, a listing or enquiry is not an offer to sell or lease, a reservation, a contract of sale, a tenancy agreement or a guarantee that a property is available.',
    ),
    s(
      'Property listings and information',
      'We aim to keep listings useful and accurate, but information may be supplied by owners, developers, landlords, agents or other third parties. Details can change without notice and may contain errors or omissions.',
      'Descriptions, photographs, floor areas, maps, locations, title information, amenities, prices, payment plans, availability and estimated completion dates must be independently confirmed before you decide. Images may be illustrative or may not show every feature or the current condition.',
      'A listing does not guarantee availability, price, title status, planning approval, physical condition, rental yield, capital appreciation or investment performance. We may correct, update, suspend or remove listings.',
    ),
    s(
      'Independent due diligence',
      'Before paying for, acquiring, leasing, developing or investing in property, conduct independent due diligence appropriate to the transaction. This may include verifying ownership and title documents, survey plans and boundaries, government acquisition status, encumbrances, planning/building approvals, physical condition, access, utilities, taxes and the identity and authority of the seller or lessor.',
      'Where appropriate, obtain advice from a qualified Nigerian legal practitioner, registered surveyor, estate surveyor and valuer, engineer, tax adviser or other relevant professional. Do not rely solely on a listing, marketing material, verbal statement or message as proof of title or as a substitute for professional advice.',
    ),
    s(
      'Our role and third-party owners',
      'Depending on the transaction, Barods may act as a marketing or sales agent, intermediary, consultant or adviser. Our role and any fee, commission, mandate or obligation should be confirmed in the relevant written agreement.',
      'Unless expressly stated in writing, Barods is not the owner or developer of every listed property and does not control all decisions made by owners, developers, landlords, tenants or other third parties. Those parties may determine final prices, availability, payment schedules, allocation, completion, handover, refunds and other transaction terms, subject to applicable law and their agreements.',
    ),
    s(
      'Prices, payments, refunds and bookings',
      'Prices may be displayed in Nigerian naira or an approximate converted currency. Currency conversions are estimates and may not reflect a bank or payment provider’s rate. Confirm the final price, currency, taxes, fees, payment recipient, schedule and additional charges in writing before payment.',
      'Do not pay solely because a listing, message or person claims to represent Barods. Verify payment instructions through our official contact details. Obtain an official receipt and retain transaction records.',
      'Reservation fees, deposits, instalments, cancellations, refunds, transfers, allocations and forfeitures are governed by the specific written agreement and applicable law. Nothing in these Terms removes rights that cannot lawfully be excluded. An enquiry or viewing request is not confirmed unless expressly confirmed by us.',
    ),
    s(
      'Acceptable use',
      'You must use the Website lawfully and responsibly. You must not:',
      [
        'submit false, misleading, fraudulent or unauthorised information;',
        'impersonate another person or interfere with other users’ access;',
        'attempt unauthorised access to the Website, portal, accounts, servers or data;',
        'upload malicious code, spam, unlawful content or material infringing another person’s rights;',
        'copy, scrape, harvest or republish listings or contact details at scale without written permission; or',
        'use Website content to mislead others, commit fraud or breach applicable law.',
      ],
    ),
    s(
      'Accounts and agent portal',
      'If the Website provides an account or agent/staff portal, keep your login credentials confidential and notify Barods promptly if you suspect unauthorised access. Access may be suspended or revoked for security, operational or compliance reasons. Portal access does not give a user ownership of the Website or permission to use data beyond their authorised role.',
    ),
    s(
      'Intellectual property',
      'Unless otherwise stated, Website design, text, branding, logos, graphics and original materials are owned by or licensed to Barods Global Limited and protected by applicable law. You may view and print reasonable extracts for personal, non-commercial use. You must not reproduce, adapt, distribute or commercially exploit Website content without prior written permission, except where the law permits.',
    ),
    s(
      'Third-party links',
      'The Website may link to third-party websites, maps, social media, messaging services, property owners or service providers. These links are provided for convenience. Barods does not control and is not responsible for third-party content, availability, policies, products or services. Third-party dealings may be subject to their own terms.',
    ),
    s(
      'Disclaimers',
      'To the extent permitted by law, the Website and its content are provided on an “as available” basis. We do not warrant that the Website will always be uninterrupted, error-free, secure or free of harmful components, or that every listing will be complete, current or suitable for your purposes.',
      'Website information is general information and is not, by itself, legal, tax, financial, valuation, engineering or investment advice. No Website statement guarantees profit, rental income, capital appreciation, title validity, planning approval or a particular outcome.',
    ),
    s(
      'Limitation of liability',
      'To the extent permitted by applicable law, Barods Global Limited will not be liable for indirect or consequential loss, loss of profit or opportunity, or loss arising from reliance on inaccurate third-party listing information, third-party acts or omissions, or temporary Website unavailability.',
      'Nothing in these Terms excludes or limits liability where prohibited by law, including liability that cannot lawfully be excluded for fraud, wilful misconduct, death or personal injury caused by negligence, or non-excludable statutory rights. These Terms do not replace obligations expressly accepted by Barods under a separate written agreement.',
    ),
    s(
      'User responsibility',
      'To the extent permitted by law, you are responsible for losses or reasonable costs directly arising from your unlawful use of the Website, material breach of these Terms or infringement of another person’s rights. This does not apply to the extent a loss was caused by Barods’ own breach, negligence or unlawful conduct.',
    ),
    s(
      'Privacy',
      'Our collection and use of personal information is explained in the Barods Global Limited Privacy Policy. Please read it before submitting personal information.',
    ),
    s(
      'Changes and availability',
      'We may update, suspend or discontinue parts of the Website, change features, correct content or restrict access where reasonably necessary for maintenance, security, legal compliance or business operations. We may update these Terms by publishing a revised version on the Website. The latest version applies from its stated effective date or publication date, subject to applicable law.',
    ),
    s(
      'Governing law and disputes',
      'These Terms are governed by the laws of the Federal Republic of Nigeria. Subject to mandatory legal requirements and any dispute-resolution clause in a separate signed agreement, disputes relating to these Terms shall be brought before a court of competent jurisdiction in Nigeria.',
    ),
    s('Contact us', ['Barods Global Limited', ADDRESS, 'Email: support@barodsglobal.com', 'Telephone: +234 802 228 8806']),
  ],
};
