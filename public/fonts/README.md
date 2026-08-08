# Thai fonts for @react-pdf/renderer

Place TTF files here. The PDF exporters register them via `Font.register()`
in `src/components/documents/pdf/registerFonts.ts`.

## Required files (already wired in code)

| File | Weight | Style |
| --- | --- | --- |
| `THSarabunNew.ttf` | 400 (normal) | normal |
| `THSarabunNewBold.ttf` | 700 (bold) | normal |
| `THSarabunNewItalic.ttf` | 400 (normal) | italic |
| `THSarabunNewBoldItalic.ttf` | 700 (bold) | italic |

The font family name registered for PDFs is `THSarabunNew`
(see `src/components/documents/pdf/fontFamily.ts`). This is independent of
the `Sarabun` Google Font loaded via `next/font/google` in
`src/app/layout.tsx`, which is only used for the on-screen HTML preview.

Without these `.ttf` files, Thai characters will not render in the PDF.
