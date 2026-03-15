"""
report_generator.py – Generates a rich HTML pentesting report and a
PDF version using ReportLab (pure Python, zero system dependencies).
"""

import base64
import datetime
from io import BytesIO
from typing import Optional

from jinja2 import Environment, BaseLoader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, FrameBreak, HRFlowable, Image,
    NextPageTemplate, PageBreak, PageTemplate, Paragraph,
    Spacer, Table, TableStyle
)
from reportlab.platypus.flowables import KeepTogether

# ---------------------------------------------------------------------------
# Color palette
# ---------------------------------------------------------------------------
BG_DARK       = colors.HexColor("#0d1117")
BG_CARD       = colors.HexColor("#161b22")
TEXT_MAIN     = colors.HexColor("#e6edf3")
TEXT_MUTED    = colors.HexColor("#8b949e")
ACCENT_BLUE   = colors.HexColor("#58a6ff")
ACCENT_PURPLE = colors.HexColor("#bc8cff")
GREEN         = colors.HexColor("#3fb950")
ORANGE        = colors.HexColor("#db6d28")
BORDER        = colors.HexColor("#30363d")

SEV_COLORS = {
    "critical": (colors.HexColor("#ff4757"), colors.HexColor("#2a0a0a")),
    "high":     (colors.HexColor("#ff6b35"), colors.HexColor("#2a1200")),
    "medium":   (colors.HexColor("#ffa502"), colors.HexColor("#2a1e00")),
    "low":      (colors.HexColor("#2ed573"), colors.HexColor("#051a0a")),
    "info":     (colors.HexColor("#1e90ff"), colors.HexColor("#050f1f")),
}


# ---------------------------------------------------------------------------
# Helper: overall risk from vulnerability list
# ---------------------------------------------------------------------------
def _compute_risk(vulnerabilities: list[dict]) -> tuple[str, dict]:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for v in vulnerabilities:
        sev = v.get("severity", "low").lower()
        if sev in counts:
            counts[sev] += 1
        else:
            counts["low"] += 1
    if counts["critical"] > 0:
        risk = "Critical"
    elif counts["high"] > 0:
        risk = "High"
    elif counts["medium"] > 0:
        risk = "Medium"
    else:
        risk = "Low"
    return risk, counts


def _safe_str(v: dict, key: str, fallback: str = "N/A") -> str:
    val = v.get(key, fallback) or fallback
    return str(val).strip() or fallback


# ---------------------------------------------------------------------------
# ReportLab PDF generator
# ---------------------------------------------------------------------------
def _build_pdf(
    target: str,
    report: str,
    vulnerabilities: list[dict],
    full_report: str,
) -> bytes:
    buf = BytesIO()
    page_w, page_h = A4
    margin = 25 * mm

    doc = BaseDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin,
        title=f"Pentest Report – {target}",
        author="Hacker.AI",
    )

    # ---------- Page templates ----------
    body_frame = Frame(margin, margin, page_w - 2 * margin, page_h - 2 * margin, id="body")
    doc.addPageTemplates([PageTemplate(id="Normal", frames=[body_frame])])

    # ---------- Styles ----------
    base = getSampleStyleSheet()

    def sty(name, parent="Normal", **kw):
        s = ParagraphStyle(name, parent=base[parent], **kw)
        return s

    s_cover_title = sty("CoverTitle",
        fontSize=32, textColor=TEXT_MAIN, spaceAfter=8,
        alignment=TA_CENTER, fontName="Helvetica-Bold", leading=40)
    s_cover_sub = sty("CoverSub",
        fontSize=14, textColor=TEXT_MUTED, spaceAfter=4,
        alignment=TA_CENTER, fontName="Helvetica")
    s_cover_meta = sty("CoverMeta",
        fontSize=10, textColor=ACCENT_BLUE,
        alignment=TA_CENTER, fontName="Helvetica-Bold")
    s_cover_risk = sty("CoverRisk",
        fontSize=16, textColor=TEXT_MAIN,
        alignment=TA_CENTER, fontName="Helvetica-Bold", spaceBefore=12)
    s_section = sty("Section",
        fontSize=18, textColor=ACCENT_BLUE, spaceBefore=20, spaceAfter=8,
        fontName="Helvetica-Bold", borderPad=4,
        leftIndent=0)
    s_body = sty("Body",
        fontSize=10.5, textColor=TEXT_MAIN, spaceAfter=6,
        fontName="Helvetica", leading=16, alignment=TA_JUSTIFY)
    s_field_label = sty("FieldLabel",
        fontSize=9, textColor=TEXT_MUTED, spaceAfter=2,
        fontName="Helvetica-Bold", spaceBefore=10)
    s_monospace = sty("Mono",
        fontSize=8.5, textColor=colors.HexColor("#a8d8a8"),
        fontName="Courier", leading=13, spaceAfter=4,
        backColor=BG_DARK, borderPad=4)
    s_evidence = sty("Evidence",
        fontSize=8.5, textColor=colors.HexColor("#7ec8e3"),
        fontName="Courier", leading=13, spaceAfter=4,
        backColor=colors.HexColor("#050d14"), borderPad=4)
    s_fix = sty("Fix",
        fontSize=10, textColor=TEXT_MAIN, spaceAfter=4,
        fontName="Helvetica", leading=15,
        backColor=colors.HexColor("#051a0a"), borderPad=6)
    s_vuln_title = sty("VulnTitle",
        fontSize=13, textColor=TEXT_MAIN, spaceAfter=4,
        fontName="Helvetica-Bold")
    s_toc = sty("TOCEntry",
        fontSize=10, textColor=TEXT_MAIN, spaceAfter=3,
        fontName="Helvetica", leading=14)
    s_caption = sty("Caption",
        fontSize=9, textColor=TEXT_MUTED,
        alignment=TA_CENTER, fontName="Helvetica")

    overall_risk, counts = _compute_risk(vulnerabilities)
    risk_color = SEV_COLORS.get(overall_risk.lower(), (ACCENT_BLUE, BG_CARD))[0]
    date_str = datetime.datetime.now().strftime("%B %d, %Y")

    story = []

    # ========================================================= COVER PAGE
    story.append(Spacer(1, 60 * mm))

    # Gradient-style header block using a table
    cover_table = Table(
        [[Paragraph("CONFIDENTIAL SECURITY ASSESSMENT", sty("CoverBadge",
           fontSize=9, textColor=ACCENT_BLUE, alignment=TA_CENTER,
           fontName="Helvetica-Bold", spaceBefore=0, spaceAfter=0))]],
        colWidths=[page_w - 2 * margin]
    )
    cover_table.setStyle(TableStyle([
        ("BACKGROUND",  (0,0), (-1,-1), colors.HexColor("#0d1f33")),
        ("ROUNDEDCORNERS", (0, 0), (-1, -1), [6]),
        ("TOPPADDING",  (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("BOX",         (0,0), (-1,-1), 1, ACCENT_BLUE),
    ]))
    story.append(cover_table)
    story.append(Spacer(1, 16))

    story.append(Paragraph("Penetration Testing Report", s_cover_title))
    story.append(Paragraph("Comprehensive Vulnerability Assessment &amp; Findings", s_cover_sub))
    story.append(Spacer(1, 24))

    # Meta table
    meta_data = [
        [
            Paragraph("TARGET", s_cover_meta),
            Paragraph("DATE", s_cover_meta),
            Paragraph("TOTAL FINDINGS", s_cover_meta),
        ],
        [
            Paragraph(f'<font color="#e6edf3"><b>{target}</b></font>', sty("V",
                fontSize=11, textColor=TEXT_MAIN, alignment=TA_CENTER, fontName="Courier-Bold")),
            Paragraph(f'<font color="#e6edf3"><b>{date_str}</b></font>', sty("V2",
                fontSize=10, textColor=TEXT_MAIN, alignment=TA_CENTER, fontName="Helvetica-Bold")),
            Paragraph(f'<font color="#e6edf3"><b>{len(vulnerabilities)}</b></font>', sty("V3",
                fontSize=11, textColor=TEXT_MAIN, alignment=TA_CENTER, fontName="Helvetica-Bold")),
        ],
    ]
    meta_tbl = Table(meta_data, colWidths=[(page_w - 2*margin) / 3]*3)
    meta_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), BG_CARD),
        ("BOX",           (0,0), (-1,-1), 1, BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
    ]))
    story.append(meta_tbl)
    story.append(Spacer(1, 24))

    # Risk badge
    risk_tbl = Table(
        [[Paragraph(f"⚠  Overall Risk: {overall_risk}", sty("Risk",
            fontSize=14, textColor=risk_color, alignment=TA_CENTER,
            fontName="Helvetica-Bold"))]],
        colWidths=[page_w - 2 * margin]
    )
    risk_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), SEV_COLORS.get(overall_risk.lower(), (ACCENT_BLUE, BG_CARD))[1]),
        ("BOX",           (0,0), (-1,-1), 2, risk_color),
        ("TOPPADDING",    (0,0), (-1,-1), 12),
        ("BOTTOMPADDING", (0,0), (-1,-1), 12),
    ]))
    story.append(risk_tbl)
    story.append(PageBreak())

    # ========================================================= 1. EXECUTIVE SUMMARY
    story.append(Paragraph("1. Executive Summary", s_section))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 8))

    # Stats cards row
    stats_data = [
        [
            Paragraph(str(counts["critical"]), sty("SC",
                fontSize=28, textColor=SEV_COLORS["critical"][0],
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
            Paragraph(str(counts["high"]), sty("SH",
                fontSize=28, textColor=SEV_COLORS["high"][0],
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
            Paragraph(str(counts["medium"]), sty("SM",
                fontSize=28, textColor=SEV_COLORS["medium"][0],
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
            Paragraph(str(counts["low"]), sty("SL",
                fontSize=28, textColor=SEV_COLORS["low"][0],
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
        ],
        [
            Paragraph("CRITICAL", sty("SLC", fontSize=8, textColor=SEV_COLORS["critical"][0],
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
            Paragraph("HIGH", sty("SLH", fontSize=8, textColor=SEV_COLORS["high"][0],
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
            Paragraph("MEDIUM", sty("SLM", fontSize=8, textColor=SEV_COLORS["medium"][0],
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
            Paragraph("LOW / INFO", sty("SLL", fontSize=8, textColor=SEV_COLORS["low"][0],
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
        ],
    ]
    stats_tbl = Table(stats_data, colWidths=[(page_w - 2*margin) / 4]*4)
    stats_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), BG_CARD),
        ("BOX",           (0,0), (-1,-1), 1, BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 12),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING",   (0,0), (-1,-1), 4),
        ("RIGHTPADDING",  (0,0), (-1,-1), 4),
    ]))
    story.append(stats_tbl)
    story.append(Spacer(1, 16))

    # Narrative summary in a styled box
    for para in report.strip().split("\n\n"):
        if para.strip():
            story.append(Paragraph(para.replace("\n", " ").strip(), s_body))

    story.append(PageBreak())

    # ========================================================= 2. VULNERABILITY SUMMARY TABLE
    story.append(Paragraph("2. Vulnerability Summary", s_section))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 8))

    tbl_header = [
        Paragraph("#", sty("TH", fontSize=9, textColor=TEXT_MUTED, fontName="Helvetica-Bold", alignment=TA_CENTER)),
        Paragraph("Vulnerability", sty("TH2", fontSize=9, textColor=TEXT_MUTED, fontName="Helvetica-Bold")),
        Paragraph("Severity", sty("TH3", fontSize=9, textColor=TEXT_MUTED, fontName="Helvetica-Bold", alignment=TA_CENTER)),
        Paragraph("CVE", sty("TH4", fontSize=9, textColor=TEXT_MUTED, fontName="Helvetica-Bold", alignment=TA_CENTER)),
        Paragraph("CVSS", sty("TH5", fontSize=9, textColor=TEXT_MUTED, fontName="Helvetica-Bold", alignment=TA_CENTER)),
    ]
    tbl_data = [tbl_header]
    col_w = page_w - 2 * margin
    col_widths = [12*mm, col_w - 12*mm - 22*mm - 35*mm - 18*mm, 22*mm, 35*mm, 18*mm]

    for i, v in enumerate(vulnerabilities, 1):
        sev = _safe_str(v, "severity", "Low")
        sev_color = SEV_COLORS.get(sev.lower(), SEV_COLORS["low"])[0]
        sev_bg    = SEV_COLORS.get(sev.lower(), SEV_COLORS["low"])[1]
        cvss_val  = _safe_str(v, "cvss", "0.0")
        cve_val   = _safe_str(v, "cve", "N/A")
        tbl_data.append([
            Paragraph(str(i), sty(f"TN{i}", fontSize=10, textColor=TEXT_MAIN,
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
            Paragraph(_safe_str(v, "title"), sty(f"TT{i}", fontSize=10, textColor=TEXT_MAIN, fontName="Helvetica")),
            Paragraph(sev, sty(f"TS{i}", fontSize=8, textColor=sev_color,
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
            Paragraph(cve_val, sty(f"TC{i}", fontSize=8, textColor=ACCENT_PURPLE,
                alignment=TA_CENTER, fontName="Courier")),
            Paragraph(cvss_val, sty(f"TCV{i}", fontSize=9, textColor=sev_color,
                alignment=TA_CENTER, fontName="Helvetica-Bold")),
        ])

    vuln_tbl = Table(tbl_data, colWidths=col_widths, repeatRows=1)
    ts = [
        ("BACKGROUND",    (0,0), (-1,0), colors.HexColor("#1c2128")),
        ("TEXTCOLOR",     (0,0), (-1,0), TEXT_MUTED),
        ("LINEBELOW",     (0,0), (-1,0), 1.5, ACCENT_BLUE),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,0), 9),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("RIGHTPADDING",  (0,0), (-1,-1), 6),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [BG_CARD, colors.HexColor("#0f1419")]),
        ("LINEAFTER",     (0,0), (-1,-1), 0.5, BORDER),
        ("LINEBEFORE",    (0,0), (-1,-1), 0.5, BORDER),
        ("LINEBELOW",     (0,1), (-1,-1), 0.5, BORDER),
        ("BOX",           (0,0), (-1,-1), 1, BORDER),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]
    for i, v in enumerate(vulnerabilities, 1):
        sev = _safe_str(v, "severity", "Low").lower()
        sev_bg = SEV_COLORS.get(sev, SEV_COLORS["low"])[1]
        sev_fg = SEV_COLORS.get(sev, SEV_COLORS["low"])[0]
        ts.append(("BACKGROUND", (2, i), (2, i), sev_bg))
        ts.append(("TEXTCOLOR",  (2, i), (2, i), sev_fg))
    vuln_tbl.setStyle(TableStyle(ts))
    story.append(vuln_tbl)
    story.append(PageBreak())

    # ========================================================= 3. DETAILED FINDINGS
    story.append(Paragraph("3. Detailed Findings", s_section))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))

    for i, v in enumerate(vulnerabilities, 1):
        sev = _safe_str(v, "severity", "Low")
        sev_lower = sev.lower()
        sev_fg, sev_bg = SEV_COLORS.get(sev_lower, SEV_COLORS["low"])
        cve  = _safe_str(v, "cve",  "N/A")
        cvss = _safe_str(v, "cvss", "0.0")
        title = _safe_str(v, "title", f"Vulnerability #{i}")
        desc  = _safe_str(v, "description", "No description.")
        poc   = _safe_str(v, "proof_of_concept", "No PoC provided.")
        pow_  = _safe_str(v, "proof_of_work",  "No evidence provided.")
        fix   = _safe_str(v, "how_to_fix",     "No remediation provided.")

        card = []

        # Header row
        header_row = Table(
            [[
                Table([[
                    Paragraph(str(i), sty(f"Idx{i}", fontSize=13, textColor=colors.white,
                        alignment=TA_CENTER, fontName="Helvetica-Bold"))
                ]], colWidths=[9*mm]),
                Paragraph(title, s_vuln_title),
                Table([[
                    Paragraph(sev.upper(), sty(f"SB{i}", fontSize=8,
                        textColor=sev_fg, alignment=TA_CENTER, fontName="Helvetica-Bold")),
                ]], colWidths=[20*mm]),
                Table([[
                    Paragraph(f"CVSS {cvss}", sty(f"CB{i}", fontSize=8,
                        textColor=sev_fg, alignment=TA_CENTER, fontName="Helvetica-Bold")),
                ]], colWidths=[18*mm]),
            ]],
            colWidths=[10*mm, col_w - 10*mm - 22*mm - 20*mm, 22*mm, 20*mm]
        )
        header_row.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (0,0), sev_fg),
            ("BACKGROUND",    (1,0), (-1,-1), sev_bg),
            ("BACKGROUND",    (2,0), (2,0), sev_bg),
            ("BACKGROUND",    (3,0), (3,0), sev_bg),
            ("BOX",           (2,0), (2,0), 1, sev_fg),
            ("BOX",           (3,0), (3,0), 1, sev_fg),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING",    (0,0), (-1,-1), 10),
            ("BOTTOMPADDING", (0,0), (-1,-1), 10),
            ("LEFTPADDING",   (0,0), (-1,-1), 6),
            ("RIGHTPADDING",  (0,0), (-1,-1), 6),
        ]))
        card.append(header_row)

        # CVE sub-row
        if cve != "N/A":
            cve_row = Table(
                [[Paragraph(f"CVE: {cve}", sty(f"CVR{i}", fontSize=8.5,
                    textColor=ACCENT_PURPLE, fontName="Courier-Bold"))]],
                colWidths=[col_w]
            )
            cve_row.setStyle(TableStyle([
                ("BACKGROUND",  (0,0), (-1,-1), colors.HexColor("#130d1f")),
                ("TOPPADDING",  (0,0), (-1,-1), 5),
                ("BOTTOMPADDING",(0,0),(-1,-1), 5),
                ("LEFTPADDING", (0,0), (-1,-1), 14),
            ]))
            card.append(cve_row)

        # Field builder helper
        def field(label: str, content: str, style, border_color=BORDER):
            label_cell = Table([[Paragraph(label, sty(f"FL{i}{label}",
                fontSize=8, textColor=TEXT_MUTED, fontName="Helvetica-Bold"))]],
                colWidths=[col_w])
            label_cell.setStyle(TableStyle([
                ("BACKGROUND",  (0,0),(-1,-1), colors.HexColor("#1c2128")),
                ("TOPPADDING",  (0,0),(-1,-1), 5),
                ("BOTTOMPADDING",(0,0),(-1,-1), 5),
                ("LEFTPADDING", (0,0),(-1,-1), 10),
                ("LINEABOVE",   (0,0),(-1,-1), 1, BORDER),
            ]))
            content_tbl = Table([[Paragraph(content, style)]],
                colWidths=[col_w])
            content_tbl.setStyle(TableStyle([
                ("BACKGROUND",    (0,0),(-1,-1), BG_CARD),
                ("TOPPADDING",    (0,0),(-1,-1), 8),
                ("BOTTOMPADDING", (0,0),(-1,-1), 8),
                ("LEFTPADDING",   (0,0),(-1,-1), 10),
                ("RIGHTPADDING",  (0,0),(-1,-1), 10),
            ]))
            return [label_cell, content_tbl]

        card += field("📋  DESCRIPTION", desc, s_body)
        card += field("🔥  PROOF OF CONCEPT", poc.replace("<", "&lt;").replace(">", "&gt;"),
                      s_monospace, ORANGE)
        card += field("🔬  PROOF OF WORK / EVIDENCE",
                      pow_.replace("<", "&lt;").replace(">", "&gt;"), s_evidence, ACCENT_BLUE)
        card += field("🛠  HOW TO FIX", fix.replace("\n", "<br/>"), s_fix, GREEN)

        # Wrap whole card in outer box
        outer = Table([[item] for item in card], colWidths=[col_w])
        outer.setStyle(TableStyle([
            ("BOX",           (0,0), (-1,-1), 2, sev_fg),
            ("LEFTPADDING",   (0,0), (-1,-1), 0),
            ("RIGHTPADDING",  (0,0), (-1,-1), 0),
            ("TOPPADDING",    (0,0), (-1,-1), 0),
            ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ]))

        story.append(Spacer(1, 14))
        story.append(KeepTogether([outer]) if len(vulnerabilities) <= 3 else outer)

    story.append(PageBreak())

    # ========================================================= 4. FULL NARRATIVE REPORT
    story.append(Paragraph("4. Full Penetration Testing Report", s_section))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 8))

    for para in full_report.strip().split("\n\n"):
        if para.strip():
            story.append(Paragraph(para.replace("\n", " ").strip(), s_body))

    # ========================================================= FOOTER
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"Generated by Hacker.AI  ·  {date_str}  ·  Confidential — For Authorized Use Only",
        sty("Footer", fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER, fontName="Helvetica")
    ))

    # Build PDF
    doc.build(story)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Jinja2 HTML Template for the HTML version
# ---------------------------------------------------------------------------
_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Pentest Report – {{ target }}</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; background:#0d1117; color:#e6edf3; margin:0; font-size:14px; line-height:1.7; }
  .cover { min-height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:60px 40px; background:linear-gradient(135deg,#0d1117,#161b22,#1a1f2e); page-break-after:always; }
  .cover h1 { font-size:48px; font-weight:800; background:linear-gradient(135deg,#e6edf3,#58a6ff,#bc8cff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .cover-badge { display:inline-block; background:rgba(88,166,255,.15); border:1px solid rgba(88,166,255,.3); color:#58a6ff; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; padding:6px 18px; border-radius:20px; margin-bottom:28px; }
  .meta-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; max-width:600px; margin:32px auto; }
  .meta-card { background:rgba(255,255,255,.04); border:1px solid #30363d; border-radius:10px; padding:14px; }
  .meta-label { font-size:10px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#8b949e; margin-bottom:4px; }
  .meta-value { font-family:monospace; font-weight:700; color:#e6edf3; }
  .risk-badge { display:inline-flex; align-items:center; gap:8px; font-size:15px; font-weight:700; padding:10px 28px; border-radius:30px; letter-spacing:1px; text-transform:uppercase; margin-top:12px; }
  .risk-badge.critical { background:rgba(255,71,87,.12); color:#ff4757; border:2px solid #ff4757; }
  .risk-badge.high     { background:rgba(255,107,53,.12); color:#ff6b35; border:2px solid #ff6b35; }
  .risk-badge.medium   { background:rgba(255,165,2,.12);  color:#ffa502; border:2px solid #ffa502; }
  .risk-badge.low      { background:rgba(46,213,115,.12); color:#2ed573; border:2px solid #2ed573; }
  .page { padding:56px 80px; max-width:980px; margin:0 auto; }
  .section-hdr { display:flex; align-items:center; gap:12px; margin:40px 0 20px; border-bottom:1px solid #30363d; padding-bottom:12px; }
  .section-num { background:linear-gradient(135deg,#58a6ff,#bc8cff); color:#fff; width:30px; height:30px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; flex-shrink:0; }
  .section-title { font-size:22px; font-weight:700; }
  .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; }
  .stat-card { background:#161b22; border:1px solid #30363d; border-radius:10px; padding:18px; text-align:center; }
  .stat-num { font-size:34px; font-weight:800; line-height:1; margin-bottom:4px; }
  .stat-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8b949e; }
  .stat-card.crit .stat-num { color:#ff4757; }
  .stat-card.high .stat-num { color:#ff6b35; }
  .stat-card.med  .stat-num { color:#ffa502; }
  .stat-card.low  .stat-num { color:#2ed573; }
  .summary-box { background:#161b22; border:1px solid #30363d; border-left:4px solid #58a6ff; border-radius:10px; padding:26px 30px; margin-bottom:40px; line-height:1.9; font-size:14.5px; }
  table.findings { width:100%; border-collapse:collapse; font-size:13px; margin-bottom:40px; }
  table.findings th { background:#1c2128; color:#8b949e; font-weight:600; font-size:10px; letter-spacing:1px; text-transform:uppercase; padding:12px 14px; text-align:left; border-bottom:2px solid #58a6ff; }
  table.findings td { padding:12px 14px; border-bottom:1px solid #30363d; color:#e6edf3; }
  table.findings tr:nth-child(even) td { background:#0f1419; }
  .sev-pill { font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:3px 10px; border-radius:12px; }
  .sev-pill.critical { background:rgba(255,71,87,.12); color:#ff4757; border:1px solid #ff4757; }
  .sev-pill.high     { background:rgba(255,107,53,.12); color:#ff6b35; border:1px solid #ff6b35; }
  .sev-pill.medium   { background:rgba(255,165,2,.12);  color:#ffa502; border:1px solid #ffa502; }
  .sev-pill.low      { background:rgba(46,213,115,.12); color:#2ed573; border:1px solid #2ed573; }
  .cve-tag { font-family:monospace; font-size:11px; color:#bc8cff; background:rgba(188,140,255,.1); border:1px solid rgba(188,140,255,.25); padding:3px 8px; border-radius:5px; }
  .cvss-tag { font-family:monospace; font-size:11px; font-weight:700; padding:3px 8px; border-radius:5px; }
  .cvss-critical { background:rgba(255,71,87,.12); color:#ff4757; border:1px solid #ff4757; }
  .cvss-high   { background:rgba(255,107,53,.12); color:#ff6b35; border:1px solid #ff6b35; }
  .cvss-medium { background:rgba(255,165,2,.12);  color:#ffa502; border:1px solid #ffa502; }
  .cvss-low    { background:rgba(46,213,115,.12); color:#2ed573; border:1px solid #2ed573; }
  .vuln-card { background:#161b22; border-radius:14px; margin-bottom:36px; overflow:hidden; }
  .vuln-hdr { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; }
  .vuln-idx { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; color:#fff; margin-right:12px; flex-shrink:0; }
  .vuln-title { font-size:16px; font-weight:700; }
  .vuln-badges { display:flex; align-items:center; gap:10px; flex-shrink:0; }
  .vuln-body { padding:24px; }
  .field-label { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#8b949e; margin:18px 0 8px; display:flex; align-items:center; gap:6px; }
  .code-block { background:#0d1117; border:1px solid #30363d; border-left:3px solid #db6d28; border-radius:7px; padding:14px 18px; font-family:monospace; font-size:12.5px; color:#a8d8a8; white-space:pre-wrap; word-break:break-all; line-height:1.7; }
  .evidence-box { background:#050d14; border:1px solid rgba(88,166,255,.2); border-left:3px solid #58a6ff; border-radius:7px; padding:14px 18px; font-family:monospace; font-size:12.5px; color:#7ec8e3; white-space:pre-wrap; word-break:break-all; line-height:1.7; }
  .fix-box { background:rgba(46,213,115,.06); border:1px solid rgba(46,213,115,.2); border-left:3px solid #3fb950; border-radius:7px; padding:16px 20px; line-height:1.9; font-size:14px; }
  .report-body { background:#161b22; border:1px solid #30363d; border-radius:10px; padding:32px 36px; line-height:2; font-size:14.5px; white-space:pre-wrap; margin-bottom:40px; }
  .footer { text-align:center; padding:28px; border-top:1px solid #30363d; color:#8b949e; font-size:12px; }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-badge">Confidential Security Assessment</div>
  <h1>Penetration Testing Report</h1>
  <p style="color:#8b949e;font-size:18px;font-weight:300;">Comprehensive Vulnerability Assessment &amp; Findings</p>
  <div class="meta-grid">
    <div class="meta-card"><div class="meta-label">Target</div><div class="meta-value">{{ target }}</div></div>
    <div class="meta-card"><div class="meta-label">Date</div><div class="meta-value">{{ date }}</div></div>
    <div class="meta-card"><div class="meta-label">Findings</div><div class="meta-value">{{ vulnerabilities|length }} vulns</div></div>
  </div>
  <div class="risk-badge {{ overall_risk|lower }}">⚠ Overall Risk: {{ overall_risk }}</div>
</div>

<div class="page">
  <div class="section-hdr"><div class="section-num">1</div><div class="section-title">Executive Summary</div></div>
  <div class="stats-grid">
    <div class="stat-card crit"><div class="stat-num">{{ counts.critical }}</div><div class="stat-label">Critical</div></div>
    <div class="stat-card high"><div class="stat-num">{{ counts.high }}</div><div class="stat-label">High</div></div>
    <div class="stat-card med"><div class="stat-num">{{ counts.medium }}</div><div class="stat-label">Medium</div></div>
    <div class="stat-card low"><div class="stat-num">{{ counts.low }}</div><div class="stat-label">Low / Info</div></div>
  </div>
  <div class="summary-box">{{ report | replace('\n', '<br/>') }}</div>

  <div class="section-hdr"><div class="section-num">2</div><div class="section-title">Vulnerability Summary</div></div>
  <table class="findings">
    <thead><tr><th>#</th><th>Vulnerability</th><th>Severity</th><th>CVE</th><th>CVSS</th></tr></thead>
    <tbody>
    {% for v in vulnerabilities %}
    {% set score = v.cvss | float(default=0) %}
    <tr>
      <td>{{ loop.index }}</td>
      <td>{{ v.title }}</td>
      <td><span class="sev-pill {{ v.severity|lower }}">{{ v.severity }}</span></td>
      <td>{% if v.cve and v.cve != 'N/A' %}<span class="cve-tag">{{ v.cve }}</span>{% else %}—{% endif %}</td>
      <td>
        {% if score >= 9.0 %}<span class="cvss-tag cvss-critical">{{ v.cvss }}</span>
        {% elif score >= 7.0 %}<span class="cvss-tag cvss-high">{{ v.cvss }}</span>
        {% elif score >= 4.0 %}<span class="cvss-tag cvss-medium">{{ v.cvss }}</span>
        {% else %}<span class="cvss-tag cvss-low">{{ v.cvss }}</span>{% endif %}
      </td>
    </tr>
    {% endfor %}
    </tbody>
  </table>

  <div class="section-hdr"><div class="section-num">3</div><div class="section-title">Detailed Findings</div></div>
  {% for v in vulnerabilities %}
  {% set sev = v.severity|lower %}
  {% if sev=='critical' %}{% set c='#ff4757' %}{% set cbg='rgba(255,71,87,.1)' %}
  {% elif sev=='high' %}{% set c='#ff6b35' %}{% set cbg='rgba(255,107,53,.1)' %}
  {% elif sev=='medium' %}{% set c='#ffa502' %}{% set cbg='rgba(255,165,2,.1)' %}
  {% else %}{% set c='#2ed573' %}{% set cbg='rgba(46,213,115,.1)' %}{% endif %}
  <div class="vuln-card" style="border:1.5px solid {{ c }}40;">
    <div class="vuln-hdr" style="background:{{ cbg }};border-bottom:1px solid {{ c }}40;">
      <div style="display:flex;align-items:center;">
        <div class="vuln-idx" style="background:{{ c }};">{{ loop.index }}</div>
        <div>
          <div class="vuln-title">{{ v.title }}</div>
          <div style="margin-top:4px;"><span class="sev-pill {{ sev }}">{{ v.severity }}</span></div>
        </div>
      </div>
      <div class="vuln-badges">
        {% if v.cve and v.cve != 'N/A' %}<span class="cve-tag">{{ v.cve }}</span>{% endif %}
        {% set s = v.cvss|float(default=0) %}
        {% if s>=9.0 %}<span class="cvss-tag cvss-critical">CVSS {{ v.cvss }}</span>
        {% elif s>=7.0 %}<span class="cvss-tag cvss-high">CVSS {{ v.cvss }}</span>
        {% elif s>=4.0 %}<span class="cvss-tag cvss-medium">CVSS {{ v.cvss }}</span>
        {% else %}<span class="cvss-tag cvss-low">CVSS {{ v.cvss }}</span>{% endif %}
      </div>
    </div>
    <div class="vuln-body">
      <div class="field-label">📋 Description</div>
      <p>{{ v.description }}</p>
      <div class="field-label" style="color:#db6d28;">🔥 Proof of Concept</div>
      <div class="code-block">{{ v.proof_of_concept }}</div>
      <div class="field-label" style="color:#58a6ff;">🔬 Proof of Work / Evidence</div>
      <div class="evidence-box">{{ v.proof_of_work }}</div>
      <div class="field-label" style="color:#3fb950;">🛠 How to Fix</div>
      <div class="fix-box">{{ v.how_to_fix | replace('\n', '<br/>') }}</div>
    </div>
  </div>
  {% endfor %}

  <div class="section-hdr"><div class="section-num">4</div><div class="section-title">Full Penetration Testing Report</div></div>
  <div class="report-body">{{ full_report }}</div>
</div>

<div class="footer">Generated by Hacker.AI &nbsp;|&nbsp; {{ date }} &nbsp;|&nbsp; Confidential — For Authorized Use Only</div>
</body>
</html>"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def generate_report(
    target: str,
    report: str,
    vulnerabilities: list[dict],
    full_report: Optional[str] = None,
) -> tuple[str, bytes]:
    """
    Generate an HTML report and a PDF.

    Parameters
    ----------
    target          : Target host / IP / URL
    report          : Executive summary (multi-paragraph string)
    vulnerabilities : List of vuln dicts with keys:
                        title, severity, cve, cvss,
                        description, proof_of_concept, proof_of_work, how_to_fix
    full_report     : Optional extended narrative (falls back to `report`)

    Returns
    -------
    (html_str, pdf_bytes)
    """
    overall_risk, counts = _compute_risk(vulnerabilities)

    # Normalise each vuln dict
    safe_vulns = []
    for v in vulnerabilities:
        safe_vulns.append({
            "title":            v.get("title",            "Unnamed Vulnerability"),
            "severity":         v.get("severity",         "Low"),
            "cve":              v.get("cve",              "N/A"),
            "cvss":             v.get("cvss",             "0.0"),
            "description":      v.get("description",      "No description provided."),
            "proof_of_concept": v.get("proof_of_concept", "No PoC provided."),
            "proof_of_work":    v.get("proof_of_work",    "No evidence provided."),
            "how_to_fix":       v.get("how_to_fix",       "No remediation steps provided."),
        })

    fr = full_report or report
    date_str = datetime.datetime.now().strftime("%B %d, %Y")

    # ------ HTML ------
    env = Environment(loader=BaseLoader())
    template = env.from_string(_HTML_TEMPLATE)
    html_str = template.render(
        target=target or "Unknown Target",
        date=date_str,
        report=report,
        full_report=fr,
        vulnerabilities=safe_vulns,
        overall_risk=overall_risk,
        counts=counts,
    )

    # ------ PDF via ReportLab ------
    pdf_bytes = _build_pdf(
        target=target or "Unknown Target",
        report=report,
        vulnerabilities=safe_vulns,
        full_report=fr,
    )

    return html_str, pdf_bytes


def generate_report_base64(
    target: str,
    report: str,
    vulnerabilities: list[dict],
    full_report: Optional[str] = None,
) -> tuple[str, str]:
    """Same as generate_report but returns (html_str, pdf_base64_str)."""
    html_str, pdf_bytes = generate_report(target, report, vulnerabilities, full_report)
    return html_str, base64.b64encode(pdf_bytes).decode("utf-8")
