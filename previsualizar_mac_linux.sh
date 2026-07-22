#!/bin/sh
cd "$(dirname "$0")" || exit 1

if command -v python3 >/dev/null 2>&1; then
  echo "Abra http://127.0.0.1:8000"
  python3 -m http.server 8000
elif command -v python >/dev/null 2>&1; then
  echo "Abra http://127.0.0.1:8000"
  python -m http.server 8000
else
  echo "Python não encontrado. Utilize Live Server no VS Code."
  exit 1
fi
