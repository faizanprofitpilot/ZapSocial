import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ZapierWebhookForm } from "@/components/settings/ZapierWebhookForm";
import { CommentAutomationForm } from "@/components/settings/CommentAutomationForm";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: webhook } = await supabase
    .from("zapier_webhooks")
    .select("webhook_url")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <div className="md:flex md:gap-8">
          <Sidebar />
          <div className="flex-1 space-y-6">
            <CommentAutomationForm />
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Zapier Integration</CardTitle>
                <CardDescription>
                  Configure your Zapier webhook URL to enable one-click publishing to Notion, Medium, Webflow, or any platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ZapierWebhookForm initialUrl={webhook?.webhook_url} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
