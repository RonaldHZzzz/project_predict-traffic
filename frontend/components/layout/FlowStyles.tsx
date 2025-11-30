"use client";

// Inyección de estilos para la animación de flujo (Flow Animation)
export const FlowStyles = () => (
  <style jsx global>{`
    @keyframes flow-stripe {
      0% {
        background-position: 0 0;
      }
      100% {
        background-position: 30px 0;
      }
    }
    .animate-flow {
      background-size: 30px 30px;
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
      );
      animation: flow-stripe 1s linear infinite;
    }
  `}</style>
);