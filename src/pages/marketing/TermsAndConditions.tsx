import { Link } from 'react-router-dom'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { Container } from '@/components/ui'
import { usePageMeta } from '@/hooks/usePageMeta'

export function TermsAndConditions() {
  usePageMeta({
    title: 'Terms and Conditions — TwinSpace360',
    description:
      'Read the Terms and Conditions governing your access to and use of the TwinSpace360 website, 3D property tours, and digital presentation platform.',
    path: '/terms',
  })

  return (
    <MarketingLayout>
      <div className="h-16 sm:h-20" />

      {/* Header Banner */}
      <section className="border-b border-ink-950/8 bg-ink-50/50 py-12 sm:py-16">
        <Container>
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-700">
                Legal
              </span>
              <span className="text-xs font-medium text-ink-500">
                Last Updated: September 25, 2026
              </span>
            </div>

            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
              TERMS AND CONDITIONS
            </h1>

            <p className="mt-4 text-base leading-relaxed text-ink-600 sm:text-lg">
              Welcome to <strong className="font-semibold text-ink-950">TwinSpace360</strong>. These Terms and Conditions (“Terms”) govern your access to and use of the TwinSpace360 website, platform, 3D property tours, property listings, and related services.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/privacy"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-950/12 bg-paper px-3.5 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-100/70 hover:text-ink-950"
              >
                View Privacy Policy →
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <Container>
          <div className="mx-auto max-w-4xl space-y-12 text-ink-800 leading-relaxed">
            <div className="rounded-xl border border-ink-950/8 bg-paper p-6 sm:p-8 shadow-soft">
              <p className="text-base text-ink-700">
                By accessing or using TwinSpace360, you agree to these Terms. If you do not agree with these Terms, please do not use the website or services.
              </p>
            </div>

            {/* 1. About TwinSpace360 */}
            <div id="section-1" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                1. About TwinSpace360
              </h2>
              <p>
                TwinSpace360 provides digital property presentation services, including 3D virtual tours, property listings, photography, digital property information, and related services.
              </p>
              <p>
                The TwinSpace360 website allows visitors to discover properties and services and allows prospective customers to contact TwinSpace360 or enquire about properties and services.
              </p>
            </div>

            {/* 2. Use of the Website */}
            <div id="section-2" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                2. Use of the Website
              </h2>
              <p>
                You agree to use TwinSpace360 only for lawful purposes.
              </p>
              <p>You must not:</p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Use the website for unlawful, fraudulent, or abusive purposes</li>
                <li>Attempt to gain unauthorized access to the website or its systems</li>
                <li>Interfere with the operation or security of the website</li>
                <li>Copy, reproduce, scrape, or commercially exploit website content without permission</li>
                <li>Upload or submit malicious code or harmful material</li>
                <li>Impersonate another person or organization</li>
                <li>Submit information that you know to be false or misleading</li>
                <li>Use the website in a way that could damage TwinSpace360, its users, or its systems</li>
              </ul>
              <p>
                We reserve the right to restrict or terminate access where we reasonably believe these Terms have been violated.
              </p>
            </div>

            {/* 3. Property Listings */}
            <div id="section-3" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                3. Property Listings
              </h2>
              <p>
                Property listings displayed on TwinSpace360 may be submitted by property owners, agents, developers, businesses, or other authorized representatives.
              </p>
              <p>
                While TwinSpace360 may review or manage listings, we do not guarantee that every piece of property information supplied by a third party is complete, accurate, current, or error-free.
              </p>
              <p>Property information may include:</p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Descriptions</li>
                <li>Images</li>
                <li>Property features</li>
                <li>Location information</li>
                <li>Pricing information</li>
                <li>Availability information</li>
                <li>Floor plans</li>
                <li>3D/virtual tours</li>
              </ul>
              <p>
                Visitors should independently verify important property information with the relevant property owner, agent, or representative before making a purchase, rental, investment, or other decision.
              </p>
            </div>

            {/* 4. 3D Virtual Tours */}
            <div id="section-4" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                4. 3D Virtual Tours
              </h2>
              <p>
                TwinSpace360 may provide interactive 3D or virtual-tour experiences.
              </p>
              <p>
                Virtual tours are intended to provide a digital representation of a property and may not capture every detail or condition of the property.
              </p>
              <p>Differences may occur due to:</p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Camera positioning</li>
                <li>Lighting</li>
                <li>Image processing</li>
                <li>Property changes after scanning</li>
                <li>Technical limitations</li>
                <li>Internet connection or device performance</li>
              </ul>
              <p>
                A virtual tour should not be treated as a substitute for physical inspection where physical inspection is necessary or appropriate.
              </p>
            </div>

            {/* 5. Property Owners and Clients */}
            <div id="section-5" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                5. Property Owners and Clients
              </h2>
              <p>
                If you engage TwinSpace360 to create a 3D tour, listing, or other digital property service, you represent that:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>You own the property or are authorized to act on behalf of the owner or relevant rights holder</li>
                <li>You have the necessary authority to provide property information and materials to TwinSpace360</li>
                <li>You have the necessary rights or permissions for photographs, documents, branding, logos, and other materials you provide</li>
                <li>The information you provide is not knowingly false or misleading</li>
                <li>You will inform TwinSpace360 of any material changes that should be reflected in published property information</li>
              </ul>
              <p>
                You remain responsible for the accuracy and lawful use of information and materials that you provide to TwinSpace360.
              </p>
            </div>

            {/* 6. Intellectual Property */}
            <div id="section-6" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                6. Intellectual Property
              </h2>
              <p>
                Unless otherwise stated, TwinSpace360 and its licensors retain rights in the TwinSpace360 website, branding, design, software, graphics, text, logos, original photographs, 3D-tour content created by TwinSpace360, and other original materials produced or owned by TwinSpace360.
              </p>
              <p>
                You may not reproduce, modify, distribute, sell, publicly display, or commercially exploit TwinSpace360-owned content without prior written permission, except where permitted by law.
              </p>
              <p>
                Where a customer supplies property photographs, branding, documents, or other materials, ownership of those materials remains with the customer or the relevant rights holder, subject to any rights granted to TwinSpace360 to provide the agreed services.
              </p>
            </div>

            {/* 7. Customer Content and Permission to Use It */}
            <div id="section-7" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                7. Customer Content and Permission to Use It
              </h2>
              <p>
                When you provide property information, photographs, videos, documents, logos, or other content to TwinSpace360, you grant TwinSpace360 the permission reasonably necessary to store, process, edit, reproduce, publish, and display that content for the purpose of providing the agreed services.
              </p>
              <p>
                The scope of any promotional or marketing use outside the agreed service may be subject to a separate agreement or permission.
              </p>
            </div>

            {/* 8. Enquiries and Communications */}
            <div id="section-8" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                8. Enquiries and Communications
              </h2>
              <p>
                Submitting an enquiry through TwinSpace360 does not create a contract between you and TwinSpace360 or between you and a property owner.
              </p>
              <p>
                TwinSpace360 may use the information submitted through an enquiry to respond to your request and, where relevant, connect you with the appropriate property owner, agent, or service representative.
              </p>
              <p>
                We do not guarantee that an enquiry will result in a response, viewing, transaction, booking, sale, rental, or other outcome.
              </p>
            </div>

            {/* 9. Pricing and Services */}
            <div id="section-9" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                9. Pricing and Services
              </h2>
              <p>
                Where TwinSpace360 publishes pricing for its services, prices may be subject to change.
              </p>
              <p>
                A displayed price does not necessarily constitute a binding offer unless expressly stated otherwise.
              </p>
              <p>
                Specific projects may be governed by a separate quotation, invoice, service agreement, or other written agreement. Where such an agreement exists, its terms may apply to the relevant service.
              </p>
            </div>

            {/* 10. Payments */}
            <div id="section-10" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                10. Payments
              </h2>
              <p>
                Where payment is required for TwinSpace360 services, the applicable payment terms will be communicated to the customer before or during the engagement.
              </p>
              <p>
                Customers are responsible for providing accurate billing and payment information and paying amounts due within the agreed timeframe.
              </p>
              <p>
                Additional terms relating to deposits, cancellations, refunds, rescheduling, or project completion may be included in the relevant quotation or service agreement.
              </p>
            </div>

            {/* 11. Website Availability */}
            <div id="section-11" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                11. Website Availability
              </h2>
              <p>
                We aim to keep TwinSpace360 available and functioning properly, but we do not guarantee that the website will always be:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Available without interruption</li>
                <li>Free from errors</li>
                <li>Free from technical problems</li>
                <li>Compatible with every device or browser</li>
                <li>Available without maintenance or downtime</li>
              </ul>
              <p>
                We may temporarily suspend or modify parts of the website where reasonably necessary for maintenance, security, updates, or other operational reasons.
              </p>
            </div>

            {/* 12. Third-Party Services and Links */}
            <div id="section-12" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                12. Third-Party Services and Links
              </h2>
              <p>
                TwinSpace360 may use or link to third-party platforms, services, websites, or embedded content.
              </p>
              <p>
                Third-party services may have their own terms and privacy policies.
              </p>
              <p>
                TwinSpace360 is not responsible for the availability, content, security, or practices of third-party services that we do not control.
              </p>
            </div>

            {/* 13. Disclaimers */}
            <div id="section-13" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                13. Disclaimers
              </h2>
              <p>
                To the extent permitted by applicable law, TwinSpace360 does not guarantee the accuracy, completeness, reliability, or availability of information supplied by third parties or displayed through property listings.
              </p>
              <p>
                TwinSpace360 does not act as a property owner, landlord, seller, buyer, estate agent, legal adviser, financial adviser, or other professional adviser unless expressly stated in a separate written agreement.
              </p>
              <p>
                Users are responsible for conducting their own appropriate checks before entering into a property transaction or relying on property information.
              </p>
            </div>

            {/* 14. Limitation of Liability */}
            <div id="section-14" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                14. Limitation of Liability
              </h2>
              <p>
                To the extent permitted by applicable law, TwinSpace360 will not be responsible for indirect, incidental, special, consequential, or similar losses arising from your use of the website or reliance on third-party property information.
              </p>
              <p>
                Nothing in these Terms is intended to exclude or limit liability where such exclusion or limitation is prohibited by applicable law.
              </p>
            </div>

            {/* 15. Indemnity */}
            <div id="section-15" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                15. Indemnity
              </h2>
              <p>
                To the extent permitted by applicable law, you agree to be responsible for claims, losses, damages, liabilities, and reasonable expenses arising from your breach of these Terms or from content or materials you provide to TwinSpace360 where you did not have the necessary rights or authority to provide them.
              </p>
            </div>

            {/* 16. Suspension or Termination */}
            <div id="section-16" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                16. Suspension or Termination
              </h2>
              <p>
                TwinSpace360 may suspend or terminate access to the website or services where reasonably necessary, including where:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>These Terms are breached</li>
                <li>The website is being misused</li>
                <li>Unauthorized access or activity is suspected</li>
                <li>Required by law</li>
                <li>Necessary to protect TwinSpace360, its users, or its systems</li>
              </ul>
              <p>
                Termination of access does not necessarily end obligations that by their nature should continue after termination.
              </p>
            </div>

            {/* 17. Privacy */}
            <div id="section-17" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                17. Privacy
              </h2>
              <p>
                Your use of TwinSpace360 is also subject to our{' '}
                <Link to="/privacy" className="font-semibold text-brand-600 underline hover:text-brand-700">
                  Privacy Policy
                </Link>
                , which explains how we collect, use, store, and protect personal information.
              </p>
            </div>

            {/* 18. Changes to These Terms */}
            <div id="section-18" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                18. Changes to These Terms
              </h2>
              <p>
                We may update these Terms from time to time.
              </p>
              <p>
                Updated Terms will be published on this page with a revised <strong className="font-semibold text-ink-950">“Last Updated”</strong> date.
              </p>
              <p>
                Your continued use of TwinSpace360 after updated Terms are published may constitute acceptance of the updated Terms to the extent permitted by applicable law.
              </p>
            </div>

            {/* 19. Governing Law */}
            <div id="section-19" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                19. Governing Law
              </h2>
              <p>
                These Terms shall be governed by and interpreted in accordance with the laws of <strong className="font-semibold text-ink-950">Kenya</strong>, unless applicable law requires otherwise.
              </p>
              <p>
                Any dispute arising in connection with these Terms shall be handled through the appropriate dispute-resolution process and courts having jurisdiction in Kenya.
              </p>
            </div>

            {/* 20. Contact */}
            <div id="section-20" className="space-y-4 rounded-xl border border-ink-950/10 bg-paper p-6 sm:p-8 shadow-soft">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                20. Contact
              </h2>
              <p>
                If you have questions about these Terms, please contact:
              </p>
              <div className="mt-2 space-y-1 text-sm text-ink-700">
                <p><strong className="text-ink-950">TwinSpace360</strong></p>
                <p><strong>Email:</strong> <a href="mailto:support@twinspace360.com" className="text-brand-600 underline hover:text-brand-700">support@twinspace360.com</a></p>
                <p><strong>Website:</strong> <a href="https://www.twinspace360.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-700">https://www.twinspace360.com</a></p>
                <p><strong>Location:</strong> Kenya</p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </MarketingLayout>
  )
}
