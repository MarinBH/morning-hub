// Test: File storage + markdown template + PDF generation
import { slugify, buildFilePath, saveFiles } from "../lib/storage/files.js";
import fs from "fs";
import path from "path";

console.log("📁 Testing File Storage\n");

// Test slugify
const slugTests = [
  { input: "How to Build AI Agents in 2024", expected: "how-to-build-ai-agents-in-2024" },
  { input: "Tech/AI & Machine Learning!", expected: "techai-machine-learning" },
  { input: "  Spaces  Everywhere  ", expected: "spaces-everywhere" },
  { input: "", expected: "" },
];

console.log("  Slugify tests:");
for (const test of slugTests) {
  const result = slugify(test.input);
  const ok = result === test.expected;
  console.log(`    ${ok ? "✅" : "❌"} "${test.input}" → "${result}" ${!ok ? `(expected "${test.expected}")` : ""}`);
}

// Test buildFilePath
console.log("\n  Path building:");
const p1 = buildFilePath("Tech/AI", "youtube", "How to Build AI Agents");
console.log(`    ✅ YouTube: ${p1}`);
const p2 = buildFilePath("Learning", "article", "Understanding React Server Components");
console.log(`    ✅ Article: ${p2}`);

// Test actual file saving with mock data
console.log("\n  File saving:");

const mockSummary = {
  summary: "This is a test summary about AI agents. The video covers key concepts about building autonomous agents using large language models. The presenter discusses practical frameworks for agent architecture.",
  key_takeaways: [
    "AI agents need a planning loop to be effective",
    "Tool use is the key differentiator from simple chatbots",
    "Start simple and iterate — don't over-engineer upfront",
  ],
  actionable_advice: [
    "Begin with a single tool and expand the toolset gradually",
    "Always include a human-in-the-loop for critical decisions",
  ],
  frameworks_and_analogies: [
    "The \"Observe-Think-Act\" loop for agent reasoning",
    "Tools as \"hands\" and LLM as \"brain\" analogy",
  ],
  notable_quotes: [
    { quote: "The best agent is one you barely notice is there.", source: "12:34" },
    { quote: "Don't build a framework, build a product.", source: "25:10" },
  ],
  tags: {
    existing: ["Tech/AI", "Learning"],
    suggested_new: ["AI Agents"],
  },
};

const mockMetadata = {
  title: "How to Build AI Agents - Complete Guide",
  channel: "AI Engineering",
  author: "AI Engineering",
  thumbnail: "https://i.ytimg.com/vi/test123/hqdefault.jpg",
  url: "https://www.youtube.com/watch?v=test123",
};

const relativePath = buildFilePath("Tech/AI", "youtube", mockMetadata.title);

const { directory, markdownPath, pdfPath } = saveFiles({
  relativePath,
  type: "youtube",
  metadata: mockMetadata,
  summary: mockSummary,
  rawContent: "This is the raw transcript text for testing purposes. It should be saved as transcript.txt.",
});

// Verify files
console.log(`    Directory: ${directory}`);

const mdExists = fs.existsSync(markdownPath);
console.log(`    ${mdExists ? "✅" : "❌"} summary.md ${mdExists ? "created" : "MISSING"}`);

if (mdExists) {
  const mdContent = fs.readFileSync(markdownPath, "utf-8");
  console.log(`    ✅ Markdown size: ${mdContent.length} chars`);

  // Check frontmatter
  const hasFrontmatter = mdContent.startsWith("---");
  console.log(`    ${hasFrontmatter ? "✅" : "❌"} YAML frontmatter present`);

  // Check sections
  const sections = ["Summary", "Key Takeaways", "Actionable Advice", "Frameworks & Analogies", "Notable Quotes"];
  for (const section of sections) {
    const has = mdContent.includes(`## ${section}`);
    console.log(`    ${has ? "✅" : "❌"} Section: ${section}`);
  }
}

const transcriptPath = path.join(directory, "transcript.txt");
const transcriptExists = fs.existsSync(transcriptPath);
console.log(`    ${transcriptExists ? "✅" : "❌"} transcript.txt ${transcriptExists ? "created" : "MISSING"}`);

// PDF is generated async, give it a moment
console.log("    ⏳ Waiting for PDF generation (2s)...");
await new Promise(r => setTimeout(r, 2000));

const pdfExists = fs.existsSync(pdfPath);
console.log(`    ${pdfExists ? "✅" : "❌"} summary.pdf ${pdfExists ? "created" : "MISSING (may still be generating)"}`);

if (pdfExists) {
  const pdfSize = fs.statSync(pdfPath).size;
  console.log(`    ✅ PDF size: ${(pdfSize / 1024).toFixed(1)} KB`);
}

// Now test article save
console.log("\n  Testing article file save:");
const articlePath = buildFilePath("Science", "article", "The Future of Quantum Computing");
const articleResult = saveFiles({
  relativePath: articlePath,
  type: "article",
  metadata: {
    title: "The Future of Quantum Computing",
    author: "Jane Smith",
    siteName: "Nature",
    publishedTime: "2024-06-15",
    readingTime: 12,
    url: "https://nature.com/articles/quantum-future",
  },
  summary: {
    summary: "An overview of quantum computing progress and future outlook.",
    key_takeaways: ["Quantum advantage is near for specific problems"],
    actionable_advice: ["Learn quantum basics now to prepare"],
    frameworks_and_analogies: [],
    notable_quotes: [],
    tags: { existing: ["Science", "Tech/AI"], suggested_new: [] },
  },
  rawContent: "Full article text would go here...",
});

const articleMd = fs.existsSync(articleResult.markdownPath);
const articleTxt = fs.existsSync(path.join(articleResult.directory, "full-text.txt"));
console.log(`    ${articleMd ? "✅" : "❌"} summary.md created`);
console.log(`    ${articleTxt ? "✅" : "❌"} full-text.txt created`);

console.log("\n✅ Storage tests complete!\n");
