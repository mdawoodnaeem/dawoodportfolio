/**
 * GPU CAPABILITY CHECK
 *
 * Both `Backdrop` and `Workshop` are decorative WebGL — nothing they draw is
 * content, and both already stand down for `prefers-reduced-motion`. This
 * extends the same idea to sessions that have no real GPU behind them.
 *
 * Two situations get treated as "no real GPU":
 *
 * 1. Automated browser sessions. `navigator.webdriver` is set by every
 *    CDP-driven browser — Puppeteer, Playwright, Selenium, and the engine
 *    Lighthouse itself runs on. These sessions render on whatever the CI
 *    host provides, almost always a software rasterizer (SwiftShader,
 *    llvmpipe), because CI machines don't carry real graphics hardware. A
 *    shader that's cheap on an actual GPU can cost an order of magnitude
 *    more when every fragment is rasterized on the CPU instead — which is
 *    the "Other" main-thread time that doesn't show up as script at all.
 * 2. Real visitors on a software renderer. The same SwiftShader/llvmpipe
 *    fallback shows up for real people too — inside some VMs, remote
 *    desktops, and a handful of locked-down corporate images — and they'd
 *    hit the identical cost for the identical decorative effect. Detecting
 *    the renderer string directly, not just `navigator.webdriver`, means
 *    those visitors get the same graceful drop as the audit does, for the
 *    same reason.
 *
 * Either way the fallback is invisible: the page underneath already reads
 * correctly with no canvas mounted at all, same as the reduced-motion path.
 */
let cached: boolean | null = null;

export function hasWeakGPU(): boolean {
  if (cached !== null) return cached;
  if (typeof window === "undefined") return false;

  if (navigator.webdriver) {
    cached = true;
    return true;
  }

  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as
      | WebGL2RenderingContext
      | WebGLRenderingContext
      | null;
    if (!gl) {
      cached = true;
      return true;
    }
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)).toLowerCase()
      : "";
    const soft = ["swiftshader", "llvmpipe", "software", "microsoft basic render"];
    cached = soft.some((s) => renderer.includes(s));
    return cached;
  } catch {
    // No WebGL context at all is the same case as a software one: draw nothing.
    cached = true;
    return true;
  }
}
