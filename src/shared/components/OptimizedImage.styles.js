import styled, { css, keyframes } from "styled-components";
import { devicesMax } from "../styles/breakpoint";

const imageFadeIn = keyframes`
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
`;

export const ImageWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio || "1 / 1"};
  overflow: hidden;
  background-color: ${({ $bg }) => $bg || "var(--color-grey-100, #f8f9fa)"};
  border-radius: ${({ $radius }) => $radius || "var(--border-radius-md, 0.75rem)"};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &.image-hover:hover img {
    transform: scale(1.05);
  }
`;

export const StyledImage = styled.img`
  width: 100% !important;
  height: 100% !important;
  object-fit: ${({ $objectFit }) => $objectFit || "contain"} !important;
  object-position: center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${({ $loaded }) => ($loaded ? 1 : 0)};
  animation: ${({ $loaded }) => ($loaded ? css`${imageFadeIn} 0.4s ease-out` : "none")};
`;

export const Skeleton = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    var(--color-grey-100, #f3f4f6) 0%,
    var(--color-grey-200, #e5e7eb) 50%,
    var(--color-grey-100, #f3f4f6) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
