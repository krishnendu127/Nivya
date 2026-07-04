"""Convert Nivya markdown docs to print-ready HTML."""
import sys
import markdown
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

CSS = """
@page { margin: 18mm 16mm; size: A4; }
body { font-family: "Segoe UI", Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.45;
  color: #1a1a2e; max-width: 900px; margin: 0 auto; padding: 24px; }
h1 { font-size: 22pt; color: #16213e; border-bottom: 3px solid #19c9ae; padding-bottom: 8px; }
h2 { font-size: 14pt; color: #2456be; margin-top: 28px; page-break-after: avoid; }
h3 { font-size: 12pt; color: #16213e; margin-top: 20px; }
table { border-collapse: collapse; width: 100%; margin: 12px 0 18px; font-size: 10pt; }
th, td { border: 1px solid #d0d7de; padding: 7px 10px; text-align: left; vertical-align: top; }
th { background: #eaf7f3; font-weight: 700; }
tr:nth-child(even) td { background: #f8fafc; }
code, pre { background: #f4f6f8; border-radius: 6px; }
pre { padding: 12px; overflow-x: auto; font-size: 9pt; white-space: pre-wrap; }
blockquote { border-left: 4px solid #19c9ae; margin: 16px 0; padding: 8px 16px; background: #f0faf7; }
a { color: #2456be; word-break: break-all; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
.footer { margin-top: 32px; font-size: 9pt; color: #666; }
@media print { body { padding: 0; } table { page-break-inside: avoid; } }
"""


def convert(md_rel: str) -> Path:
    md_path = ROOT / md_rel
    html_path = md_path.with_suffix(".html")
    md_text = md_path.read_text(encoding="utf-8")
    body = markdown.markdown(md_text, extensions=["tables", "fenced_code", "toc"])
    title = md_path.stem.replace("-", " ")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title}</title>
<style>{CSS}</style>
</head>
<body>
{body}
<p class="footer">Generated from {md_rel} — Nivya internal use. Print (Ctrl+P) → Save as PDF.</p>
</body>
</html>
"""
    html_path.write_text(html, encoding="utf-8")
    print(f"Wrote {html_path}")
    return html_path


if __name__ == "__main__":
    rel = sys.argv[1] if len(sys.argv) > 1 else "docs/NIVYA-TEAM-DISCUSSION-BRIEF.md"
    convert(rel)
