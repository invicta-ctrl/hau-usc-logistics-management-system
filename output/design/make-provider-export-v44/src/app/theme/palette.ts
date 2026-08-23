export function ap(dark: boolean) {
  return {
    bg:     dark ? "#1c1917" : "#fffdf8",   // canvas
    m1:     dark ? "#242120" : "#ffffff",   // table rows / cards
    m2:     dark ? "#2d2927" : "#f7f0e2",   // chrome / muted areas
    border: dark ? "rgba(250,249,247,0.10)" : "#e6dcc9",
    text:   dark ? "#faf9f7" : "#241416",
    muted:  dark ? "rgba(250,249,247,0.46)" : "#6f5a60",
    skel:   dark ? "#2d2927" : "#e6dcc9",
  } as const;
}
