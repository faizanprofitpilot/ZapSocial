import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Calendar, FileText, Bot, BarChart3, Plug, Check } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <div className="min-h-screen bg-[#0f172a] bg-content-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          {/* Hero */}
          <section className="py-20 text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-brand bg-clip-text text-transparent">
              ZapSocial
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
              AI-powered social media management. Create, schedule, and publish content across all platforms — with an AI copilot that learns your brand.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-brand hover:bg-gradient-brand-hover">
                  Start Creating
                </Button>
              </Link>
              <Link href="/#pricing">
                <Button size="lg" variant="outline">View Pricing</Button>
              </Link>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="py-20 scroll-mt-24">
            <h3 className="text-3xl font-semibold text-center mb-12 text-gray-50">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="hover:shadow-brand-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-50">AI Post Generator</CardTitle>
                  <CardDescription className="text-gray-300">
                    Generate engaging social media posts with captions and hashtags for any platform
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-brand-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-50">Calendar & Scheduling</CardTitle>
                  <CardDescription className="text-gray-300">
                    Plan and schedule your content across LinkedIn, Instagram, Facebook, and more
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-brand-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-50">AI Copilot</CardTitle>
                  <CardDescription className="text-gray-300">
                    Get strategic advice, content ideas, and optimization tips from your AI marketing assistant
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-brand-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-50">Posts Manager</CardTitle>
                  <CardDescription className="text-gray-300">
                    Manage all your drafts, scheduled, and published posts in one place
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-brand-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                    <Plug className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-50">Platform Integrations</CardTitle>
                  <CardDescription className="text-gray-300">
                    Connect and publish directly to Instagram, LinkedIn, and Facebook
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-brand-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-50">Analytics & Insights</CardTitle>
                  <CardDescription className="text-gray-300">
                    Track impressions, engagement, and performance across all your social platforms
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="py-20 scroll-mt-24">
            <h3 className="text-3xl font-semibold text-center mb-12 text-gray-50">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free */}
              <Card className="hover:shadow-brand-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-gray-50">Free</CardTitle>
                  <CardDescription>Perfect for trying out</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-50">$0</span>
                    <span className="text-gray-300">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">10 posts/month</span></li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">AI post generation</span></li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">Basic scheduling</span></li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">1 platform connection</span></li>
                  </ul>
                  <Link href="/auth/signup">
                    <Button variant="outline" className="w-full">Get Started</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pro */}
              <Card className="border-2 border-brand-500 shadow-brand-lg relative hover:shadow-brand-lg transition-all duration-300">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-brand-600 text-white text-xs font-medium px-3 py-1 rounded-full">Popular</span>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-gray-50">Pro</CardTitle>
                  <CardDescription>For content creators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-50">$19</span>
                    <span className="text-gray-300">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">Unlimited posts</span></li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">All platform connections</span></li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">AI Copilot access</span></li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">Advanced analytics</span></li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">AI image generation</span></li>
                  </ul>
                  <Link href="/auth/signup">
                    <Button className="w-full bg-gradient-brand hover:bg-gradient-brand-hover">Get Started</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Enterprise */}
              <Card className="hover:shadow-brand-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-gray-50">Enterprise</CardTitle>
                  <CardDescription>For agencies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-50">$49</span>
                    <span className="text-gray-300">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">Everything in Pro</span></li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">Team collaboration</span></li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">Priority support</span></li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-brand-600" /><span className="text-gray-300">Custom integrations</span></li>
                  </ul>
                  <Link href="/auth/signup">
                    <Button variant="outline" className="w-full">Contact Sales</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 text-center">
            <h3 className="text-3xl font-semibold text-gray-50 mb-4">Ready to get started?</h3>
            <p className="text-gray-300 mb-8">Start managing your social media with AI today.</p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-brand hover:bg-gradient-brand-hover">
                Sign Up Free
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
