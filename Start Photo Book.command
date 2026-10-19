#!/bin/zsh
set -e
cd -- "${0:A:h}"
if [[ ! -x saiphotobook.env/bin/python ]]; then
  python3 -m venv --prompt saiphotobook.env saiphotobook.env
fi
if ! saiphotobook.env/bin/python -c "import PIL, pillow_heif" >/dev/null 2>&1; then
  saiphotobook.env/bin/python -m pip install -r requirements.txt
fi
exec saiphotobook.env/bin/python -B serve.py
