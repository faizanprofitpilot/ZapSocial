-- Comments Automation Tables and Indexes

-- Comments table for storing fetched comments and replies
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id text,
  comment_id text NOT NULL,
  platform text CHECK (platform IN ('facebook', 'instagram', 'linkedin')) NOT NULL,
  commenter_name text,
  commenter_id text,
  text text NOT NULL,
  replied boolean DEFAULT false,
  reply_text text,
  reply_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  replied_at timestamptz,
  UNIQUE(user_id, comment_id, platform)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_user_platform ON comments(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_replied ON comments(replied) WHERE replied = false;
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- User settings for comment automation
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  comment_auto_reply_enabled boolean DEFAULT false,
  comment_reply_window_minutes integer DEFAULT 60,
  comment_reply_tone text DEFAULT 'friendly' CHECK (comment_reply_tone IN ('friendly', 'professional', 'playful', 'witty')),
  comment_exclude_keywords text[] DEFAULT '{}',
  comment_max_replies_per_post_per_day integer DEFAULT 10,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for user settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- RLS Policies for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own comments"
  ON comments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert comments"
  ON comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update comments"
  ON comments FOR UPDATE
  USING (true);

-- RLS Policies for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

