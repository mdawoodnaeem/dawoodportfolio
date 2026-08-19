/**
 * BACKDROP MOODS
 *
 * One entry per section, in scroll order. The living backdrop
 * (components/three/Backdrop.tsx) cross-fades between consecutive entries as
 * you scroll, so each section gets its own atmosphere without a visible cut.
 *
 * Each mood is:
 *   selector  — the element whose top edge marks the start of this mood
 *   mode      — which field the shader draws (see FRAG `field()`)
 *                 0 aurora · 1 ripple · 2 lattice · 3 strands · 4 orbs
 *   intensity — how loudly it plays. Sections dense with small text get less.
 *   ink/paper — [shadow, mid, lightA, lightB] ramp, designed per theme
 *               rather than
 *               tinted from one palette. The shadow and mid stops sit
 *               almost on the page colour on purpose: only the light stop
 *               The two light stops are the section's colour pair: the
 *               thread slides between them across the frame, so each
 *               section has a combination rather than a single tint. Only
 *               those two stops carry hue, so the field reads as threads
 *               rather than as a coloured wash behind the whole page.
 *
 * The threads run cool almost everywhere. Warm threads on a black page read
 * as fire at any intensity strong enough to notice, and the ember accent is
 * already doing its work on the interface. The playground is the deliberate
 * exception: there the glow is lighting a cluster of glass, and it should.
 *
 * Rule of thumb when editing: the light stop is the only place a saturated
 * colour belongs, and it should never exceed the accent's own chroma or the
 * backdrop starts competing with the type.
 */

export type Mood = {
  selector: string;
  mode: 0 | 1 | 2 | 3 | 4;
  intensity: number;
  ink: [string, string, string, string];
  paper: [string, string, string, string];
};

export const BACKDROPS: Mood[] = [
  {
    // Hero — cool steel threads. The strongest field on the page, but the
    // ember stays on the interface where it belongs.
    selector: "#top",
    mode: 0,
    intensity: 0.34,
    ink: ["#07080b", "#100c10", "#6f88ac", "#c76a45"],
    paper: ["#efece4", "#eae5dc", "#7b8ea8", "#c07a55"],
  },
  {
    // Manifesto — violet, a deliberate temperature drop after the fold.
    selector: "#manifesto",
    mode: 3,
    intensity: 0.3,
    ink: ["#07080b", "#0c0e16", "#7a84c4", "#5fb3b0"],
    paper: ["#eeece6", "#e6e5ea", "#7982b4", "#5aa3a0"],
  },
  {
    // About — the one warm field, close and skin-adjacent. The portrait
    // lands here, so the light around it should match it.
    selector: "#about",
    mode: 4,
    intensity: 0.3,
    ink: ["#07080b", "#100d0c", "#a08d80", "#c8763f"],
    paper: ["#efece4", "#eae4da", "#a08a76", "#bd7040"],
  },
  {
    // Work — near-black with a machined teal edge, so the diagrams read.
    selector: "#work",
    mode: 2,
    intensity: 0.24,
    ink: ["#06070a", "#0a1011", "#5aa39a", "#5f7fb8"],
    paper: ["#eceae4", "#e4e7e4", "#569c93", "#5b78ab"],
  },
  {
    // Capabilities — quiet. A list of small text needs a calm ground.
    selector: "#capabilities",
    mode: 1,
    intensity: 0.22,
    ink: ["#07080b", "#100d14", "#8d86bd", "#c07a9a"],
    paper: ["#eeece6", "#e6e3e7", "#8a80b2", "#b0728c"],
  },
  {
    // Pricing — cool and clean. Numbers should not sit in a warm haze.
    selector: "#pricing",
    mode: 2,
    intensity: 0.22,
    ink: ["#07080b", "#0b0f14", "#6d8fbd", "#63b39c"],
    paper: ["#eceae5", "#e4e5ea", "#6a8ab4", "#5da892"],
  },
  {
    // Questions — the calmest field on the page; this is reading, not looking.
    selector: "#questions",
    mode: 0,
    intensity: 0.2,
    ink: ["#07080b", "#0c0f0e", "#6ea08a", "#93a86a"],
    paper: ["#eeece6", "#e5e8e3", "#679a82", "#8a9c63"],
  },
  {
    // Playground — the deliberate exception: full ember, because here the
    // glow is genuinely lighting a cluster of glass from behind.
    selector: "#playground",
    mode: 4,
    intensity: 0.55,
    ink: ["#07080b", "#150e0c", "#ff8a4d", "#a367ff"],
    paper: ["#efeae2", "#ece3d8", "#e07a44", "#9463d8"],
  },
  {
    // Contact — settles back so the closing type is the subject.
    selector: "#contact",
    mode: 3,
    intensity: 0.3,
    ink: ["#06070a", "#0e0b11", "#8a7fa8", "#c2704a"],
    paper: ["#eeebe3", "#e7e3da", "#83779e", "#b06844"],
  },
];
