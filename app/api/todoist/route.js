// /app/api/todoist/route.js
// Proxies Todoist API calls — token stays server-side
export async function GET(request) {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    return Response.json({ error: "TODOIST_API_TOKEN not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || "tasks";
  const filter = searchParams.get("filter") || "today|overdue";

  const validEndpoints = ["tasks", "projects"];
  if (!validEndpoints.includes(endpoint)) {
    return Response.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  try {
    const url = endpoint === "tasks"
      ? `https://api.todoist.com/api/v1/tasks?filter=${encodeURIComponent(filter)}`
      : `https://api.todoist.com/api/v1/projects`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 }, // cache 60s
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: `Todoist API error: ${res.status}`, details: text }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Complete a task
export async function POST(request) {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    return Response.json({ error: "TODOIST_API_TOKEN not configured" }, { status: 500 });
  }

  try {
    const { taskId, action } = await request.json();

    if (action === "complete") {
      const res = await fetch(`https://api.todoist.com/api/v1/tasks/${taskId}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return Response.json({ error: `Failed to complete task: ${res.status}` }, { status: res.status });
      }
      return Response.json({ success: true });
    }

    if (action === "add") {
      const { content, projectId } = await request.json();
      const res = await fetch(`https://api.todoist.com/api/v1/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          project_id: projectId || undefined,
          due_string: "today",
        }),
      });
      if (!res.ok) {
        return Response.json({ error: `Failed to add task: ${res.status}` }, { status: res.status });
      }
      const data = await res.json();
      return Response.json(data);
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
