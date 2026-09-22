import { useEffect, useRef } from "react";
import "../components/CustomCursor.css";

// Elementos que contam como "clicáveis" pra ativar o efeito de hover do cursor
const INTERACTIVE_SELECTOR =
  "a, button, input, textarea, select, [role='button'], .sidebar li, li[title]";

function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    // Em telas de toque (celular/tablet) não faz sentido ter cursor customizado
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const dot = dotRef.current;
    const ring = ringRef.current;

    document.body.classList.add("custom-cursor-active");

    // Posição alvo (onde o mouse está) e posição atual do anel (com suavização)
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...target };

    const handleMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      // o ponto acompanha o mouse instantaneamente
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
    };

    const handleOver = (e) => {
      if (e.target.closest(INTERACTIVE_SELECTOR)) {
        ring.classList.add("cursor-hover");
      }
    };

    const handleOut = (e) => {
      if (e.target.closest(INTERACTIVE_SELECTOR)) {
        ring.classList.remove("cursor-hover");
      }
    };

    const handleDown = () => ring.classList.add("cursor-active");
    const handleUp = () => ring.classList.remove("cursor-active");

    // Anel com leve atraso (efeito "elástico"), atualizado a cada frame
    let frameId;
    const animateRing = () => {
      ringPos.x += (target.x - ringPos.x) * 0.18;
      ringPos.y += (target.y - ringPos.y) * 0.18;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;
      frameId = requestAnimationFrame(animateRing);
    };
    frameId = requestAnimationFrame(animateRing);

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      document.body.classList.remove("custom-cursor-active");
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

export default CustomCursor;