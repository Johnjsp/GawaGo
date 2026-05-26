import React from "react";
export default function ForgotPasswordView({
  form,
  step,
  notice,
  error,
  loading,
  onChange,
  onEmailSubmit,
  onVerifyToken,
  onResetPassword,
  onOpenLogin,
  onOpenForgotPassword,
}) {
  return (
    <div className="app-shell">
      <section className="login-section py-5">
        <div className="container login-page-wrap">
          <div className="login-shell shadow-sm">
            <div className="login-topbar d-flex align-items-center px-3">
              <span className="badge rounded-pill text-bg-light text-primary me-2">GG</span>
              <span className="small fw-semibold">Password Reset</span>
            </div>
            <div className="login-card password-reset-card mx-auto">
              <div className="login-card-head text-center">
                <div className="login-avatar">GG</div>
                <h2 className="h6 fw-bold mb-1">Reset your password</h2>
                <p className="small text-white-50 mb-0">We will send a reset code to your Gmail address.</p>
              </div>
              <div className="p-3 p-md-4">
                {notice ? <div className="alert alert-info py-2">{notice}</div> : null}
                {error ? <div className="alert alert-danger py-2">{error}</div> : null}

                {step === "email" && (
                  <form onSubmit={onEmailSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold" htmlFor="reset-email">
                        Email address
                      </label>
                      <input
                        id="reset-email"
                        name="email"
                        type="email"
                        className="form-control"
                        value={form.email}
                        onChange={onChange}
                        placeholder="Enter your Gmail address"
                      />
                    </div>
                    <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                      {loading ? "Sending..." : "Send OTP"}
                    </button>
                  </form>
                )}

                {step === "verify" && (
                  <form onSubmit={onVerifyToken}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold" htmlFor="reset-token">
                        OTP / Reset Code
                      </label>
                      <input
                        id="reset-token"
                        name="token"
                        type="text"
                        className="form-control"
                        value={form.token}
                        onChange={onChange}
                        placeholder="Enter the 6-digit code"
                      />
                    </div>
                    <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                      {loading ? "Verifying..." : "Verify Code"}
                    </button>
                  </form>
                )}

                {step === "reset" && (
                  <form onSubmit={onResetPassword}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold" htmlFor="new-password">
                        New Password
                      </label>
                      <input
                        id="new-password"
                        name="newPassword"
                        type="password"
                        className="form-control"
                        value={form.newPassword}
                        onChange={onChange}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold" htmlFor="confirm-password">
                        Confirm Password
                      </label>
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        className="form-control"
                        value={form.confirmPassword}
                        onChange={onChange}
                      />
                    </div>
                    <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                      {loading ? "Resetting..." : "Reset Password"}
                    </button>
                  </form>
                )}

                {step === "done" && (
                  <div className="d-grid gap-2">
                    <button type="button" className="btn btn-success" onClick={onOpenLogin}>
                      Back to Login
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={onOpenForgotPassword}>
                      Send another code
                    </button>
                  </div>
                )}

                <div className="mt-3 text-center">
                  <button type="button" className="btn btn-link btn-sm text-decoration-none p-0" onClick={onOpenLogin}>
                    Return to login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
