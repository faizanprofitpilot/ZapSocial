# LinkedIn & X API Integration Roadmap

## 🎯 Implementation Plan

### Phase 1: LinkedIn API Integration

#### 1.1 LinkedIn OAuth Setup
- [ ] Create LinkedIn App in LinkedIn Developers Portal
- [ ] Configure OAuth redirect URIs
- [ ] Set up required scopes:
  - `openid`
  - `profile`
  - `email`
  - `w_member_social` (requires app review)
  - `rw_organization_admin` (requires app review)
  - `w_organization_social` (requires app review)

#### 1.2 OAuth Implementation
- [ ] Create `/api/integrations/oauth/linkedin/route.ts` - OAuth initiation
- [ ] Create `/api/integrations/oauth/linkedin/callback/route.ts` - OAuth callback
- [ ] Implement token exchange and storage
- [ ] Implement organization/page listing
- [ ] Store organization data in metadata

#### 1.3 LinkedIn Client Library
- [ ] Create `lib/linkedin/client.ts` - LinkedIn API client
- [ ] Implement `getProfile()` - Get user profile
- [ ] Implement `getOrganizations()` - Get user's organizations
- [ ] Implement `createPost()` - Create post (user or organization)
- [ ] Implement token refresh logic

#### 1.4 Publishing Endpoint
- [ ] Update `/api/posts/publish/route.ts` - Add LinkedIn publishing
- [ ] Support user posts and organization posts
- [ ] Support text posts and image posts
- [ ] Implement error handling
- [ ] Add API logging

#### 1.5 UI Integration
- [ ] Update `app/integrations/page.tsx` - Add LinkedIn connection
- [ ] Add organization/page selection in composer
- [ ] Update `components/dashboard/AIComposer.tsx` - Add LinkedIn support
- [ ] Add LinkedIn post preview

---

### Phase 2: X (Twitter) API Integration

#### 2.1 X OAuth Setup
- [ ] Create X App in X Developer Portal
- [ ] Configure OAuth redirect URIs
- [ ] Set up required scopes:
  - `tweet.read`
  - `tweet.write`
  - `users.read`
  - `offline.access` (for refresh tokens)

#### 2.2 OAuth Implementation
- [ ] Create `/api/integrations/oauth/x/route.ts` - OAuth initiation
- [ ] Create `/api/integrations/oauth/x/callback/route.ts` - OAuth callback
- [ ] Implement token exchange and storage
- [ ] Implement token refresh logic

#### 2.3 X Client Library
- [ ] Create `lib/x/client.ts` - X API client
- [ ] Implement `getProfile()` - Get user profile
- [ ] Implement `createPost()` - Create tweet
- [ ] Implement `uploadMedia()` - Upload images/videos
- [ ] Implement rate limit handling (429 errors)
- [ ] Implement exponential backoff

#### 2.4 Publishing Endpoint
- [ ] Update `/api/posts/publish/route.ts` - Add X publishing
- [ ] Support text tweets and image tweets
- [ ] Implement media upload for images
- [ ] Implement error handling
- [ ] Add API logging
- [ ] Handle rate limits gracefully

#### 2.5 UI Integration
- [ ] Update `app/integrations/page.tsx` - Add X connection
- [ ] Update `components/dashboard/AIComposer.tsx` - Add X support
- [ ] Add X post preview

---

### Phase 3: Unified Integrations Page

#### 3.1 Platform Cards
- [ ] Update `app/integrations/page.tsx` - Show all 3 platforms
- [ ] Meta (Facebook + Instagram) - Already done
- [ ] LinkedIn - Add connection status, organizations
- [ ] X - Add connection status, account info
- [ ] Show token expiration for all platforms
- [ ] Show "Refresh" button for expiring tokens
- [ ] Show "Reconnect" button for expired tokens

#### 3.2 Multi-Account Selection
- [ ] Update `components/dashboard/AIComposer.tsx` - Add account selection
- [ ] Facebook Pages (already done)
- [ ] LinkedIn Organizations
- [ ] X Account (single account, no selection needed)

#### 3.3 Post Preview
- [ ] Update post preview components
- [ ] LinkedIn preview - Professional layout
- [ ] X preview - Tweet layout
- [ ] Meta preview - Already done

---

### Phase 4: Deployment & App Reviews

#### 4.1 Deploy to Live Domain
- [ ] Push code to production
- [ ] Deploy to Vercel
- [ ] Attach custom domain
- [ ] Update OAuth redirect URIs in all 3 platforms:
  - Meta (Facebook App)
  - LinkedIn App
  - X App
- [ ] Test OAuth flows on production

#### 4.2 Prepare App Review Materials
- [ ] Create screencast for Meta App Review
- [ ] Create screencast for LinkedIn App Review
- [ ] Prepare privacy policy page
- [ ] Prepare terms of service page
- [ ] Prepare data deletion page
- [ ] Create test user accounts
- [ ] Document use cases

#### 4.3 Submit App Reviews
- [ ] Submit Meta App Review
  - Screencast
  - Test user assignment
  - Live URLs
  - Privacy/TOS/Data deletion pages
- [ ] Submit LinkedIn App Review
  - Screencast
  - Explanation of use-case
  - Public URLs
  - Privacy/TOS/Data deletion pages
- [ ] X does NOT require review (can go live immediately)

---

## 📋 Technical Requirements

### LinkedIn API

**OAuth Scopes**:
- `openid` - OpenID Connect
- `profile` - User profile information
- `email` - User email address
- `w_member_social` - Post as user (requires app review)
- `rw_organization_admin` - Manage organizations (requires app review)
- `w_organization_social` - Post as organization (requires app review)

**API Endpoints**:
- `GET /v2/userInfo` - Get user profile
- `GET /v2/organizationalEntityAcls` - Get user's organizations
- `POST /v2/ugcPosts` - Create post (user)
- `POST /v2/organizationalEntityShares` - Create post (organization)

**Token Management**:
- Access tokens expire in 60 days
- Refresh tokens available with `offline.access` scope
- Implement token refresh logic

### X (Twitter) API

**OAuth Scopes**:
- `tweet.read` - Read tweets
- `tweet.write` - Write tweets
- `users.read` - Read user info
- `offline.access` - Refresh tokens

**API Endpoints**:
- `POST /2/tweets` - Create tweet
- `POST /1.1/media/upload.json` - Upload media (v1.1 endpoint)
- `GET /2/users/me` - Get user profile

**Rate Limits**:
- Tweet creation: 300 tweets per 3 hours (per user)
- Media upload: 5000 requests per 24 hours
- Implement exponential backoff for 429 errors

**Token Management**:
- Access tokens don't expire (if using OAuth 2.0)
- Refresh tokens available with `offline.access` scope
- Implement token refresh logic

---

## 🔧 Implementation Details

### LinkedIn Client Library Structure

```typescript
// lib/linkedin/client.ts
export class LinkedInClient {
  constructor(accessToken: string);
  getProfile(): Promise<LinkedInProfile>;
  getOrganizations(): Promise<LinkedInOrganization[]>;
  createPost(options: CreatePostOptions): Promise<LinkedInPost>;
  refreshToken(): Promise<string>;
}
```

### X Client Library Structure

```typescript
// lib/x/client.ts
export class XClient {
  constructor(accessToken: string);
  getProfile(): Promise<XProfile>;
  createPost(options: CreatePostOptions): Promise<XTweet>;
  uploadMedia(file: Buffer): Promise<string>;
  refreshToken(): Promise<string>;
}
```

### Database Schema

**LinkedIn Integration Metadata**:
```json
{
  "organizations": [
    {
      "id": "org_id",
      "name": "Organization Name",
      "role": "ADMINISTRATOR"
    }
  ],
  "profile": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}
```

**X Integration Metadata**:
```json
{
  "profile": {
    "id": "user_id",
    "username": "johndoe",
    "name": "John Doe"
  }
}
```

---

## ✅ Success Criteria

### LinkedIn
- [ ] Users can connect LinkedIn account
- [ ] Users can see their organizations
- [ ] Users can post as themselves
- [ ] Users can post as organizations
- [ ] Posts appear on LinkedIn
- [ ] Token refresh works
- [ ] Error handling works
- [ ] API logging works

### X
- [ ] Users can connect X account
- [ ] Users can post tweets
- [ ] Users can post tweets with images
- [ ] Posts appear on X
- [ ] Rate limit handling works
- [ ] Token refresh works
- [ ] Error handling works
- [ ] API logging works

### Unified Integrations Page
- [ ] All 3 platforms shown
- [ ] Connection status displayed
- [ ] Token expiration shown
- [ ] Refresh button works
- [ ] Reconnect button works
- [ ] Account selection works

### Deployment
- [ ] All OAuth flows work on production
- [ ] All redirect URIs configured
- [ ] All platforms accessible
- [ ] App review materials ready
- [ ] App reviews submitted

---

## 🚀 Next Steps

1. **Start with LinkedIn** (requires app review, so start early)
2. **Then implement X** (can go live immediately)
3. **Finalize integrations page** (after both are done)
4. **Deploy to production** (after all integrations work)
5. **Submit app reviews** (after deployment)

---

## 📚 Resources

### LinkedIn
- [LinkedIn API Documentation](https://learn.microsoft.com/en-us/linkedin/)
- [LinkedIn OAuth 2.0](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)
- [LinkedIn App Review](https://www.linkedin.com/help/linkedin/answer/a524477)

### X (Twitter)
- [X API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [X OAuth 2.0](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [X Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)

---

**Status**: Ready for Implementation
**Priority**: High
**Estimated Time**: 2-3 weeks (including app reviews)

