import type { Request, Response } from "express";

export default async (req: Request, res: Response) => {
  if (!req.locals.loggedIn) {
    res.status(401).json({
      success: false,
      title: "",
      error: "Unauthorized",
    });
    return;
  }

  const url = req.query.url as string;

  if (!url) {
    res.status(400).json({
      success: false,
      title: "",
      error: "URL is required",
    });
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      res.json({
        success: false,
        title: "",
        error: `HTTP status code: ${response.status}`,
      });
      return;
    }

    const html = await response.text();
    const match = html.match(/<title>([\s\S]*?)<\/title>/i);

    if (!match) {
      res.json({
        success: false,
        title: "",
        error: "title not found",
      });
      return;
    }

    res.json({
      success: true,
      title: match[1].trim(),
      error: "",
    });
  } catch (error: any) {
    res.json({
      success: false,
      title: "",
      error: error.message,
    });
  }
};
