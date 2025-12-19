import process from "node:process";

import express from "express";

import { Request, Response } from "express";

const cookieName: string = process.env.ADMIN_COOKIE_NAME || "admin-session-id";

// Extend Request interface to include locals
declare global {
  namespace Express {
    interface Request {
      locals: {
        loggedIn: boolean;
        userName: string;
        userId: number | null;
      };
    }
  }
}

const app = express();

// Middleware to check if user is logged in
export function isLoggedIn(
  req: Request,
  res: Response,
  next: () => void,
): void {
  const sessionId = req.cookies?.[cookieName];

  req.locals = {
    loggedIn: false,
    userName: "",
    userId: null,
  };

  if (!sessionId) {
    // console.log('No session ID found in cookies');
    next();
    return;
  }

  try {
    const stmt = req.db.prepare("SELECT * FROM sessions WHERE session_id = ?");
    const session = stmt.get(sessionId);

    if (!session) {
      res.status(401).send(
        "Invalid session. Please clear your cookies and log in again.",
      );
      return;
    }

    req.locals.loggedIn = true;
    req.locals.userName = String(session.user_name) || "";
    req.locals.userId = Number(session.user_id) || null;

    next();
  } catch (error) {
    console.error("Session check error:", error);
    res.status(500).send("An error occurred while checking session");
  }
}

app.use(isLoggedIn);

export default app;
