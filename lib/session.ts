import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isLoggedIn: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "masjid-archive-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (session.isLoggedIn === undefined) {
    session.isLoggedIn = false;
  }
  return session;
}