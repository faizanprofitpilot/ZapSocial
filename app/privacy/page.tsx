import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Navbar isAuthenticated={false} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-semibold text-gray-50 mb-8">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Introduction</h2>
            <p className="text-gray-300 mb-4">
              ZapSocial (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered social media management platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-50 mb-3 mt-6">Personal Information</h3>
            <p className="text-gray-300 mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Email address and account credentials</li>
              <li>Profile information (name, profile picture)</li>
              <li>Content you create, schedule, or publish through our platform</li>
              <li>Payment information (processed securely through Stripe)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-50 mb-3 mt-6">Platform Integration Data</h3>
            <p className="text-gray-300 mb-4">
              When you connect social media platforms (Facebook, Instagram, LinkedIn), we collect:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>OAuth access tokens (stored securely and encrypted)</li>
              <li>Account information (page names, profile data)</li>
              <li>Published post data and engagement metrics</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-50 mb-3 mt-6">Usage Data</h3>
            <p className="text-gray-300 mb-4">
              We automatically collect information about your use of our platform:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Usage statistics (generations, posts created)</li>
              <li>API request logs (for debugging and service improvement)</li>
              <li>Device information and browser type</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your requests and transactions</li>
              <li>Publish and schedule content on connected platforms</li>
              <li>Generate AI-powered content suggestions</li>
              <li>Send you service-related communications</li>
              <li>Enforce usage limits based on your subscription tier</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Third-Party Services</h2>
            <p className="text-gray-300 mb-4">
              We use third-party services that may collect information:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Supabase</strong>: Authentication and database hosting</li>
              <li><strong>OpenAI</strong>: AI content generation (GPT-4o)</li>
              <li><strong>Meta (Facebook/Instagram)</strong>: Social media publishing via OAuth</li>
              <li><strong>LinkedIn</strong>: Social media publishing via OAuth</li>
              <li><strong>Stripe</strong>: Payment processing</li>
              <li><strong>Vercel</strong>: Application hosting and deployment</li>
            </ul>
            <p className="text-gray-300 mb-4">
              These services have their own privacy policies. We recommend reviewing them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Data Security</h2>
            <p className="text-gray-300 mb-4">
              We implement appropriate technical and organizational measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Secure storage of OAuth tokens</li>
              <li>Row-level security (RLS) policies in our database</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p className="text-gray-300 mb-4">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Data Retention</h2>
            <p className="text-gray-300 mb-4">
              We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your account and data at any time by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Your Rights</h2>
            <p className="text-gray-300 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Children&apos;s Privacy</h2>
            <p className="text-gray-300 mb-4">
              Our service is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Changes to This Policy</h2>
            <p className="text-gray-300 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-50 mb-4">Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-gray-300">
              Email: privacy@zapsocial.com
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

