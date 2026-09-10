import handler from "../netlify/functions/verify-otp.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
