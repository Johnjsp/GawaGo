import React from "react";

export default function HomeView({
  dashboardMetrics,
  initialShowLogin = false,
  loginForm,
  onLoginChange,
  onLoginSubmit,
  onOpenForgotPassword,
  onOpenHouseholdRegister,
  onOpenWorkerRegister,
}) {
  const [showLogin, setShowLogin] = React.useState(initialShowLogin);
  const [authMode, setAuthMode] = React.useState("login");
  const [selectedAuthRole, setSelectedAuthRole] = React.useState(null);

  const selectLoginRole = (role) => {
    onLoginChange({
      target: {
        name: "role",
        value: role,
      },
    });
    setSelectedAuthRole(role);
  };

  React.useEffect(() => {
    setShowLogin(initialShowLogin);
  }, [initialShowLogin]);

  return (
    <React.Fragment>
      <header className="home-landing-header">
        <span className="home-landing-brand">Gawa<span>Go</span></span>
        <div className="home-landing-actions">
          <button
            className="btn btn-outline-light home-landing-signin"
            type="button"
            onClick={() => {
              setAuthMode("login");
              setSelectedAuthRole(null);
              setShowLogin(true);
            }}
          >
            Login
          </button>
          <button
            className="btn btn-outline-light home-landing-signup"
            type="button"
            onClick={() => {
              setAuthMode("signup");
              setSelectedAuthRole(null);
              setShowLogin(true);
            }}
          >
            Sign Up
          </button>
        </div>
      </header>
      <section className="hero-section hero-dark hero-fullscreen">
        <div className="container py-5 py-lg-6 position-relative hero-inner">
          <div className={`home-landing-grid ${showLogin ? "with-login" : ""}`}>
            <div className="hero-copy">
              <p className="hero-kicker mb-2"><span className="eyebrow-dot"></span> Tayabas City</p>
              <h1 className="display-5 fw-bold mb-3 hero-title">
                Find <span>trusted</span><br />
                helpers and<br />
                skilled workers<br />
                near you.
              </h1>
              <p className="lead hero-subtitle mb-4">
                GawaGo connects households and workers with smart matching, transparent rates, and a fair reputation
                system.
              </p>
              <div className="d-flex gap-2 flex-wrap">
                <button className="btn btn-primary btn-lg hero-primary-btn" type="button" aria-disabled="true">
                  Post a Job
                </button>
                <button className="btn btn-outline-light btn-lg hero-secondary-btn" type="button" aria-disabled="true">
                  Find Work
                </button>
              </div>
            </div>
            {!showLogin && (
              <div className="hero-snapshot-slot">
                <div className="hero-snapshot hero-snapshot-alt">
                <div className="hero-snapshot-card">
                  <span className="hero-snapshot-badge">Open jobs live</span>
                  <p className="hero-snapshot-label mb-1">Open Jobs</p>
                  <p className="hero-snapshot-value mb-2">{dashboardMetrics.openJobs}</p>
                  <p className="hero-snapshot-note mb-0">Jobs waiting for workers to apply</p>
                  <hr className="hero-snapshot-divider" />
                  <div className="hero-snapshot-mini-grid">
                    <div>
                      <strong>8+</strong>
                      <span>Job Categories</span>
                    </div>
                    <div>
                      <strong>Free</strong>
                      <span>To Sign Up</span>
                    </div>
                    <div>
                      <strong>5.0</strong>
                      <span>Ratings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
            {showLogin && (
              <aside className="home-login-card" aria-label="Authentication panel">
                {!selectedAuthRole && (
                  <div className="home-role-card-grid home-role-choice-grid">
                    <button
                      className="home-role-card home-role-choice-card"
                      type="button"
                      onClick={() => (authMode === "login" ? selectLoginRole("household") : onOpenHouseholdRegister())}
                    >
                      <span className="home-role-illustration household-illustration" aria-hidden="true">
                        <i></i><b></b><em></em>
                      </span>
                      <strong>Household</strong>
                      <small>Post jobs and hire trusted workers</small>
                      <span className="home-role-action">
                        {authMode === "login" ? "Login" : "Create Account"}
                      </span>
                    </button>
                    <button
                      className="home-role-card home-role-choice-card"
                      type="button"
                      onClick={() => (authMode === "login" ? selectLoginRole("worker") : onOpenWorkerRegister())}
                    >
                      <span className="home-role-illustration worker-illustration" aria-hidden="true">
                        <i></i><b></b><em></em>
                      </span>
                      <strong>Worker</strong>
                      <small>Find jobs near your barangay</small>
                      <span className="home-role-action">
                        {authMode === "login" ? "Login" : "Create Account"}
                      </span>
                    </button>
                  </div>
                )}

                {authMode === "login" && selectedAuthRole && (
                  <form onSubmit={onLoginSubmit}>
                    <div className="home-login-form-head">
                      <button type="button" onClick={() => setSelectedAuthRole(null)}>
                        Back
                      </button>
                      <div>
                        <h2>Login as {selectedAuthRole === "household" ? "Household" : "Worker"}</h2>
                        <p>Enter your account details to continue.</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold" htmlFor="home-login-username">
                        Email or Username
                      </label>
                      <input
                        className="form-control"
                        id="home-login-username"
                        name="username"
                        onChange={onLoginChange}
                        placeholder="Enter your email or username"
                        type="text"
                        value={loginForm.username}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold" htmlFor="home-login-password">
                        Password
                      </label>
                      <input
                        className="form-control"
                        id="home-login-password"
                        name="password"
                        onChange={onLoginChange}
                        placeholder="Enter your password"
                        type="password"
                        value={loginForm.password}
                      />
                    </div>
                    <div className="text-end mb-3">
                      <button className="btn btn-link btn-sm text-decoration-none p-0" type="button" onClick={onOpenForgotPassword}>
                        Forgot your password?
                      </button>
                    </div>
                    <button className="btn btn-primary w-100 home-login-submit" type="submit">
                      Login
                    </button>
                  </form>
                )}

              </aside>
            )}
          </div>
        </div>
      </section>
    </React.Fragment>
  );
}
