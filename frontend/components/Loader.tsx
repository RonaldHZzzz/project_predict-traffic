"use client";
import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <Centered>
      <span className="loader" />
    </Centered>
  );
};

const Centered = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  
  display: flex;
  align-items: center;
  justify-content: center;

  background: transparent !important;   /* 🔥 clave para que NO ponga fondo */
  
  .loader {
    border: 5px solid #fff;
    border-radius: 30px;
    height: 30px;
    width: 30px;
    opacity: 0;
    position: relative;
    animation: pulsate 1s ease-out infinite;
  }

  @keyframes pulsate {
    0% {
      transform: scale(.1);
      opacity: 0.0;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }
`;

export default Loader;
