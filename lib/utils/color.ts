function luminance(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** contrast ratio ระหว่างสีหลักกับตัวหนังสือสีขาว (WCAG AA ≥ 4.5) */
export function whiteTextContrast(hex: string) {
  return 1.05 / (luminance(hex) + 0.05);
}
