import { createClient } from "@/lib/supabase/server";

export interface ApiLogEntry {
  user_id: string;
  integration_id?: string;
  platform: "facebook" | "instagram" | "linkedin";
  endpoint: string;
  method: "GET" | "POST" | "DELETE" | "PATCH";
  request_body?: any;
  response_body?: any;
  status_code?: number;
  success: boolean;
  error_message?: string;
  duration_ms?: number;
}

/**
 * Logs API requests and responses to the database
 */
export async function logApiRequest(entry: ApiLogEntry): Promise<void> {
  try {
    const supabase = await createClient();
    
    await supabase.from("meta_api_logs").insert({
      user_id: entry.user_id,
      integration_id: entry.integration_id,
      platform: entry.platform,
      endpoint: entry.endpoint,
      method: entry.method,
      request_body: entry.request_body,
      response_body: entry.response_body,
      status_code: entry.status_code,
      success: entry.success,
      error_message: entry.error_message,
      duration_ms: entry.duration_ms,
    });
  } catch (error) {
    // Don't throw - logging failures shouldn't break the app
    console.error("Error logging API request:", error);
  }
}

/**
 * Checks if a token is expired based on error response
 */
export function isTokenExpired(error: any): boolean {
  if (!error) return false;
  
  // Facebook error code 190 = invalid/expired token
  if (error.code === 190) return true;
  
  // Check error message
  const message = error.message?.toLowerCase() || "";
  if (
    message.includes("expired") ||
    message.includes("invalid token") ||
    message.includes("access token")
  ) {
    return true;
  }
  
  return false;
}

/**
 * Checks if error is rate limit
 */
export function isRateLimitError(error: any): boolean {
  if (!error) return false;
  
  // Facebook error code 613 = rate limit
  if (error.code === 613) return true;
  
  const message = error.message?.toLowerCase() || "";
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return true;
  }
  
  return false;
}

