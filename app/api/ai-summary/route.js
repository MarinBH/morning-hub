// AI Summary endpoint — uses Claude API to summarize content
export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'AI summarization not configured' }, { status: 500 });
  }

  try {
    const { content, type } = await request.json();
    if (!content?.trim()) {
      return Response.json({ error: 'No content provided' }, { status: 400 });
    }

    // If URL, attempt to fetch actual page content (#11)
    let actualContent = content.trim();
    if (type === 'url' && /^https?:\/\//.test(actualContent)) {
      try {
        const pageRes = await fetch(actualContent, {
          headers: { 'User-Agent': 'MorningHub/1.0' },
          signal: AbortSignal.timeout(8000),
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          // Strip HTML tags, scripts, styles to get text content
          const textContent = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          actualContent = `URL: ${actualContent}\n\nPage content:\n${textContent.slice(0, 6000)}`;
        }
      } catch {
        // Fetch failed — proceed with URL string only
        actualContent = `URL: ${actualContent} (page content could not be fetched)`;
      }
    }

    const prompt = type === 'url'
      ? `Analyze this URL/content and provide a structured summary. Return a JSON object with these fields:
- "title": a concise title (max 60 chars)
- "keyPoints": array of 3-5 key takeaway bullet points (strings)
- "category": one of [Health, Tech, Productivity, Business, Science, Finance, Learning, Lifestyle, Other]
- "tags": array of 3-5 relevant tags (lowercase strings)
- "actionItems": array of 0-3 actionable next steps (if any)
- "contentType": one of [article, video, place, social, other]

Content to analyze:
${actualContent.slice(0, 6000)}`
      : `Analyze this note/text and provide a structured summary. Return a JSON object with these fields:
- "title": a concise title summarizing the content (max 60 chars)
- "keyPoints": array of 2-4 key points (strings)
- "category": one of [Health, Tech, Productivity, Business, Science, Finance, Learning, Lifestyle, Other]
- "tags": array of 2-4 relevant tags (lowercase strings)
- "actionItems": array of 0-2 actionable next steps (if any)
- "contentType": "note"

Content to analyze:
${actualContent.slice(0, 6000)}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `AI API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback: return raw text as a basic summary
      return Response.json({
        title: 'AI Summary',
        keyPoints: [text.slice(0, 500)],
        category: 'Other',
        tags: [],
        actionItems: [],
        contentType: 'note',
      });
    }

    try {
      const summary = JSON.parse(jsonMatch[0]);
      return Response.json(summary);
    } catch {
      // JSON parse failed — return raw text as fallback
      return Response.json({
        title: 'AI Summary',
        keyPoints: [text.slice(0, 500)],
        category: 'Other',
        tags: [],
        actionItems: [],
        contentType: 'note',
      });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
