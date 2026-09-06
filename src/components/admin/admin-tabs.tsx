"use client";

import { useState, type ReactNode } from "react";

export type AdminTabSpec = {
  id: string;
  label: string;
  content: ReactNode;
};

export function AdminTabs({ tabs, initialTabId }: { tabs: AdminTabSpec[]; initialTabId?: string }) {
  const startId = tabs.some((tab) => tab.id === initialTabId) ? initialTabId : tabs[0]?.id;
  const [activeId, setActiveId] = useState(startId);
  // useState only reads its initial value on mount, so a soft navigation to
  // ?tab=expenses (from a "Needs review" action, say) re-rendered this with a
  // new initialTabId and changed nothing on screen — the click looked broken.
  // Adjusting state during render is React's documented way to follow a prop.
  const [seenInitialTabId, setSeenInitialTabId] = useState(initialTabId);
  if (initialTabId !== seenInitialTabId) {
    setSeenInitialTabId(initialTabId);
    if (tabs.some((tab) => tab.id === initialTabId)) {
      setActiveId(initialTabId);
    }
  }
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div className="admin-tabs">
      <div className="admin-tabs-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            aria-selected={tab.id === activeTab?.id}
            className={tab.id === activeTab?.id ? "admin-tab-button active" : "admin-tab-button"}
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="admin-tab-panel" role="tabpanel">
        {activeTab?.content}
      </div>
    </div>
  );
}
