import os
import mistune
from weasyprint import HTML, CSS

_CSS_PATH = os.path.join(os.path.dirname(__file__), "../../static/resume_template.css")


def markdown_to_pdf(content_md: str) -> bytes:
    html_body = mistune.html(content_md)
    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body>{html_body}</body>
</html>"""
    css_path = os.path.abspath(_CSS_PATH)
    stylesheets = [CSS(filename=css_path)] if os.path.exists(css_path) else []
    return HTML(string=full_html).write_pdf(stylesheets=stylesheets)
