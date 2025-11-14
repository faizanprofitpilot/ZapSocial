# LinkedIn & X API Implementation Plan

## ✅ Plan Review

**Your roadmap is excellent and I agree with the sequence.** Here are the key considerations:

### ✅ Strengths of Your Plan

1. **Correct Sequence**: Implement → Deploy → Submit Reviews
2. **Single Deployment**: All OAuth redirects configured once
3. **Unified Integrations Page**: Clean, cohesive setup
4. **App Review Preparation**: Everything ready before submission

### ⚠️ Important Updates

#### LinkedIn API Scopes (Updated)
- ❌ **Deprecated** (Aug 2023): `r_liteprofile`, `r_emailaddress`
- ✅ **Use OpenID Connect**: `openid`, `profile`, `email`
- ✅ **Posting Scopes**: `w_member_social`, `rw_organization_admin`, `w_organization_social`
- ⚠️ **App Review Required**: All posting scopes require app review

#### X API Considerations
- ✅ **Free Tier**: Posting endpoints available
- ⚠️ **Rate Limits**: 300 tweets per 3 hours (per user)
- ✅ **No App Review**: Can go live immediately
- ⚠️ **429 Handling**: Critical for production

### 🎯 Recommended Implementation Order

1. **LinkedIn First** (requires app review, start early)
2. **X Second** (can go live immediately)
3. **Finalize Integrations Page** (after both done)
4. **Deploy to Production** (after all integrations work)
5. **Submit App Reviews** (after deployment)

---

## 📋 Implementation Checklist

### Phase 1: LinkedIn API Integration

#### 1.1 OAuth Setup
- [ ] Create LinkedIn App
- [ ] Configure OAuth redirect URIs
- [ ] Set up OpenID Connect scopes
- [ ] Set up posting scopes (requires app review)

#### 1.2 OAuth Implementation
- [ ] Create `/api/integrations/oauth/linkedin/route.ts`
- [ ] Create `/api/integrations/oauth/linkedin/callback/route.ts`
- [ ] Implement token exchange
- [ ] Store tokens in database
- [ ] Implement organization/page listing

#### 1.3 Client Library
- [ ] Create `lib/linkedin/client.ts`
- [ ] Implement `getProfile()`
- [ ] Implement `getOrganizations()`
- [ ] Implement `createPost()`
- [ ] Implement token refresh

#### 1.4 Publishing
- [ ] Update `/api/posts/publish/route.ts`
- [ ] Add LinkedIn publishing
- [ ] Support user and organization posts
- [ ] Support text and image posts
- [ ] Add error handling
- [ ] Add API logging

#### 1.5 UI Integration
- [ ] Update integrations page
- [ ] Add LinkedIn connection card
- [ ] Add organization selection in composer
- [ ] Add LinkedIn post preview

---

### Phase 2: X API Integration

#### 2.1 OAuth Setup
- [ ] Create X App
- [ ] Configure OAuth redirect URIs
- [ ] Set up required scopes
- [ ] No app review needed

#### 2.2 OAuth Implementation
- [ ] Create `/api/integrations/oauth/x/route.ts`
- [ ] Create `/api/integrations/oauth/x/callback/route.ts`
- [ ] Implement token exchange
- [ ] Store tokens in database
- [ ] Implement token refresh

#### 2.3 Client Library
- [ ] Create `lib/x/client.ts`
- [ ] Implement `getProfile()`
- [ ] Implement `createPost()`
- [ ] Implement `uploadMedia()`
- [ ] Implement rate limit handling (429)
- [ ] Implement exponential backoff

#### 2.4 Publishing
- [ ] Update `/api/posts/publish/route.ts`
- [ ] Add X publishing
- [ ] Support text tweets
- [ ] Support image tweets
- [ ] Implement media upload
- [ ] Handle rate limits
- [ ] Add error handling
- [ ] Add API logging

#### 2.5 UI Integration
- [ ] Update integrations page
- [ ] Add X connection card
- [ ] Add X support in composer
- [ ] Add X post preview

---

### Phase 3: Unified Integrations Page

#### 3.1 Platform Cards
- [ ] Meta (Facebook + Instagram) - ✅ Already done
- [ ] LinkedIn - Add connection status, organizations
- [ ] X - Add connection status, account info
- [ ] Show token expiration for all
- [ ] Show refresh button for expiring tokens
- [ ] Show reconnect button for expired tokens

#### 3.2 Multi-Account Selection
- [ ] Facebook Pages - ✅ Already done
- [ ] LinkedIn Organizations
- [ ] X Account (single account)

#### 3.3 Post Preview
- [ ] Meta preview - ✅ Already done
- [ ] LinkedIn preview
- [ ] X preview

---

### Phase 4: Deployment & App Reviews

#### 4.1 Deploy to Production
- [ ] Push code to production
- [ ] Deploy to Vercel
- [ ] Attach custom domain
- [ ] Update OAuth redirect URIs:
  - Meta (Facebook App)
  - LinkedIn App
  - X App
- [ ] Test OAuth flows on production

#### 4.2 Prepare App Review Materials
- [ ] Create screencast for Meta
- [ ] Create screencast for LinkedIn
- [ ] Prepare privacy policy
- [ ] Prepare terms of service
- [ ] Prepare data deletion page
- [ ] Create test user accounts
- [ ] Document use cases

#### 4.3 Submit App Reviews
- [ ] Submit Meta App Review
- [ ] Submit LinkedIn App Review
- [ ] X does NOT require review

---

## 🔧 Technical Details

### LinkedIn API

**OAuth Scopes**:
```
openid
profile
email
w_member_social (requires app review)
rw_organization_admin (requires app review)
w_organization_social (requires app review)
```

**API Endpoints**:
- `GET /v2/userInfo` - Get user profile
- `GET /v2/organizationalEntityAcls` - Get organizations
- `POST /v2/ugcPosts` - Create user post
- `POST /v2/organizationalEntityShares` - Create organization post

**Token Management**:
- Access tokens expire in 60 days
- Refresh tokens with `offline.access` scope
- Implement token refresh logic

### X API

**OAuth Scopes**:
```
tweet.read
tweet.write
users.read
offline.access (for refresh tokens)
```

**API Endpoints**:
- `POST /2/tweets` - Create tweet
- `POST /1.1/media/upload.json` - Upload media
- `GET /2/users/me` - Get user profile

**Rate Limits**:
- Tweet creation: 300 per 3 hours (per user)
- Media upload: 5000 per 24 hours
- Implement exponential backoff for 429

**Token Management**:
- Access tokens don't expire (OAuth 2.0)
- Refresh tokens with `offline.access` scope
- Implement token refresh logic

---

## ✅ Success Criteria

### LinkedIn
- [ ] Users can connect LinkedIn
- [ ] Users can see organizations
- [ ] Users can post as themselves
- [ ] Users can post as organizations
- [ ] Posts appear on LinkedIn
- [ ] Token refresh works
- [ ] Error handling works
- [ ] API logging works

### X
- [ ] Users can connect X
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

---

## 🚀 Next Steps

1. **Start with LinkedIn** (requires app review, start early)
2. **Then implement X** (can go live immediately)
3. **Finalize integrations page** (after both done)
4. **Deploy to production** (after all integrations work)
5. **Submit app reviews** (after deployment)

---

## 📚 Resources

### LinkedIn
- [LinkedIn API Docs](https://learn.microsoft.com/en-us/linkedin/)
- [LinkedIn OAuth 2.0](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)
- [LinkedIn App Review](https://www.linkedin.com/help/linkedin/answer/a524477)

### X
- [X API Docs](https://developer.twitter.com/en/docs/twitter-api)
- [X OAuth 2.0](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [X Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)

---

**Status**: Ready for Implementation
**Priority**: High
**Estimated Time**: 2-3 weeks (including app reviews)

