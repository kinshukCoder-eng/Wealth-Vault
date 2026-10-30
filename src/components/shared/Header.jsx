import React from "react";

export function Header({ eyebrow, title, sub, actions }) {
  return (
    <div className="page-heading reveal">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {actions && <div className="page-heading-actions">{actions}</div>}
      </div>
    </div>
  );
}

export default Header;
