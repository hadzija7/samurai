import dotenv from "dotenv";
dotenv.config();

export const BACKEND_URL =
  process.env.NEXT_BACKEND_API_URL || "http://localhost:3000";
export const APP_ID = 190; //process.env.APP_ID;
export const REDIRECT_URI = "http://localhost:3000/home"; //process.env.REDIRECT_URI;
//|| window.location.origin;
export const CONSENT_PAGE_BASE = `https://dashboard.heyvincent.ai`;
