import { marked } from "marked";
import type { Request, Response } from "express";

import { html } from "../../lib/helper.ts";
import { baseTemplate } from "../templates/base.ts";

export type Entry = {
  id: number;
  title: string;
  content: string;
  modified_at: string;
  [k: string]: unknown;
};

function getContent(req: Request) {
  try {
    const stmt = req.db.prepare(
      "SELECT title, content, modified_at FROM entries WHERE type = ? AND private = 0 LIMIT 1",
    );
    const entry = stmt.get("maincontent");
    return entry as Entry;
  } catch (error) {
    console.error("Error fetching entry:", error);
    return {} as Entry;
  }
}

const template = async (entry: Entry) =>
  html`
    <!-- Welcome Section -->
    <div class="md-content">
      ${await marked.parse(entry.content)}
    </div>
  `;

export default async (req: unknown, res: Response) => {
  const entry = getContent(req as Request);
  const content = await template(entry);

  const html = baseTemplate(entry.title, content, entry.modified_at);
  res.send(html);
};
