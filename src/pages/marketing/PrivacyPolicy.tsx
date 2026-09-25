import { Link } from 'react-router-dom'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { Container } from '@/components/ui'
import { usePageMeta } from '@/hooks/usePageMeta'

export function PrivacyPolicy() {
  usePageMeta({
    title: 'Privacy Policy — TwinSpace360',
    description:
      'Learn how TwinSpace360 collects, uses, protects, and handles your personal information when using our website and 3D property tour platform.',
    path: '/privacy',
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
              PRIVACY POLICY
            </h1>

            <p className="mt-4 text-base leading-relaxed text-ink-600 sm:text-lg">
              At <strong className="font-semibold text-ink-950">TwinSpace360</strong> (“TwinSpace360,” “we,” “us,” or “our”), we respect your privacy and are committed to protecting the personal information you provide when using our website, services, and 3D property-tour platform.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/terms"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-950/12 bg-paper px-3.5 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-100/70 hover:text-ink-950"
              >
                View Terms and Conditions →
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
                This Privacy Policy explains what information we collect, how we use it, how we protect it, and the choices available to you.
              </p>
            </div>

            {/* 1. Who We Are */}
            <div id="section-1" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                1. Who We Are
              </h2>
              <p>
                TwinSpace360 provides 3D property-tour and digital property presentation services. Through our website, users may browse properties, view property information and 3D tours, and contact TwinSpace360 regarding our services.
              </p>
              <div className="mt-3 rounded-lg border border-ink-950/10 bg-ink-50/50 p-4 text-sm space-y-1.5">
                <p><strong className="text-ink-950">Business Name:</strong> TwinSpace360</p>
                <p><strong className="text-ink-950">Website:</strong> <a href="https://www.twinspace360.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-700">https://www.twinspace360.com</a></p>
                <p><strong className="text-ink-950">Email:</strong> <a href="mailto:support@twinspace360.com" className="text-brand-600 underline hover:text-brand-700">support@twinspace360.com</a></p>
                <p><strong className="text-ink-950">Location:</strong> Kenya</p>
              </div>
              <p>
                For privacy-related questions or requests, contact us at{' '}
                <a href="mailto:support@twinspace360.com" className="font-semibold text-brand-600 underline hover:text-brand-700">
                  support@twinspace360.com
                </a>.
              </p>
            </div>

            {/* 2. Information We Collect */}
            <div id="section-2" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                2. Information We Collect
              </h2>
              <p>
                Depending on how you use our website, we may collect the following information:
              </p>

              <h3 className="text-lg font-semibold text-ink-950 pt-2">
                Information You Provide to Us
              </h3>
              <p>
                When you submit a contact form, enquiry, request, or other information through our website, we may collect:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Property or business information</li>
                <li>Message or enquiry details</li>
                <li>Any other information you voluntarily provide</li>
              </ul>

              <h3 className="text-lg font-semibold text-ink-950 pt-3">
                Property Information
              </h3>
              <p>
                Where property owners, agents, developers, businesses, or other clients engage TwinSpace360 to create a digital property presentation, we may process information relating to the property, including:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Property address or location</li>
                <li>Property descriptions</li>
                <li>Property photographs</li>
                <li>Floor plans or other property materials</li>
                <li>3D/virtual-tour data</li>
                <li>Property features and amenities</li>
                <li>Other information provided by the property owner or authorized representative</li>
              </ul>

              <h3 className="text-lg font-semibold text-ink-950 pt-3">
                Technical Information
              </h3>
              <p>
                When you visit our website, certain technical information may be collected automatically, such as:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device type</li>
                <li>Operating system</li>
                <li>Pages visited</li>
                <li>Approximate usage information</li>
                <li>Date and time of access</li>
                <li>Technical information required to operate and secure the website</li>
              </ul>
              <p className="text-sm text-ink-600">
                Where applicable, we may use cookies or similar technologies for website functionality, analytics, security, and performance.
              </p>
            </div>

            {/* 3. How We Use Your Information */}
            <div id="section-3" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                3. How We Use Your Information
              </h2>
              <p>We may use information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Provide and operate the TwinSpace360 website and services</li>
                <li>Respond to enquiries and requests</li>
                <li>Communicate with customers and prospective customers</li>
                <li>Arrange property scanning or 3D-tour services</li>
                <li>Create, manage, and display property listings</li>
                <li>Improve our website and services</li>
                <li>Maintain website security</li>
                <li>Detect and prevent misuse, fraud, or unauthorized activity</li>
                <li>Understand how visitors use our website</li>
                <li>Maintain business and administrative records</li>
                <li>Comply with applicable legal and regulatory obligations</li>
              </ul>
              <p>
                We will only use personal information for purposes that are relevant to the operation of TwinSpace360 and our relationship with you.
              </p>
            </div>

            {/* 4. Property Listings and Public Information */}
            <div id="section-4" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                4. Property Listings and Public Information
              </h2>
              <p>
                Some information displayed on TwinSpace360 may be intentionally made publicly available.
              </p>
              <p>For example, a published property listing may contain:</p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Property photographs</li>
                <li>Property descriptions</li>
                <li>Property features</li>
                <li>General or specific location information</li>
                <li>3D/virtual-tour content</li>
                <li>Contact or enquiry options</li>
              </ul>
              <p>
                Property information submitted for publication should be information that the property owner or authorized representative has the right to provide and publish.
              </p>
              <p>
                TwinSpace360 may rely on information supplied by property owners, agents, developers, or other authorized parties.
              </p>
            </div>

            {/* 5. How We Share Information */}
            <div id="section-5" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                5. How We Share Information
              </h2>
              <p className="font-semibold text-ink-950">
                We do not sell your personal information.
              </p>
              <p>
                We may share information where reasonably necessary to operate TwinSpace360, including with:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Service providers that help us host, maintain, secure, or operate our website</li>
                <li>Technology and infrastructure providers</li>
                <li>Property owners, agents, or representatives where necessary to respond to an enquiry concerning their property</li>
                <li>Professional advisers where reasonably necessary</li>
                <li>Government authorities or other parties where required by applicable law</li>
              </ul>
              <p>
                We only intend to share information where there is a legitimate business, contractual, security, or legal reason to do so.
              </p>
            </div>

            {/* 6. Third-Party Services */}
            <div id="section-6" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                6. Third-Party Services
              </h2>
              <p>
                TwinSpace360 may use third-party services to operate parts of our website and services.
              </p>
              <p>These may include services for:</p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Website hosting</li>
                <li>Database and file storage</li>
                <li>Authentication</li>
                <li>Analytics</li>
                <li>3D/virtual-tour hosting</li>
                <li>Website security</li>
                <li>Communication and email services</li>
              </ul>
              <p>
                Third-party providers may process information according to their own privacy policies and terms.
              </p>
              <p>
                Where appropriate, links to third-party websites or services may also appear on TwinSpace360. We are not responsible for the privacy practices of websites that we do not operate.
              </p>
            </div>

            {/* 7. Cookies and Similar Technologies */}
            <div id="section-7" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                7. Cookies and Similar Technologies
              </h2>
              <p>TwinSpace360 may use cookies or similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Keep the website functioning properly</li>
                <li>Remember necessary preferences</li>
                <li>Improve website performance</li>
                <li>Understand website usage</li>
                <li>Maintain security</li>
              </ul>
              <p>
                You may be able to control or disable certain cookies through your browser settings. Disabling certain cookies may affect how parts of the website function.
              </p>
            </div>

            {/* 8. Data Security */}
            <div id="section-8" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                8. Data Security
              </h2>
              <p>
                We take reasonable technical and organizational measures to protect personal information against unauthorized access, loss, misuse, alteration, or disclosure.
              </p>
              <p>
                However, no website, online service, or method of electronic transmission can be guaranteed to be completely secure.
              </p>
            </div>

            {/* 9. Data Retention */}
            <div id="section-9" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                9. Data Retention
              </h2>
              <p>
                We retain personal information only for as long as reasonably necessary for the purposes described in this Privacy Policy, including to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Provide our services</li>
                <li>Respond to enquiries</li>
                <li>Maintain business records</li>
                <li>Meet legal or regulatory obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce agreements</li>
              </ul>
              <p>
                The period for which information is retained may depend on the type of information and the reason it was collected.
              </p>
            </div>

            {/* 10. Your Privacy Rights */}
            <div id="section-10" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                10. Your Privacy Rights
              </h2>
              <p>
                Subject to applicable law, you may have rights concerning your personal information, including the right to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-ink-700">
                <li>Request access to personal information we hold about you</li>
                <li>Request correction of inaccurate or incomplete information</li>
                <li>Request deletion of personal information where applicable</li>
                <li>Object to or restrict certain processing</li>
                <li>Withdraw consent where processing is based on consent</li>
                <li>Make a complaint concerning the handling of your personal information</li>
              </ul>
              <p>To make a privacy request, contact us at:</p>
              <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-4 text-sm">
                <a href="mailto:support@twinspace360.com" className="font-semibold text-brand-700 underline hover:text-brand-800">
                  support@twinspace360.com
                </a>
              </div>
              <p className="text-sm text-ink-600">
                We may need to verify your identity before processing certain requests.
              </p>
            </div>

            {/* 11. Children's Privacy */}
            <div id="section-11" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                11. Children's Privacy
              </h2>
              <p>
                TwinSpace360 is not specifically directed toward children.
              </p>
              <p>
                We do not knowingly seek to collect personal information from children without appropriate authorization. If you believe that a child has provided personal information to us improperly, please contact us so that we can review the situation.
              </p>
            </div>

            {/* 12. International Data Transfers */}
            <div id="section-12" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                12. International Data Transfers
              </h2>
              <p>
                Some of our technology or service providers may process information in countries outside Kenya.
              </p>
              <p>
                Where personal information is transferred or processed outside Kenya, we will take reasonable steps to ensure that such processing is carried out in accordance with applicable data-protection requirements.
              </p>
            </div>

            {/* 13. Changes to This Privacy Policy */}
            <div id="section-13" className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                13. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes to our services, technology, legal requirements, or privacy practices.
              </p>
              <p>
                When we make changes, we will update the <strong className="font-semibold text-ink-950">“Last Updated”</strong> date at the beginning of this Policy.
              </p>
            </div>

            {/* 14. Contact Us */}
            <div id="section-14" className="space-y-4 rounded-xl border border-ink-950/10 bg-paper p-6 sm:p-8 shadow-soft">
              <h2 className="font-display text-2xl font-bold text-ink-950">
                14. Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy or how TwinSpace360 handles personal information, please contact:
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
