import "server-only";
import fs from "fs";
import path from "path";
import { Font } from "@react-pdf/renderer";
import { PDF_FONT_FAMILY } from "./fontFamily";

/**
 * Register Thai fonts for @react-pdf/renderer (server-side only).
 *
 * Font files: public/fonts/
 *   - THSarabunNew.ttf           (weight 400, normal)
 *   - THSarabunNewBold.ttf       (weight 700, normal)
 *   - THSarabunNewItalic.ttf     (weight 400, italic)
 *   - THSarabunNewBoldItalic.ttf (weight 700, italic)
 */
let registered = false;

export { PDF_FONT_FAMILY };

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  const fontsDir = path.join(process.cwd(), "public", "fonts");

  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      { src: path.join(fontsDir, "THSarabunNew.ttf"), fontWeight: 400, fontStyle: "normal" },
      { src: path.join(fontsDir, "THSarabunNewBold.ttf"), fontWeight: 700, fontStyle: "normal" },
      { src: path.join(fontsDir, "THSarabunNewItalic.ttf"), fontWeight: 400, fontStyle: "italic" },
      {
        src: path.join(fontsDir, "THSarabunNewBoldItalic.ttf"),
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });

  /**
   * Thai has no hyphenation, and Thai sentences have no spaces between
   * words — @react-pdf/renderer's line-breaker only splits "words" on
   * literal ASCII spaces, so an entire unbroken Thai sentence arrives here
   * as a single chunk. Previously this split it by *code point*
   * (`Array.from(word)`), which let lines wrap but broke words apart at
   * arbitrary characters (e.g. "ดำเนินงา" / "นด้าน") and even inserted a
   * visible "-" at the break.
   *
   * The real text now has zero-width spaces (U+200B) already injected at
   * proper Thai word boundaries via `insertThaiWordBreaks()` (see
   * `src/lib/thai.ts`), applied before the text reaches `<Text>`. So here
   * we only need to split each chunk on that marker — this yields
   * word-sized pieces (not single characters), which the line-breaker can
   * wrap between cleanly with no visible hyphen.
   *
   * Text that was NOT pre-processed with `insertThaiWordBreaks()` (no
   * U+200B present) is left as a single unsplittable unit — the same as
   * @react-pdf/renderer's own default (no arbitrary character splitting).
   */
  Font.registerHyphenationCallback((word) =>
    word.includes("\u200B") ? word.split("\u200B") : [word],
  );
}

export function garudaImagePath() {
  return path.join(process.cwd(), "public", "krut.png");
}

let garudaBuffer: Buffer | undefined;

/**
 * Read the Garuda emblem into a Buffer for use as `<Image src={...}>`.
 *
 * IMPORTANT: passing an absolute filesystem path *string* to `<Image src>`
 * is unreliable during server-side `renderToBuffer()` on Windows: the
 * `@react-pdf/image` resolver runs the string through Node's legacy
 * `url.parse()`, which misreads a Windows drive letter (e.g. `D:\...`) as a
 * URL *protocol* ("d:"), so the path is rejected and the image silently
 * fails to load (blank logo). Passing a `Buffer` instead skips URL/path
 * parsing entirely — `resolveImage()` checks `Buffer.isBuffer(src)` first —
 * so it works identically on Windows, macOS, and Linux.
 */
export function getGarudaImageBuffer(): Buffer {
  if (!garudaBuffer) {
    garudaBuffer = fs.readFileSync(garudaImagePath());
  }
  return garudaBuffer;
}
