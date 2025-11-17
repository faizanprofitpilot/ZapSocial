import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Check } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Navbar isAuthenticated={false} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-semibold text-gray-50 mb-4">Pricing</h1>
          <p className="text-xl text-gray-300">Choose the plan that works for you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
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
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span className="text-gray-300">3 generations/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span className="text-gray-300">Basic content generation</span>
                </li>
              </ul>
              <Link href="/auth/signup">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 border-cyan-500 shadow-cyan-lg relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-cyan-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                Popular
              </span>
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
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span className="text-gray-300">Unlimited generations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span className="text-gray-300">Zapier integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span className="text-gray-300">All content types</span>
                </li>
              </ul>
              <Link href="/auth/signup">
                <Button className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 hover:bg-gradient-to-r from-cyan-400 to-cyan-600-hover">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
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
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span className="text-gray-300">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span className="text-gray-300">Bulk/programmatic SEO</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span className="text-gray-300">Priority support</span>
                </li>
              </ul>
              <Link href="/auth/signup">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
