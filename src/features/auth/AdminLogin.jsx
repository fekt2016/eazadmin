import { useState } from "react";
// import { useLogin } from '../../shared/hooks/useAuth';
// import { PropagateLoader } from "react-spinners";

import useAuth from '../../shared/hooks/useAuth';
import { useNavigate } from "react-router-dom";

// import { useNavigate } from "react-router-dom";
export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [state, setState] = useState({
    email: "fekt34@icloud.com",
    password: "12345678",
  });
  const [showPassword, setShowPassword] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!state.email || !state.password) {
      return;
    }
    const response = await login.mutateAsync(state);
    
    // SECURITY: Token is in HTTP-only cookie, NOT in response
    // Backend sets cookie automatically - no token storage needed
    // Only store non-sensitive role preference
    if (typeof window !== "undefined") {
      localStorage.setItem("current_role", "admin");
    }

    navigate("/dashboard");
  };

  return (
    <div>
      <div>
        <div>
          <h2>Admin Login</h2>
        </div>

        {/* {loginError && (
          <div>{loginError.response?.data?.message || "Login failed"}</div>
        )} */}

        <form onSubmit={submitHandler}>
          <div>
            <div>
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                value={state.email}
                onChange={(e) => setState({ ...state, email: e.target.value })}
              />
            </div>

            <div className="relative">
              <label htmlFor="password">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                autoComplete="current-password"
                required
                value={state.password}
                onChange={(e) =>
                  setState({ ...state, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            {/* <button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <PropagateLoader
                  color="#ffffff"
                  cssOverride={loaderOverride}
                  size={10}
                />
              ) : (
                "Sign in"
              )}
            </button> */}
            <button type="submit">login</button>
          </div>
        </form>
      </div>
    </div>
  );
}
