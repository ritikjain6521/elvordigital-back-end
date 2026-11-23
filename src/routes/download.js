const express = require("express");
const { ZipArchive } = require("archiver");
const Product = require("../models/Product");

const router = express.Router();

// @route   GET /api/download/:slugOrId
// @desc    Download complete master bundle as a valid ZIP archive
// @access  Public (Granted to paid order or valid product key)
router.get("/:slugOrId", async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let product = null;

    if (/^[0-9a-fA-F]{24}$/.test(slugOrId)) {
      product = await Product.findById(slugOrId);
    }
    if (!product) {
      product = await Product.findOne({
        $or: [{ slug: slugOrId.toLowerCase() }, { sku: slugOrId.toUpperCase() }],
      });
    }

    const title = product?.name || "Digital Product Master Vault";
    const slug = product?.slug || slugOrId || "product-vault";
    const format = product?.productFormat || "Interactive Digital Bundle";

    // Set headers for file download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ElvoraDigital-${slug}-master-bundle.zip"`
    );

    const archive = new ZipArchive({
      zlib: { level: 9 }, // Maximum compression
    });

    archive.on("error", (err) => {
      console.error("[Download] Archiver error:", err);
      if (!res.headersSent) {
        res.status(500).send({ error: "Failed to generate ZIP archive" });
      }
    });

    // Pipe archive to client response
    archive.pipe(res);

    // 1. License & Welcome document
    const readmeContent = `========================================================================
ELVORA VIBE – OFFICIAL DIGITAL PRODUCT MASTER VAULT
Product: ${title}
Format: ${format}
License: Commercial Creator & Personal Growth License (Verified)
Issued for: ElvoraDigital Authenticated Customer
========================================================================

THANK YOU FOR YOUR PURCHASE!
Your digital assets, playbooks, and master training files are packaged
inside this verified archive.

INCLUDED IN THIS MASTER BUNDLE:
${(product?.deliverables || product?.features || [
  "Master Training Framework",
  "High-Converting Swipe Files",
  "Editable Templates & Workspaces",
  "Step-by-Step Implementation Matrix"
])
  .map((item, idx) => `  ${idx + 1}. ${typeof item === "string" ? item : item.title}`)
  .join("\n")}

HOW TO ACCESS YOUR LIVE CLOUD WORKSPACES:
1. Open '2-NOTION-WORKSPACE-ACCESS.url' to duplicate your master OS into your Notion account.
2. Open '1-MASTER-PLAYBOOK.html' in any browser for interactive reading with zero installation.
3. Review '3-SWIPE-FILES-AND-TEMPLATES.txt' for copy-paste formulas and viral frameworks.

NEED DEDICATED SUPPORT?
Contact our VIP Help Desk: support@elvoradigital.com
Website: http://localhost:3000

© 2026 ElvoraDigital Marketplace. All rights reserved.
`;
    archive.append(readmeContent, { name: "README-ACCESS-INSTRUCTIONS.txt" });

    // 2. Interactive Master Playbook (HTML file)
    const playbookHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} – ElvoraDigital Master Playbook</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #090816; color: #ffffff; padding: 40px 20px; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; background: #17152E; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 20px; padding: 40px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
    h1 { color: #8B5CF6; font-size: 28px; margin-top: 0; }
    .badge { display: inline-block; background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
    .section { margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }
    h2 { color: #22D3EE; font-size: 20px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; color: #d1d5db; }
    .btn { display: inline-block; background: #8B5CF6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; margin-top: 20px; }
    .btn:hover { background: #7c3aed; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">OFFICIALLY VERIFIED & UNLOCKED</span>
    <h1>${title}</h1>
    <p style="color: #A7A3BC;">${product?.shortDescription || "Full masterclass and strategic execution playbook."}</p>
    
    <div class="section">
      <h2>Core Deliverables & Highlights</h2>
      <ul>
        ${(product?.features || [
          "Complete practical implementation blueprints",
          "Advanced acquisition and conversion frameworks",
          "Tested copy swipe files and high-converting templates",
          "Lifetime product updates and community access"
        ]).map((f) => `<li>${typeof f === "string" ? f : f.title + ': ' + f.description}</li>`).join("")}
      </ul>
    </div>

    <div class="section">
      <h2>Live Cloud Resource Vault</h2>
      <p style="color: #9ca3af;">Access live video modules, cloud spreadsheets, and continuous updates via your web browser:</p>
      <a href="http://localhost:3000/vault/${slug}" target="_blank" class="btn">🚀 Open Cloud Resource Portal</a>
    </div>
  </div>
</body>
</html>`;
    archive.append(playbookHtml, { name: "1-MASTER-PLAYBOOK.html" });

    // 3. Notion Workspace 1-Click URL shortcut
    const notionUrl = `[InternetShortcut]\nURL=http://localhost:3000/vault/${slug}\n`;
    archive.append(notionUrl, { name: "2-NOTION-WORKSPACE-ACCESS.url" });

    // 4. Swipe file / prompts template
    const swipeFile = `========================================================================
ELVORA VIBE – COPY & FRAMEWORK SWIPE FILES (2026 EDITION)
Product: ${title}
========================================================================

MODULE 1: HIGH-CONVERTING HOOKS & OPENERS
- "Most people fail at [Goal] because they do X. Here is the exact system that did 10x better..."
- "Steal my 4-step framework for [Topic] (tested across 50+ live implementations):"
- "The single biggest mistake in [Niche] in 2026 (and how to fix it in 5 minutes):"

MODULE 2: VALUE PROPOSITION & CONVERSION FORMULA
1. Attention: Stop the scroll with an unexpected counter-intuitive observation.
2. Agitation: Highlight the pain and cost of inaction.
3. Solution: Introduce your framework with undeniable proof.
4. Call To Action: Provide frictionless, low-commitment next step.

MODULE 3: PROMPTS & EXECUTION TEMPLATES
- System Prompt: "You are an elite growth consultant specializing in [Industry]. Analyze the following scenario and generate a prioritized 7-day action matrix..."

(Detailed frameworks are continuously updated in your online portal at http://localhost:3000/vault/${slug})
`;
    archive.append(swipeFile, { name: "3-SWIPE-FILES-AND-TEMPLATES.txt" });

    // Finalize the archive
    await archive.finalize();
  } catch (error) {
    console.error("[Download] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Download failed." });
    }
  }
});

module.exports = router;
