"""Copies the shared game art into every concept board so each HTML file works on its own.

The source of truth is game/src/art/art.js (characters, towers, scenery) and
game/src/art/ui-art.js (buttons, panels, ribbons, icons).
Usage: python3 docs/style-boards/build.py   (run after editing either file)
"""
import pathlib
import re

here = pathlib.Path(__file__).parent
art_dir = here.parent.parent / 'game' / 'src' / 'art'
blocks = {
    'ART': (art_dir / 'art.js').read_text(),
    'UI': (art_dir / 'ui-art.js').read_text(),
}
for page in sorted(here.glob('*.html')):
    text = page.read_text()
    changed = False
    for tag, lib in blocks.items():
        pattern = re.compile(r'/\* ' + tag + r'-START.*?\*/\n.*?/\* ' + tag + r'-END \*/\n', re.S)
        if pattern.search(text):
            head = f'/* {tag}-START: generated from game/src/art by build.py, edit there instead */\n'
            text = pattern.sub(lambda m: head + lib + f'/* {tag}-END */\n', text)
            changed = True
    if changed:
        page.write_text(text)
        print('updated', page.name)
