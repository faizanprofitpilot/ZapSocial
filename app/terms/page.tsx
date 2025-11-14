import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Navbar isAuthenticated={false} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-semibold text-gray-50 mb-8">Terms of Service</h1>
          <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Agreement to Terms</h2>
            <p className="text-gray-300 mb-4">
              By accessing or using ZapSocial (&quot;Service&quot;, &quot;Platform&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of these Terms, you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Description of Service</h2>
            <p className="text-gray-300 mb-4">
              ZapSocial is an AI-powered social media management platform that helps users create, schedule, and publish content across multiple social media platforms, including Facebook, Instagram, and LinkedIn.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">User Accounts</h2>
            <p className="text-gray-300 mb-4">
              To use our Service, you must:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Be at least 13 years of age</li>
              <li>Provide accurate and complete information when creating an account</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Subscription Plans and Payments</h2>
            <p className="text-gray-300 mb-4">
              We offer multiple subscription tiers:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Free Tier</strong>: Limited features and usage</li>
              <li><strong>Pro</strong>: $19/month - Unlimited usage and features</li>
              <li><strong>Enterprise</strong>: $49/month - Includes team features and priority support</li>
            </ul>
            <p className="text-gray-300 mb-4">
              Subscriptions are billed monthly. You may cancel at any time. Refunds are not provided for partial billing periods, except as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Usage Limits</h2>
            <p className="text-gray-300 mb-4">
              Usage limits apply based on your subscription tier. Exceeding these limits may result in:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Temporary suspension of service</li>
              <li>Prompt to upgrade to a higher tier</li>
              <li>Account review for abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Content Ownership and License</h2>
            <p className="text-gray-300 mb-4">
              You retain ownership of all content you create using our Service. By using our Service, you grant us a limited, non-exclusive license to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Store and process your content to provide the Service</li>
              <li>Publish content on your behalf to connected platforms</li>
              <li>Use anonymized, aggregated data for service improvement</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Prohibited Uses</h2>
            <p className="text-gray-300 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Violate any laws or regulations</li>
              <li>Create or publish harmful, abusive, or illegal content</li>
              <li>Impersonate others or provide false information</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the Service to spam or harass others</li>
              <li>Share account credentials with others</li>
              <li>Use automated systems to access the Service excessively</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Third-Party Platforms</h2>
            <p className="text-gray-300 mb-4">
              Our Service integrates with third-party platforms (Facebook, Instagram, LinkedIn). By connecting these platforms:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>You agree to comply with their terms of service</li>
              <li>We are not responsible for their policies or actions</li>
              <li>Content published to these platforms is subject to their moderation policies</li>
              <li>You may disconnect platforms at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">AI-Generated Content</h2>
            <p className="text-gray-300 mb-4">
              Our Service uses AI to generate content suggestions. You acknowledge that:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>AI-generated content may not always be accurate or appropriate</li>
              <li>You are responsible for reviewing and editing all content before publishing</li>
              <li>You should not rely solely on AI-generated content for critical communications</li>
              <li>We are not liable for any consequences of AI-generated content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Service Availability</h2>
            <p className="text-gray-300 mb-4">
              We strive to maintain high availability but do not guarantee:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Uninterrupted or error-free service</li>
              <li>Timely delivery of scheduled posts</li>
              <li>Compatibility with all third-party platform changes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Limitation of Liability</h2>
            <p className="text-gray-300 mb-4">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>We are not liable for indirect, incidental, or consequential damages</li>
              <li>Our total liability is limited to the amount you paid in the past 12 months</li>
              <li>We are not responsible for content published on third-party platforms</li>
              <li>We do not guarantee the accuracy of AI-generated content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Termination</h2>
            <p className="text-gray-300 mb-4">
              We may suspend or terminate your account if you:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Violate these Terms</li>
              <li>Fail to pay subscription fees</li>
              <li>Engage in fraudulent or abusive activity</li>
              <li>Request account deletion</li>
            </ul>
            <p className="text-gray-300 mb-4">
              You may cancel your subscription at any time. Upon termination, your access to the Service will cease, but you may export your data before termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Changes to Terms</h2>
            <p className="text-gray-300 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the Service. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Governing Law</h2>
            <p className="text-gray-300 mb-4">
              These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-300">
              Email: legal@zapsocial.com
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

