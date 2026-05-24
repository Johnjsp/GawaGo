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

  React.useEffect(() => {
    setShowLogin(initialShowLogin);
  }, [initialShowLogin]);

  return (
    <React.Fragment>
      <header className="home-landing-header">
        <span className="home-landing-brand">GawaGo</span>
        <button className="btn btn-outline-light home-landing-signin" type="button" onClick={() => setShowLogin(true)}>
          Sign In
        </button>
      </header>
      <section className="hero-section hero-dark hero-fullscreen">
        <div className="container py-5 py-lg-6 position-relative hero-inner">
          <div className={`home-landing-grid ${showLogin ? "with-login" : ""}`}>
            <div className="hero-copy">
              <p className="text-uppercase small fw-semibold hero-kicker mb-2">Tayabas City</p>
              <h1 className="display-5 fw-bold mb-3 hero-title">Find trusted helpers and skilled workers near you.</h1>
              <p className="lead hero-subtitle mb-4">
                GawaGo connects households and workers with smart matching, transparent rates, and a fair reputation
                system.
              </p>
              <div className="d-flex gap-2 flex-wrap">
                <button className="btn btn-primary btn-lg hero-primary-btn" type="button" onClick={() => setShowLogin(true)}>
                  Post a Job
                </button>
                <button className="btn btn-outline-light btn-lg hero-secondary-btn" type="button" onClick={() => setShowLogin(true)}>
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
                </div>
              </div>
            </div>
            )}
            {showLogin && (
              <aside className="home-login-card" aria-label="Sign in form">
                <h2>Welcome Back</h2>
                <p>Sign in to continue as household, worker, or administrator.</p>
                <form onSubmit={onLoginSubmit}>
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
                  <div className="mb-3">
                    <label className="form-label fw-semibold" htmlFor="home-login-role">
                      Login As
                    </label>
                    <select
                      className="form-select"
                      id="home-login-role"
                      name="role"
                      onChange={onLoginChange}
                      value={loginForm.role}
                    >
                      <option value="worker">Worker</option>
                      <option value="household">Household</option>
                    </select>
                  </div>
                  <div className="text-end mb-3">
                    <button className="btn btn-link btn-sm text-decoration-none p-0" type="button" onClick={onOpenForgotPassword}>
                      Forgot your password?
                    </button>
                  </div>
                  <button className="btn btn-primary w-100 home-login-submit" type="submit">
                    Sign In
                  </button>
                </form>
                <div className="home-login-register">
                  <span>Don't have an account?</span>
                  <button type="button" onClick={onOpenHouseholdRegister}>
                    Household
                  </button>
                  <button type="button" onClick={onOpenWorkerRegister}>
                    Worker
                  </button>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>
    </React.Fragment>
  );
}
