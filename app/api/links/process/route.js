import { detectUrlType } from "../../../../lib/extractors/detect.js";
import { extractYouTube, formatTranscriptText } from "../../../../lib/extractors/youtube.js";
import { extractArticle } from "../../../../lib/extractors/article.js";
import { summarizeContent } from "../../../../lib/ai/summarize.js";
import { findItemByUrl, insertItem, linkItemTags, updateItem } from "../../../../lib/db.js";
import { buildFilePath, saveFiles } from "../../../../lib/storage/files.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event, data) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const { url } = await request.json();
        if (!url) {
          send("error", { message: "URL is required" });
          controller.close();
          return;
        }

        // Check for duplicates
        const existing = findItemByUrl(url);
        if (existing) {
          send("duplicate", {
            message: "This URL has already been saved",
            existingItem: { id: existing.id, title: existing.title, created_at: existing.created_at },
          });
        }

        // Step 1: Detect type
        send("step", { step: "detecting", status: "in_progress" });
        const type = detectUrlType(url);
        send("step", { step: "detecting", status: "complete", result: { type } });

        // Step 2: Extract content
        send("step", { step: "extracting", status: "in_progress" });
        let metadata, rawContent;

        if (type === "youtube") {
          const data = await extractYouTube(url);
          metadata = {
            title: data.title,
            channel: data.channel,
            author: data.channel,
            thumbnail: data.thumbnail,
            url,
            hasTranscript: data.hasTranscript,
          };
          rawContent = data.hasTranscript ? formatTranscriptText(data.transcript) : null;
        } else {
          const data = await extractArticle(url);
          metadata = {
            title: data.title,
            author: data.author,
            siteName: data.siteName,
            publishedTime: data.publishedTime,
            readingTime: data.readingTime,
            url,
            isPartial: data.isPartial,
          };
          rawContent = data.textContent;
        }

        send("step", {
          step: "extracting",
          status: "complete",
          result: { title: metadata.title, hasContent: !!rawContent },
        });

        // Step 3: AI Summarization
        send("step", { step: "summarizing", status: "in_progress" });
        let summary;
        let itemStatus = "complete";

        try {
          summary = await summarizeContent(type, metadata, rawContent || "");
        } catch (err) {
          console.error("AI summarization failed:", err.message);
          send("step", { step: "summarizing", status: "failed", error: err.message });
          summary = {
            summary: "AI summarization was not available. Raw content has been saved.",
            key_takeaways: [],
            tags: { existing: ["Learning"], suggested_new: [] },
          };
          itemStatus = "partial";
        }

        if (summary) {
          send("step", { step: "summarizing", status: "complete" });
        }

        // Step 4: Save files + DB
        send("step", { step: "saving", status: "in_progress" });

        const primaryTag = summary.tags?.existing?.[0] || "Learning";
        const allTags = [
          ...(summary.tags?.existing || []),
          ...(summary.tags?.suggested_new || []),
        ];

        const relativePath = buildFilePath(primaryTag, type, metadata.title || "untitled");

        saveFiles({
          relativePath,
          type,
          metadata,
          summary,
          rawContent,
        });

        // Insert into database
        const result = insertItem({
          url,
          type,
          title: metadata.title || null,
          author: metadata.author || metadata.channel || null,
          thumbnail: metadata.thumbnail || null,
          duration: metadata.duration || null,
          publish_date: metadata.publishedTime || null,
          reading_time: metadata.readingTime || null,
          summary_preview: (summary.summary || "").substring(0, 200),
          file_path: relativePath,
          status: itemStatus,
          error_message: itemStatus === "partial" ? "AI summarization failed" : null,
        });

        const itemId = result.lastInsertRowid;

        // Link tags
        if (allTags.length > 0) {
          linkItemTags(Number(itemId), allTags);
        }

        send("step", { step: "saving", status: "complete" });

        // Done
        send("done", {
          item: {
            id: Number(itemId),
            url,
            type,
            title: metadata.title,
            author: metadata.author || metadata.channel,
            thumbnail: metadata.thumbnail,
            summary_preview: (summary.summary || "").substring(0, 200),
            tags: allTags,
            status: itemStatus,
            file_path: relativePath,
          },
        });
      } catch (err) {
        console.error("Processing error:", err);
        send("error", { message: err.message || "An unexpected error occurred" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
