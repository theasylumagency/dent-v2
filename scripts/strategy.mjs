// Match Payload's Node 24 / tsx compatibility bootstrap.
import nodeModule from "node:module";
if (typeof nodeModule.registerHooks === "function") nodeModule.registerHooks = undefined;
const { tsImport } = await import("tsx/esm/api");
await tsImport("./strategy.ts", import.meta.url);
