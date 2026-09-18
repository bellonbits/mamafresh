#!/bin/bash
# Copies a file from the Next.js app into this Vite app, applying the common
# next/* -> next-compat swaps. Usage: port.sh <src-relative-to-repo-root> <dest-relative-to-mobile-app/src>
set -e
SRC="/Users/mac/mamafresh/$1"
DEST="/Users/mac/mamafresh/mobile-app/src/$2"
mkdir -p "$(dirname "$DEST")"
sed \
  -e '/^"use client";$/d' \
  -e 's#from "next/image"#from "@/lib/next-compat/image"#' \
  -e 's#from "next/link"#from "@/lib/next-compat/link"#' \
  -e 's#from "next/navigation"#from "@/lib/next-compat/navigation"#' \
  "$SRC" > "$DEST"
echo "ported: $1 -> $2"
