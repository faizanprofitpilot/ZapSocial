import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import { FileText, Calendar, Trash2, Edit, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function PostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const stats = {
    total: posts?.length || 0,
    drafts: posts?.filter((p) => p.status === "draft").length || 0,
    scheduled: posts?.filter((p) => p.status === "scheduled").length || 0,
    published: posts?.filter((p) => p.status === "published").length || 0,
  };

  const platformLogos: Record<string, string> = {
    instagram: "/Instagram logo.png",
    linkedin: "/Linkedin logo.png",
    x: "/X logo.png",
    facebook: "/Facebook logo.png",
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <div className="md:flex md:gap-8">
          <Sidebar />
          <div className="flex-1">
            <div className="mb-8 flex flex-wrap gap-3 text-xs text-gray-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Total: {stats.total}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Drafts: {stats.drafts}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Scheduled: {stats.scheduled}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Published: {stats.published}</span>
            </div>

            {!posts || posts.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400 mb-6 text-lg">Your library is empty. Create your first post!</p>
                  <Link href="/dashboard/create">
                    <Button className="bg-gradient-to-r from-cyan-400 to-cyan-600 hover:bg-gradient-to-r from-cyan-400 to-cyan-600-hover">
                      Create Content
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    className="group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-cyan-lg hover:border-cyan-400/50"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 px-2 py-1 bg-cyan-900/50 text-cyan-300 rounded-full text-xs font-medium uppercase">
                          {platformLogos[post.platform] && (
                            <Image
                              src={platformLogos[post.platform]}
                              alt={post.platform}
                              width={12}
                              height={12}
                              className="object-contain"
                            />
                          )}
                          {post.platform}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            post.status === "published"
                              ? "bg-green-900/50 text-green-300"
                              : post.status === "scheduled"
                              ? "bg-blue-900/50 text-blue-300"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-50 line-clamp-2 mb-2">
                        {post.caption.substring(0, 60)}...
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(post.created_at)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {post.caption}
                      </p>
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.slice(0, 3).map((tag: string, idx: number) => (
                            <span key={idx} className="text-xs text-cyan-400">#{tag}</span>
                          ))}
                          {post.hashtags.length > 3 && (
                            <span className="text-xs text-gray-500">+{post.hashtags.length - 3}</span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Sparkles className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

