import handler from "../netlify/functions/user-profile.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };
