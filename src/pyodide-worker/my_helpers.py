import re
from itertools import groupby
import tempfile
import textwrap
from typing import List, Tuple, Literal

BlockType = Literal["bitbake", "inline_python"]
Block = Tuple[BlockType, str]

INLINE_PYTHON_LINE_RE = re.compile(r"^\s*#@py\b(?P<content>.*)$", re.DOTALL)


def segment_code(script: str) -> List[Block]:
    lines = script.splitlines(keepends=True)

    # Categorize each line
    annotated_lines: List[Tuple[BlockType, str]] = []
    for line in lines:
        m = INLINE_PYTHON_LINE_RE.match(line)
        if m:
            annotated_lines.append(("inline_python", m.group("content")))
        else:
            annotated_lines.append(("bitbake", line))
    
    # Group lines into blocks, and dedent text in the case of inline Python
    blocks: List[Block] = []

    for block_type, group in groupby(annotated_lines, key=lambda d: d[0]):
        text = "".join(item[1] for item in group)
        if block_type == "inline_python":
            text = textwrap.dedent(text)
        blocks.append((block_type, text))


    return blocks


def parsehelper(content, suffix = ".bb"):
    f = tempfile.NamedTemporaryFile(suffix = suffix)
    f.write(bytes(content, "utf-8"))
    f.flush()
    # os.chdir(os.path.dirname(f.name))
    return f
