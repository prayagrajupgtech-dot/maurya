import handler from "../netlify/functions/send-otp.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
