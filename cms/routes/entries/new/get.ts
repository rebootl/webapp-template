import type { Request, Response } from "express";

import baseTemplate from "../../../templates/base.ts";
import newEntryTemplate from "./template.ts";

export default (req: Request, res: Response) => {
  if (!req.locals.loggedIn) {
    res.redirect("/cms/login");
    return;
  }

  const content = newEntryTemplate();
  const html = baseTemplate(content, req);
  res.send(html);
};
