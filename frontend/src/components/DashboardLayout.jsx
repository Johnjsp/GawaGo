import React from "react";

export function DashboardSidebar({ brand = "GawaGo Community Platform", items = [], footerAction = null }) {
  return (
    <aside className="worker-sidebar">
      <div className="worker-sidebar-head">
        <div className="worker-logo">GG</div>
        <p className="worker-brand mb-0">{brand}</p>
      </div>
      <nav className="worker-nav">
        {items.map((item) => (
          <button
            key={item.id || item.label}
            type="button"
            className={`worker-nav-item ${item.active ? "active" : ""}`}
            onClick={item.onClick}
          >
            {item.label}
            {item.count > 0 && <span className="nav-count-badge">{item.count}</span>}
          </button>
        ))}
      </nav>
      {footerAction && (
        <div className="worker-sidebar-footer">
          <button className="worker-sidebar-logout" type="button" onClick={footerAction.onClick}>
            {footerAction.label}
          </button>
        </div>
      )}
    </aside>
  );
}

export function DashboardTopbar({ title, subtitle = "", children }) {
  return (
    <div className="worker-topbar">
      <div>
        <h1 className={`h4 ${subtitle ? "mb-1" : "mb-0"}`}>{title}</h1>
        {subtitle ? <p className="small text-muted mb-0">{subtitle}</p> : null}
      </div>
      {children ? <div className="worker-user-meta d-flex align-items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function MetricCard({ label, value, note = "", className = "" }) {
  return (
    <div className={`metric-card ${className}`.trim()}>
      <p className="metric-label mb-1">{label}</p>
      <p className="metric-value mb-0">{value}</p>
      {note ? <p className="small text-muted mb-0">{note}</p> : null}
    </div>
  );
}
