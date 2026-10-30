// Vercel serverless entry. An Express app is itself a (req, res) handler, so
// Vercel can invoke it directly. vercel.json rewrites every path here, and the
// app's own routers (/healthz, /api/...) match on the original URL.
import { app } from "../src/app.js";

export default app;
