import { useState } from 'react';

type TabItem = {
  id: string;
  label: string;
  title: string;
  body: string;
  items?: string[];
};

type TabsData = {
  id: string;
  title: string;
  tabs: TabItem[];
};

type TabsBlockProps = {
  data: TabsData;
};

export default function TabsBlock({ data }: TabsBlockProps) {
  const [activeId, setActiveId] = useState(data.tabs[0]?.id);
  const activeTab = data.tabs.find((tab) => tab.id === activeId) ?? data.tabs[0];

  if (!activeTab) {
    return null;
  }

  return (
    <section className="interactive-block tabs-block" aria-labelledby={`${data.id}-title`}>
      <div className="interactive-header">
        <p className="interactive-kicker">概念拆解</p>
        <h4 id={`${data.id}-title`}>{data.title}</h4>
      </div>

      <div className="tab-list" role="tablist" aria-label={data.title}>
        {data.tabs.map((tab) => (
          <button
            aria-controls={`${data.id}-${tab.id}`}
            aria-selected={tab.id === activeTab.id}
            className="tab-button"
            id={`${data.id}-${tab.id}-tab`}
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`${data.id}-${activeTab.id}-tab`}
        className="tab-panel"
        id={`${data.id}-${activeTab.id}`}
        role="tabpanel"
      >
        <h5>{activeTab.title}</h5>
        <p>{activeTab.body}</p>
        {activeTab.items && activeTab.items.length > 0 ? (
          <ul className="tag-list" aria-label={`${activeTab.label}包含的动机`}>
            {activeTab.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
