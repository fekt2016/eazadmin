import styled, { keyframes } from "styled-components";

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const SpinnerWrapper = styled.div`
  display:         flex;
  align-items:     center;
  justify-content: center;
  height:          100vh;
  width:           100%;
`;

const Spinner = styled.div`
  width:        40px;
  height:       40px;
  border:       3px solid #F0F0F0;
  border-top:   3px solid #FF6B35;
  border-radius:50%;
  animation:    ${spin} 0.8s linear infinite;
`;

const PageSpinner = () => (
    <SpinnerWrapper>
        <Spinner />
    </SpinnerWrapper>
);

export default PageSpinner;
