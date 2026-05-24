import React from "react";
export default function LoginView({
  form,
  onChange,
  onSubmit,
  onOpenForgotPassword,
  onOpenHouseholdRegister,
  onOpenWorkerRegister,
}) {
  return (
    <section className="login-section py-5">
      <div className="container login-page-wrap">
        <div className="login-shell shadow-sm">
          <div className="login-topbar d-flex align-items-center px-3">
            <span className="badge rounded-pill text-bg-light text-primary me-2">GG</span>
            <span className="small fw-semibold">GawaGo Community Login Platform</span>
          </div>
          <div className="login-card mx-auto">
            <div className="login-card-head text-center">
              <div className="login-avatar">GG</div>
              <h2 className="h6 fw-bold mb-1">GawaGo Community Login Platform</h2>
              <p className="small text-white-50 mb-0">Connect workers and households in your community</p>
            </div>
            <form className="p-3 p-md-4" onSubmit={onSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label fw-semibold">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="form-control"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={onChange}
                />
              </div>
              <div className="mb-2">
                <label htmlFor="password" className="form-label fw-semibold">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={onChange}
                />
              </div>
              <div className="mb-2">
                <label htmlFor="role" className="form-label fw-semibold">
                  Login As
                </label>
                <select id="role" name="role" className="form-select" value={form.role} onChange={onChange}>
                  <option value="worker">Worker</option>
                  <option value="household">Household</option>
                </select>
              </div>
              <div className="text-end mb-3">
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none p-0"
                  onClick={onOpenForgotPassword}
                >
                  Forgot your password?
                </button>
              </div>
              <button type="submit" className="btn btn-primary w-100">
                Login
              </button>
            </form>
            <div className="login-card-foot text-center p-3 p-md-4">
              <p className="small mb-2">New here? Register as:</p>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <button type="button" className="btn btn-outline-success btn-sm" onClick={onOpenHouseholdRegister}>
                  Household
                </button>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={onOpenWorkerRegister}>
                  Worker
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
