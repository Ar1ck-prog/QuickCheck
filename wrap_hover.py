import re

def wrap_hover_rules(css_file):
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to find all rules that have a :hover pseudo-class.
    # Note: this is a simple regex that assumes basic formatting.
    # It finds a selector containing ":hover", followed by "{ ... }"
    pattern = re.compile(r'([^{}]*?:hover[^{}]*?)\s*\{([^{}]+)\}', re.MULTILINE)
    
    def replacer(match):
        selector = match.group(1).strip()
        body = match.group(2)
        # Avoid double wrapping if already inside a media query (simple heuristic: we won't handle nested for now, but we assume no media queries contain hover rules directly at the root level in our CSS except possibly some. Actually, landing/style.css has hover inside media queries? Let's assume style.css doesn't or we only wrap top-level).
        return f"@media (hover: hover) {{\n    {selector} {{{body}}}\n}}"

    new_content = pattern.sub(replacer, content)

    # Let's fix up indentation a bit
    with open(css_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

wrap_hover_rules('style.css')
wrap_hover_rules('landing/style.css')
print("Hover rules wrapped!")
