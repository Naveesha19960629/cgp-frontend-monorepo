// fontkit ships no types and there's no @types/fontkit package. This must
// live in its own script-context file (no top-level import/export) — a
// `declare module 'fontkit'` inside a module file is treated as augmenting
// an already-resolved-but-untyped module (TS2665), which TypeScript
// rejects; only a genuine ambient/global file can shadow it with `any`.
declare module 'fontkit';
