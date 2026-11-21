BEGIN;

CREATE TABLE unicommu.campuses (
  id uuid PRIMARY KEY, name varchar(120) NOT NULL UNIQUE
);
CREATE TABLE unicommu.faculties (
  id uuid PRIMARY KEY, name varchar(120) NOT NULL UNIQUE
);
CREATE TABLE unicommu.programs (
  id uuid PRIMARY KEY, faculty_id uuid NOT NULL REFERENCES unicommu.faculties(id),
  name varchar(120) NOT NULL, UNIQUE (faculty_id, name)
);
CREATE TABLE unicommu.campus_faculties (
  campus_id uuid NOT NULL REFERENCES unicommu.campuses(id),
  faculty_id uuid NOT NULL REFERENCES unicommu.faculties(id), PRIMARY KEY (campus_id, faculty_id)
);
CREATE TABLE unicommu.organizations (
  id uuid PRIMARY KEY, name varchar(120) NOT NULL,
  kind varchar(20) NOT NULL CHECK (kind IN ('student_club', 'student_council'))
);
CREATE TABLE unicommu.organization_faculties (
  organization_id uuid NOT NULL REFERENCES unicommu.organizations(id),
  faculty_id uuid NOT NULL REFERENCES unicommu.faculties(id), PRIMARY KEY (organization_id, faculty_id)
);
-- Only trusted administrators provision memberships; no self-approval endpoint.
CREATE TABLE unicommu.organization_members (
  organization_id uuid NOT NULL REFERENCES unicommu.organizations(id),
  user_id bigint NOT NULL REFERENCES unicommu.users(id) ON DELETE CASCADE,
  approved_by bigint NOT NULL REFERENCES unicommu.users(id),
  approved_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id)
);
CREATE INDEX idx_organization_members_user ON unicommu.organization_members(user_id);

CREATE TABLE unicommu.posts (
  id uuid PRIMARY KEY,
  author_id bigint NOT NULL REFERENCES unicommu.users(id),
  title varchar(120) NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  category varchar(40) NOT NULL CHECK (category IN ('เรื่องเรียน', 'กิจกรรม', 'ชีวิตในมหาวิทยาลัย')),
  client_request_id varchar(64) NOT NULL,
  request_fingerprint varchar(64) NOT NULL,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamptz(3),
  UNIQUE (author_id, client_request_id)
);
CREATE INDEX idx_posts_feed ON unicommu.posts(created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_author ON unicommu.posts(author_id, created_at DESC);
CREATE TABLE unicommu.post_media (
  id uuid PRIMARY KEY, owner_id bigint NOT NULL REFERENCES unicommu.users(id),
  post_id uuid REFERENCES unicommu.posts(id) ON DELETE CASCADE,
  object_path varchar(240) NOT NULL UNIQUE,
  width integer NOT NULL CHECK (width BETWEEN 1 AND 1920),
  height integer NOT NULL CHECK (height BETWEEN 1 AND 1920),
  position smallint NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 7),
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE (post_id, position)
);
CREATE INDEX idx_post_media_post ON unicommu.post_media(post_id);
CREATE TABLE unicommu.hashtags (
  id uuid PRIMARY KEY, name varchar(80) NOT NULL UNIQUE
);
CREATE TABLE unicommu.post_hashtags (
  post_id uuid NOT NULL REFERENCES unicommu.posts(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES unicommu.hashtags(id), PRIMARY KEY (post_id, hashtag_id)
);
CREATE INDEX idx_post_hashtags_tag ON unicommu.post_hashtags(hashtag_id, post_id);
CREATE TABLE unicommu.post_faculties (
  post_id uuid NOT NULL REFERENCES unicommu.posts(id) ON DELETE CASCADE,
  faculty_id uuid NOT NULL REFERENCES unicommu.faculties(id),
  assigned_by bigint NOT NULL REFERENCES unicommu.users(id),
  assigned_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (post_id, faculty_id)
);
CREATE INDEX idx_post_faculties_faculty ON unicommu.post_faculties(faculty_id, post_id);
CREATE TABLE unicommu.post_programs (
  post_id uuid NOT NULL REFERENCES unicommu.posts(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES unicommu.programs(id),
  assigned_by bigint NOT NULL REFERENCES unicommu.users(id),
  assigned_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (post_id, program_id)
);
CREATE TABLE unicommu.post_likes (
  post_id uuid NOT NULL REFERENCES unicommu.posts(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES unicommu.users(id) ON DELETE CASCADE,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (post_id, user_id)
);
CREATE TABLE unicommu.post_bookmarks (
  post_id uuid NOT NULL REFERENCES unicommu.posts(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES unicommu.users(id) ON DELETE CASCADE,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (post_id, user_id)
);
CREATE INDEX idx_post_bookmarks_user ON unicommu.post_bookmarks(user_id, created_at DESC);
CREATE TABLE unicommu.comments (
  id uuid PRIMARY KEY, post_id uuid NOT NULL REFERENCES unicommu.posts(id) ON DELETE CASCADE,
  author_id bigint NOT NULL REFERENCES unicommu.users(id),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  parent_id uuid,
  client_request_id varchar(64) NOT NULL,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id, post_id), UNIQUE (author_id, client_request_id),
  FOREIGN KEY (parent_id, post_id) REFERENCES unicommu.comments(id, post_id)
);
CREATE INDEX idx_comments_post ON unicommu.comments(post_id, created_at, id);
CREATE TABLE unicommu.comment_likes (
  comment_id uuid NOT NULL REFERENCES unicommu.comments(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES unicommu.users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);
CREATE TABLE unicommu.post_reports (
  post_id uuid NOT NULL REFERENCES unicommu.posts(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES unicommu.users(id) ON DELETE CASCADE,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (post_id, user_id)
);
-- Custom bearer sessions are checked by our backend, not Supabase Auth JWTs.
-- Deny direct browser/anon access, including users/password hashes.
DO $$ DECLARE relation text; BEGIN
  FOREACH relation IN ARRAY ARRAY['campuses','faculties','programs','campus_faculties',
    'organizations','organization_faculties','organization_members','posts','post_media',
    'hashtags','post_hashtags','post_faculties','post_programs','post_likes','post_bookmarks',
    'comments','comment_likes','post_reports'] LOOP
    EXECUTE format('ALTER TABLE unicommu.%I ENABLE ROW LEVEL SECURITY', relation);
    EXECUTE format('REVOKE ALL ON unicommu.%I FROM PUBLIC, anon, authenticated', relation);
  END LOOP;
END $$;

COMMIT;
