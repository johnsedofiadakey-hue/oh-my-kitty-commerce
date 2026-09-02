const symbols = ["♥", "✦", "♥", "✧"];

/**
 * Fires a small burst of hearts/sparkles from the given element — the visual
 * payoff for "I just added something to my cart." Dynamically imports GSAP
 * so it doesn't add to every page's initial bundle, and no-ops entirely
 * under reduced-motion.
 */
export async function celebrateBurst(origin: HTMLElement) {
  if (typeof window === "undefined") {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const { gsap } = await import("gsap");
  const rect = origin.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const count = 7;

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement("span");
    particle.className = "celebrate-particle";
    particle.textContent = symbols[index % symbols.length] ?? "♥";
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.color = index % 2 === 0 ? "var(--color-peach)" : "var(--color-green)";
    document.body.appendChild(particle);

    const angle = (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.6;
    const distance = 44 + Math.random() * 30;

    gsap.fromTo(
      particle,
      { x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 },
      {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 14,
        opacity: 0,
        scale: 1,
        rotate: (Math.random() - 0.5) * 90,
        duration: 0.65 + Math.random() * 0.25,
        ease: "power2.out",
        onComplete: () => particle.remove()
      }
    );
  }
}
