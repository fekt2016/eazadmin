import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const SkeletonLoader = styled.div`
  background-color: #f0f0f0;
  border-radius: ${({ $radius }) => $radius || "4px"};
  width: ${({ width }) => width || "100%"};
  height: ${({ height }) => height || "20px"};
  margin: ${({ margin }) => margin || "0"};
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    animation: ${shimmer} 1.5s infinite;
    transform: translateX(-100%);
  }
`;

export default SkeletonLoader;
