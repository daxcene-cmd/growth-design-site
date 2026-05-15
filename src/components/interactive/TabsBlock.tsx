import { useState } from 'react';

type CardForm = {
  label: string;
  image: string;
};

type TableContent = {
  type: 'table';
  columns: string[];
  rows: string[][];
};

type CardsContent = {
  type: 'cards';
  forms: CardForm[];
};

type TabItem = {
  id: string;
  index: string;
  title: string;
  descriptionShort?: string;
  description?: string;
  content: CardsContent | TableContent;
};

type TabsData = {
  id: string;
  title: string;
  tabs: TabItem[];
};

type TabsBlockProps = {
  data: TabsData;
};

function CardsPanel({ forms, description }: { forms: CardForm[]; description?: string }) {
  return (
    <>
      {description && <p className="tab-panel-desc">{description}</p>}
      <ul className="tab-cards-list">
        {forms.map((form) => (
          <li key={form.label} className="tab-card-item">
            <div className="tab-card-image-wrap">
              <img src={form.image} alt={form.label} loading="lazy" />
            </div>
            <span className="tab-card-label">{form.label}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function TablePanel({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="tab-table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TabsBlock({ data }: TabsBlockProps) {
  const [activeId, setActiveId] = useState(data.tabs[0]?.id);
  const activeTab = data.tabs.find((tab) => tab.id === activeId) ?? data.tabs[0];

  if (!activeTab) return null;

  const activeIndex = data.tabs.findIndex((tab) => tab.id === activeTab.id);

  const panelRadius = '0 0 10px 10px';

  return (
    <section className="interactive-block tabs-block" aria-labelledby={`${data.id}-title`}>
      <div className="folder-tab-nav" role="tablist" aria-label={data.title}>
        {data.tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              id={`${data.id}-${tab.id}-tab`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`${data.id}-${tab.id}-panel`}
              className={`folder-tab${isActive ? ' is-active' : ''}`}
              onClick={() => setActiveId(tab.id)}
            >
              <span className="folder-tab-header">
                <span className="folder-tab-index">{tab.index}</span>
                <span className="folder-tab-title">{tab.title}</span>
              </span>
              {tab.descriptionShort && (
                <span className="folder-tab-desc">{tab.descriptionShort}</span>
              )}
            </button>
          );
        })}
      </div>

      <div
        id={`${data.id}-${activeTab.id}-panel`}
        role="tabpanel"
        aria-labelledby={`${data.id}-${activeTab.id}-tab`}
        className="folder-tab-panel"
        style={{ borderRadius: panelRadius }}
      >
        {activeTab.content.type === 'cards' && (
          <CardsPanel forms={activeTab.content.forms} description={activeTab.description} />
        )}
        {activeTab.content.type === 'table' && (
          <TablePanel
            columns={activeTab.content.columns}
            rows={activeTab.content.rows}
          />
        )}
      </div>
    </section>
  );
}
