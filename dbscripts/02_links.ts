import { DatabaseSync } from "node:sqlite";

type LegacyLink = {
  id: number;
  user_id: number;
  created_at: string;
  modified_at: string;
  title: string;
  url: string;
  comment: string;
  category_id: number | null;
};

type LegacyLinkTag = {
  id: number;
  user_id: number;
  name: string;
  color: string;
};

type LegacyLinkCategory = {
  id: number | null;
  name: string | null;
};

type LegacyLinkToTag = {
  id: number;
  link_id: number;
  tag_id: number;
};

const db = new DatabaseSync("db/db.sqlite");
const dbOld = new DatabaseSync("dbscripts/db-export/db.sqlite");

// Simplified schema that relies solely on tags for classification
db.prepare(`
  CREATE TABLE IF NOT EXISTS "link_tags" (
    "id" INTEGER NOT NULL UNIQUE,
    "name" TEXT NOT NULL UNIQUE,
    "color" TEXT NOT NULL DEFAULT "",
    PRIMARY KEY("id" AUTOINCREMENT)
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS "links" (
    "id" INTEGER NOT NULL UNIQUE,
    "user_id" INTEGER NOT NULL,
    "created_at" TEXT NOT NULL,
    "modified_at" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "comment" TEXT NOT NULL DEFAULT "",
    FOREIGN KEY("user_id") REFERENCES "users"("id"),
    PRIMARY KEY("id" AUTOINCREMENT)
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS "link_to_tag" (
    "id" INTEGER NOT NULL UNIQUE,
    "link_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT),
    FOREIGN KEY("tag_id") REFERENCES "link_tags"("id"),
    FOREIGN KEY("link_id") REFERENCES "links"("id")
  );
`).run();

const oldLinks = dbOld.prepare("SELECT * FROM links").all() as LegacyLink[];
const oldLinkTags = dbOld.prepare("SELECT * FROM link_tags")
  .all() as LegacyLinkTag[];
const oldCategories = dbOld
  .prepare("SELECT * FROM link_categories")
  .all() as LegacyLinkCategory[];
const oldLinkToTag = dbOld.prepare("SELECT * FROM link_to_tag")
  .all() as LegacyLinkToTag[];

const insertLegacyTag = db.prepare(`
  INSERT INTO link_tags (id, name, color)
  VALUES (@id, @name, @color)
`);
for (const tag of oldLinkTags) {
  insertLegacyTag.run({
    id: tag.id,
    name: tag.name,
    color: tag.color,
  });
}

const categoryNames = new Map<number, string>();
const findTagByName = db.prepare("SELECT id FROM link_tags WHERE name = ?");
const insertCategoryTag = db.prepare(`
  INSERT INTO link_tags (name, color)
  VALUES (@name, @color)
`);
for (const category of oldCategories) {
  if (category.id == null || category.name == null) {
    continue;
  }
  categoryNames.set(category.id, category.name);

  const existingTag = findTagByName.get(category.name);
  if (existingTag && typeof existingTag.id === "number") {
    continue;
  }

  insertCategoryTag.run({
    name: category.name,
    color: "",
  });
}

const insertLink = db.prepare(`
  INSERT INTO links (id, user_id, created_at, modified_at, title, url, comment)
  VALUES (@id, @user_id, @created_at, @modified_at, @title, @url, @comment)
`);
const insertCategoryAssociation = db.prepare(`
  INSERT INTO link_to_tag (link_id, tag_id)
  VALUES (@link_id, @tag_id)
`);
for (const link of oldLinks) {
  insertLink.run({
    id: link.id,
    user_id: link.user_id,
    created_at: link.created_at,
    modified_at: link.modified_at,
    title: link.title,
    url: link.url,
    comment: link.comment,
  });

  if (link.category_id == null) {
    continue;
  }

  const categoryName = categoryNames.get(link.category_id);
  if (!categoryName) {
    continue;
  }

  const tagRow = findTagByName.get(categoryName) as { id: number } | undefined;
  if (!tagRow) {
    continue;
  }

  insertCategoryAssociation.run({
    link_id: link.id,
    tag_id: tagRow.id,
  });
}

const insertOldRelations = db.prepare(`
  INSERT INTO link_to_tag (link_id, tag_id)
  VALUES (@link_id, @tag_id)
`);
for (const relation of oldLinkToTag) {
  insertOldRelations.run({
    link_id: relation.link_id,
    tag_id: relation.tag_id,
  });
}
