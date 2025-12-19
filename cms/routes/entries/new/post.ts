import type { Request, Response } from "express";

const parseField = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export default (req: Request, res: Response) => {
  if (!req.locals.loggedIn) {
    res.redirect("/cms/login");
    return;
  }

  const currentUserId = req.locals.userId;
  if (currentUserId === null) {
    res.status(401).send("User not authenticated");
    return;
  }

  const title = parseField(req.body.title);
  const type = parseField(req.body.type);
  if (!title || !type) {
    res.status(400).send("Title and type are required");
    return;
  }

  const content = typeof req.body.content === "string" ? req.body.content : "";
  const isPrivate = String(req.body.private || "0") === "1" ? 1 : 0;
  const now = new Date().toISOString();

  try {
    const stmt = req.db.prepare(
      "INSERT INTO entries (user_id, type, created_at, modified_at, title, content, private) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    stmt.run(
      currentUserId,
      type,
      now,
      now,
      title,
      content,
      isPrivate,
    );

    res.redirect("/cms/entries?message=successCreate");
  } catch (error) {
    console.error("Failed to create entry", error);
    res.status(500).send("Failed to create entry");
  }
};
