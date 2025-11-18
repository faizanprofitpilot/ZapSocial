"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X as XIcon, Loader2, AlertTriangle, RefreshCw, Clock, CheckCircle, AlertCircle } from "lucide-react";

type Integration = {
  id: string;
  platform: string;
  connected_at: string;
  expires_at?: string | null;
  metadata?: {
    pages?: Array<{
      id: string;
      name: string;
      access_token: string;
      instagram_account?: {
        id: string;
        username: string;
        account_type: string;
      } | null;
    }>;
    app_id?: string;
    expired?: boolean;
    expired_at?: string;
  };
};

const platforms = [
  { id: "instagram", label: "Instagram", logo: "/Instagram logo.png", color: "from-cyan-400 to-cyan-600" },
  { id: "linkedin", label: "LinkedIn", logo: "/Linkedin logo.png", color: "from-blue-500 to-blue-600" },
  { id: "facebook", label: "Facebook", logo: "/Facebook logo.png", color: "from-blue-600 to-blue-700", metaLabel: "Meta" },
];

export default function IntegrationsPage() {
  const router = useRouter();
  // Create Supabase client only at runtime, never during build
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  // Initialize Supabase client only in useEffect (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setSupabase(createClient());
      } catch (error) {
        console.error('Failed to create Supabase client:', error);
      }
    }
  }, []);

  const loadIntegrations = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    const { data } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id);

    setIntegrations(data || []);
    setLoading(false);
  };

  // Load integrations when supabase client is ready
  useEffect(() => {
    if (supabase) {
      loadIntegrations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const connectedPlatforms = integrations.map((i) => i.platform);
  const facebookIntegration = integrations.find((i) => i.platform === "facebook");
  
  // Check if Facebook integration has Instagram accounts
  const hasInstagram = facebookIntegration?.metadata?.pages?.some(
    (page) => page.instagram_account !== null && page.instagram_account !== undefined
  ) ?? false;

  // Always filter out Instagram from platforms list (since it's part of Meta/Facebook)
  // Instagram is accessed through Facebook Pages, so it's managed through the Meta integration
  const visiblePlatforms = platforms.filter(
    (platform) => platform.id !== "instagram"
  );

  // Get display label for Facebook/Meta (always show Meta for Facebook)
  const getPlatformLabel = (platformId: string) => {
    if (platformId === "facebook") {
      return "Meta";
    }
    return platforms.find((p) => p.id === platformId)?.label || platformId;
  };

  const handleConnect = async (platformId: string) => {
    window.location.href = `/api/integrations/oauth/${platformId}`;
  };

  const handleRefreshToken = async (integrationId: string, platform: string) => {
    setRefreshing(integrationId);
    try {
      const endpoint = platform === "linkedin"
        ? "/api/integrations/linkedin/refresh-token"
        : "/api/integrations/facebook/refresh-token";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.expired) {
          alert("Your token has expired. Please reconnect your account.");
          // Optionally redirect to reconnect
          return;
        }
        throw new Error(data.error || "Failed to refresh token");
      }

      // Reload integrations
      await loadIntegrations();
      alert("Token refreshed successfully!");
    } catch (error: any) {
      console.error("Error refreshing token:", error);
      alert(error.message || "Failed to refresh token");
    } finally {
      setRefreshing(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    const platformLabel = getPlatformLabel(platformId);
    if (!confirm(`Are you sure you want to disconnect ${platformLabel}?`)) {
      return;
    }

    setDisconnecting(platformId);
    try {
      const response = await fetch(`/api/integrations/disconnect?platform=${platformId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }

      // Reload integrations
      await loadIntegrations();
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("Failed to disconnect. Please try again.");
    } finally {
      setDisconnecting(null);
    }
  };

  // Get connected accounts info for Facebook/Meta
  const getConnectedAccountsInfo = (integration: Integration | undefined) => {
    if (!integration || integration.platform !== "facebook") {
      return null;
    }

    const pages = integration.metadata?.pages || [];

    if (pages.length === 0) {
      return null;
    }

    const parts = [];
    
    // Add Facebook page names
    const fbPageNames = pages.map((page) => page.name).filter(Boolean);
    if (fbPageNames.length > 0) {
      parts.push(fbPageNames.join(", "));
    }
    
    // Add Instagram account usernames
    const instagramAccounts = pages
      .filter((page) => page.instagram_account !== null && page.instagram_account !== undefined)
      .map((page) => page.instagram_account?.username)
      .filter(Boolean);
    
    if (instagramAccounts.length > 0) {
      parts.push(`@${instagramAccounts.join(", @")}`);
    }

    return parts.join(" · ");
  };

  // Get connected accounts info for LinkedIn
  const getLinkedInAccountsInfo = (integration: Integration | undefined) => {
    if (!integration || integration.platform !== "linkedin") {
      return null;
    }

    const profile = (integration.metadata as any)?.profile;

    // Only personal account (organizations require Community Management API)
    if (profile?.name || profile?.given_name) {
      return profile.name || `${profile.given_name} ${profile.family_name || ""}`.trim();
    }

    return null;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <div className="md:flex md:gap-8">
          <Sidebar />
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePlatforms.map((platform) => {
                const isConnected = connectedPlatforms.includes(platform.id);
                const integration = integrations.find((i) => i.platform === platform.id);
                const connectedAccountsInfo = 
                  platform.id === "facebook" 
                    ? getConnectedAccountsInfo(integration)
                    : platform.id === "linkedin"
                    ? getLinkedInAccountsInfo(integration)
                    : null;
                const displayLabel = getPlatformLabel(platform.id);
                const isDisconnecting = disconnecting === platform.id;

                // For Meta (Facebook), show both Facebook and Instagram icons
                const isMeta = platform.id === "facebook";
                const showDualIcons = isMeta;

                return (
                  <Card key={platform.id} className="hover:shadow-cyan-lg transition-all duration-300">
                    <CardHeader>
                      {showDualIcons ? (
                        <div className="flex items-center gap-2 mb-4">
                          {/* Facebook Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${platform.color}`}>
                            {platform.logo && (
                              <Image
                                src={platform.logo}
                                alt="Facebook"
                                width={48}
                                height={48}
                                className="object-contain"
                              />
                            )}
                          </div>
                          {/* Instagram Icon */}
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-400 to-cyan-600">
                            <Image
                              src="/Instagram logo.png"
                              alt="Instagram"
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${platform.color}`}>
                          {platform.logo && (
                            <Image
                              src={platform.logo}
                              alt={displayLabel}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          )}
                        </div>
                      )}
                      <CardTitle className="text-xl font-semibold text-gray-50">{displayLabel}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {isConnected ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>Connected</span>
                            </div>
                            {connectedAccountsInfo && (
                              <div className="text-xs text-gray-400 mt-1">
                                {connectedAccountsInfo}
                              </div>
                            )}
                            {integration && (() => {
                              const isExpired = integration.metadata?.expired || false;
                              const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
                              const now = new Date();
                              const daysUntilExpiration = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                              const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7 && daysUntilExpiration > 0;

                              // Determine platform capabilities
                              const supportsAutoRefresh = platform.id === "facebook" || platform.id === "linkedin";
                              const hasExpiration = platform.id === "facebook" || platform.id === "linkedin";
                              const autoRefreshFailed = (integration.metadata as any)?.auto_refresh_failed === true;

                              if (isExpired) {
                                return (
                                  <div className="flex items-center gap-2 text-xs text-red-400 mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Token expired. Please reconnect.</span>
                                  </div>
                                );
                              }

                              if (autoRefreshFailed) {
                                return (
                                  <div className="flex items-center gap-2 text-xs text-red-400 mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Auto-refresh failed. Manual refresh required.</span>
                                  </div>
                                );
                              }

                              if (isExpiringSoon && supportsAutoRefresh) {
                                return (
                                  <div className="flex items-center gap-2 text-xs text-blue-400 mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <Clock className="w-4 h-4" />
                                    <span>Auto-refreshes in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? "s" : ""}</span>
                                  </div>
                                );
                              }

                              if (isExpiringSoon && !supportsAutoRefresh) {
                                return (
                                  <div className="flex items-center gap-2 text-xs text-yellow-400 mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Token expires in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? "s" : ""}</span>
                                  </div>
                                );
                              }

                              if (expiresAt && supportsAutoRefresh && daysUntilExpiration !== null && daysUntilExpiration > 7) {
                                return (
                                  <div className="flex items-center gap-2 text-xs text-green-400 mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Auto-refreshes daily</span>
                                  </div>
                                );
                              }

                              if (expiresAt && !supportsAutoRefresh) {
                                return (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Expires {expiresAt.toLocaleDateString()}
                                  </div>
                                );
                              }

                              if (!hasExpiration) {
                                return (
                                  <div className="flex items-center gap-2 text-xs text-green-400 mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>No expiration</span>
                                  </div>
                                );
                              }

                              return null;
                            })()}
                            {integration && platform.id === "facebook" && (() => {
                              const pages = integration.metadata?.pages || [];
                              const nonBusinessAccounts = pages
                                .filter((page: any) => 
                                  page.instagram_account && 
                                  page.instagram_account.account_type && 
                                  page.instagram_account.account_type !== "BUSINESS"
                                );
                              
                              if (nonBusinessAccounts.length > 0) {
                                return (
                                  <div className="flex items-start gap-2 text-xs text-yellow-400 mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                      Some Instagram accounts are not Business accounts. Convert them to Business accounts in Instagram Settings to enable posting.
                                    </span>
                                  </div>
                                );
                              }

                              return null;
                            })()}
                          </div>
                        ) : (
                          "Not connected"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isConnected ? (
                        <div className="space-y-2">
                          {integration && (() => {
                            const isExpired = integration.metadata?.expired || false;
                            const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
                            const now = new Date();
                            const daysUntilExpiration = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                            const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7 && daysUntilExpiration > 0;
                            
                            // Determine if platform supports automatic refresh
                            const supportsAutoRefresh = platform.id === "facebook" || platform.id === "linkedin";
                            
                            // Determine if platform has token expiration
                            const hasExpiration = platform.id === "facebook" || platform.id === "linkedin";
                            
                            // Show manual refresh button only if:
                            // 1. Platform supports refresh (Facebook, LinkedIn)
                            // 2. Token has expiration date
                            // 3. Token is not expired
                            // 4. Either: auto-refresh failed, or token is expiring soon and user might want manual refresh
                            const autoRefreshFailed = (integration.metadata as any)?.auto_refresh_failed === true;
                            const shouldShowManualRefresh = supportsAutoRefresh && 
                                                           hasExpiration && 
                                                           !isExpired && 
                                                           (autoRefreshFailed || isExpiringSoon);

                            if (isExpired) {
                              // Show reconnect button if expired
                              return (
                                <Button
                                  className={`w-full bg-gradient-to-br ${platform.color} hover:opacity-90`}
                                  onClick={() => handleConnect(platform.id)}
                                >
                                  Reconnect
                                </Button>
                              );
                            }

                            return (
                              <>
                                <Button 
                                  variant="outline" 
                                  className="w-full" 
                                  disabled
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Connected
                                </Button>
                                {shouldShowManualRefresh && (
                                  <Button
                                    variant="outline"
                                    className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500"
                                    onClick={() => handleRefreshToken(integration.id, platform.id)}
                                    disabled={refreshing === integration.id}
                                  >
                                    {refreshing === integration.id ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Refreshing...
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        {autoRefreshFailed ? "Refresh Failed - Retry" : "Refresh Token"}
                                      </>
                                    )}
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                                  onClick={() => handleDisconnect(platform.id)}
                                  disabled={isDisconnecting}
                                >
                                  {isDisconnecting ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Disconnecting...
                                    </>
                                  ) : (
                                    <>
                                      <XIcon className="w-4 h-4 mr-2" />
                                      Disconnect
                                    </>
                                  )}
                                </Button>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <Button
                          className={`w-full bg-gradient-to-br ${platform.color} hover:opacity-90`}
                          onClick={() => handleConnect(platform.id)}
                        >
                          Connect
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

