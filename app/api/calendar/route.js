// /app/api/calendar/route.js
// Google Calendar API proxy — set up with service account
export async function GET() {
  const credentials = process.env.GOOGLE_CALENDAR_CREDENTIALS;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  if (!credentials) {
    // Return mock data when not configured
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    return Response.json({
      configured: false,
      events: [
        { id: "mock1", summary: "📅 Connect Google Calendar to see real events", start: `${today}T09:00:00`, end: `${today}T09:30:00`, color: "#6C9BFF" },
      ],
    });
  }

  try {
    // Google Calendar API integration
    // Uses service account credentials from environment variable
    const creds = JSON.parse(credentials);
    const { google } = await import("googleapis");

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const res = await calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (res.data.items || []).map((ev) => ({
      id: ev.id,
      summary: ev.summary || "Untitled",
      start: ev.start.dateTime || ev.start.date,
      end: ev.end.dateTime || ev.end.date,
      color: ev.colorId ? `#${ev.colorId}` : "#6C9BFF",
      location: ev.location || null,
    }));

    return Response.json({ configured: true, events });
  } catch (err) {
    return Response.json({ error: err.message, configured: false, events: [] }, { status: 500 });
  }
}
