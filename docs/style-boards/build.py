"""Copies art.js into every concept board so each HTML file works on its own.

Usage: python3 build.py   (run after editing art.js)
"""
import pathlib
import re

here = pathlib.Path(__file__).parent
lib = (here / 'art.js').read_text()
block = re.compile(r'/\* ART-START.*?\*/\n.*?/\* ART-END \*/\n', re.S)
for page in sorted(here.glob('*.html')):
    text = page.read_text()
    if 'ART-START' not in text:
        continue
    head = '/* ART-START: generated from art.js by build.py, edit art.js instead */\n'
    page.write_text(block.sub(lambda m: head + lib + '/* ART-END */\n', text))
    print('updated', page.name)
