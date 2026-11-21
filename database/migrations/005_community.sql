-- MySQL 8.0.16+. Apply after 001-004. Supabase uses the PostgreSQL migration.
USE unicommu_dev;

CREATE TABLE campuses (
  id char(36) PRIMARY KEY,
  name varchar(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE faculties (
  id char(36) PRIMARY KEY,
  name varchar(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE programs (
  id char(36) PRIMARY KEY,
  faculty_id char(36) NOT NULL,
  name varchar(120) NOT NULL,
  UNIQUE (faculty_id, name),
  FOREIGN KEY (faculty_id) REFERENCES faculties(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE campus_faculties (
  campus_id char(36) NOT NULL,
  faculty_id char(36) NOT NULL,
  PRIMARY KEY (campus_id, faculty_id),
  FOREIGN KEY (campus_id) REFERENCES campuses(id),
  FOREIGN KEY (faculty_id) REFERENCES faculties(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE organizations (
  id char(36) PRIMARY KEY,
  name varchar(120) NOT NULL,
  kind varchar(20) NOT NULL CHECK (kind IN ('student_club', 'student_council'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE organization_faculties (
  organization_id char(36) NOT NULL,
  faculty_id char(36) NOT NULL,
  PRIMARY KEY (organization_id, faculty_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (faculty_id) REFERENCES faculties(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE organization_members (
  organization_id char(36) NOT NULL,
  user_id bigint unsigned NOT NULL,
  approved_by bigint unsigned NOT NULL,
  approved_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE INDEX idx_organization_members_user ON organization_members(user_id);

CREATE TABLE posts (
  id char(36) PRIMARY KEY,
  author_id bigint unsigned NOT NULL,
  title varchar(120) NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  category varchar(40) NOT NULL CHECK (category IN ('เรื่องเรียน', 'กิจกรรม', 'ชีวิตในมหาวิทยาลัย')),
  client_request_id varchar(64) NOT NULL,
  request_fingerprint varchar(64) NOT NULL,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deleted_at timestamp(3),
  UNIQUE (author_id, client_request_id),
  FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE INDEX idx_posts_feed ON posts(created_at DESC, id DESC);
CREATE INDEX idx_posts_author ON posts(author_id, created_at DESC);
CREATE TABLE post_media (
  id char(36) PRIMARY KEY,
  owner_id bigint unsigned NOT NULL,
  post_id char(36),
  object_path varchar(240) NOT NULL UNIQUE,
  width integer NOT NULL CHECK (width BETWEEN 1 AND 1920),
  height integer NOT NULL CHECK (height BETWEEN 1 AND 1920),
  position smallint NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 7),
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE (post_id, position),
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE INDEX idx_post_media_post ON post_media(post_id);
CREATE TABLE hashtags (
  id char(36) PRIMARY KEY,
  name varchar(80) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE post_hashtags (
  post_id char(36) NOT NULL,
  hashtag_id char(36) NOT NULL,
  PRIMARY KEY (post_id, hashtag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (hashtag_id) REFERENCES hashtags(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE INDEX idx_post_hashtags_tag ON post_hashtags(hashtag_id, post_id);
CREATE TABLE post_faculties (
  post_id char(36) NOT NULL,
  faculty_id char(36) NOT NULL,
  assigned_by bigint unsigned NOT NULL,
  assigned_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (post_id, faculty_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES faculties(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE INDEX idx_post_faculties_faculty ON post_faculties(faculty_id, post_id);
CREATE TABLE post_programs (
  post_id char(36) NOT NULL,
  program_id char(36) NOT NULL,
  assigned_by bigint unsigned NOT NULL,
  assigned_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (post_id, program_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE post_likes (
  post_id char(36) NOT NULL,
  user_id bigint unsigned NOT NULL,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE post_bookmarks (
  post_id char(36) NOT NULL,
  user_id bigint unsigned NOT NULL,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE INDEX idx_post_bookmarks_user ON post_bookmarks(user_id, created_at DESC);
CREATE TABLE comments (
  id char(36) PRIMARY KEY,
  post_id char(36) NOT NULL,
  author_id bigint unsigned NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  parent_id char(36),
  client_request_id varchar(64) NOT NULL,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE (id, post_id),
  UNIQUE (author_id, client_request_id),
  FOREIGN KEY (parent_id, post_id) REFERENCES comments(id, post_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE INDEX idx_comments_post ON comments(post_id, created_at, id);
CREATE TABLE comment_likes (
  comment_id char(36) NOT NULL,
  user_id bigint unsigned NOT NULL,
  PRIMARY KEY (comment_id, user_id),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE post_reports (
  post_id char(36) NOT NULL,
  user_id bigint unsigned NOT NULL,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
