import fs from "node:fs";
import path from "node:path";
import express from "express";

// Function to create endpoints recursively
export async function createEndpoints(
  app: express.Application,
  routesDir: string,
  basePath = "",
): Promise<void> {
  const files = fs.readdirSync(routesDir);

  for (const file of files) {
    const filePath = path.join(routesDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      // e.g. './routes/' + 'get.ts'
      const p = path.join(routesDir, file);

      // NOTE: import needs a relative path prefixed with './', or an absolute path
      // path.resolve makes it absolute

      // TODO: error handling

      if (["get.js", "get.ts", "post.js", "post.ts"].includes(file) === false) {
        continue;
      }
      const m = await import(path.resolve(p));
      const f = m.default;
      if (typeof f !== "function") {
        console.warn(
          `Skipping ${p}, no default export function found.`,
        );
        continue;
      }

      if (file === "get.js" || file === "get.ts") {
        console.log(
          `Creating GET endpoint at "${basePath}" from ${p}`,
        );

        app.get(basePath, f);
      } else if (file === "post.js" || file === "post.ts") {
        console.log(
          `Creating POST endpoint at "${basePath}" from ${p}`,
        );
        app.post(basePath, f);
      }
    } // Recursively create endpoints for subdirectories
    else if (stat.isDirectory()) {
      // no await - fire and forget recursion
      // ensure path uses forward slashes for route basepath
      // NOTE: this is for windows compatibility, but it's not tested
      // I'm not sure we really need this
      const nextBase = `${basePath}/${file}`.replace(/\\/g, "/");
      createEndpoints(app, filePath, nextBase);
    }
  }
}
