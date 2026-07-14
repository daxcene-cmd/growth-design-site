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

type JudgementRow = {
  scene: string;
  motivations: string[];
  note: string;
};

type JudgementGroup = {
  dimension: string;
  rows: JudgementRow[];
};

type JudgementContent = {
  type: 'judgement';
  groups: JudgementGroup[];
  stacked?: boolean;
};

type TabItem = {
  id: string;
  index: string;
  title: string;
  descriptionShort?: string;
  description?: string;
  content: CardsContent | TableContent | JudgementContent;
};

type TabsData = {
  id: string;
  title: string;
  tabs: TabItem[];
};

type TabsBlockProps = {
  data: TabsData;
  layout?: 'horizontal' | 'vertical';
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

function JudgementPanel({ groups, stacked, compact }: { groups: JudgementGroup[]; stacked?: boolean; compact?: boolean }) {
  return (
    <div className="judgement-groups">
      {groups.map((group) => (
        <div key={group.dimension} className="judgement-group">
          {group.dimension && (
            <p className="judgement-dimension-label">{group.dimension}</p>
          )}
          <div className="judgement-rows">
            {group.rows.map((row) => (
              compact ? (
                <div key={row.scene} className="judgement-row judgement-row--compact">
                  <p className="judgement-result">
                    {row.scene && <span className="judgement-scene">{row.scene}：</span>}
                    <span className="judgement-motivation-text">{row.motivations.join('、')}</span>
                  </p>
                  {row.note && <p className="judgement-note">{row.note}</p>}
                </div>
              ) : stacked ? (
                <div key={row.scene} className="judgement-row judgement-row--stacked">
                  {row.scene && <span className="judgement-scene">{row.scene}</span>}
                  <div className="judgement-motivations">
                    {row.motivations.map((m) => (
                      <span key={m} className="judgement-chip">{m}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div key={row.scene} className="judgement-row">
                  <span className="judgement-scene">{row.scene}</span>
                  <div className="judgement-content">
                    <div className="judgement-motivations">
                      {row.motivations.map((m) => (
                        <span key={m} className="judgement-chip">{m}</span>
                      ))}
                    </div>
                    <p className="judgement-note">{row.note}</p>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      ))}
    </div>
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

export default function TabsBlock({ data, layout = 'horizontal' }: TabsBlockProps) {
  const [activeId, setActiveId] = useState(data.tabs[0]?.id);
  const activeTab = data.tabs.find((tab) => tab.id === activeId) ?? data.tabs[0];
  const titleOnlyTabs = data.id === 'reward-types';

  if (!activeTab) return null;

  const panel = (
    <div
      id={`${data.id}-${activeTab.id}-panel`}
      role="tabpanel"
      aria-labelledby={`${data.id}-${activeTab.id}-tab`}
      className={layout === 'vertical' ? 'vertical-tab-panel' : 'folder-tab-panel'}
    >
      {activeTab.content.type === 'cards' && (
        <CardsPanel forms={activeTab.content.forms} description={activeTab.description} />
      )}
      {activeTab.content.type === 'table' && (
        <TablePanel columns={activeTab.content.columns} rows={activeTab.content.rows} />
      )}
      {activeTab.content.type === 'judgement' && (
        <JudgementPanel
          groups={activeTab.content.groups}
          stacked={activeTab.content.stacked}
          compact={data.id === 'motivation-judgement' || data.id === 'reward-types'}
        />
      )}
    </div>
  );

  if (layout === 'vertical') {
    return (
      <section className="interactive-block tabs-block tabs-block--vertical" data-tabs-id={data.id} aria-labelledby={`${data.id}-title`}>
        <div className="vertical-tab-nav" role="tablist" aria-label={data.title}>
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
                className={`vertical-tab${isActive ? ' is-active' : ''}`}
                onClick={() => setActiveId(tab.id)}
              >
                <span className="vertical-tab-header">
                  {!titleOnlyTabs && <span className="vertical-tab-index">{tab.index}</span>}
                  <span className="vertical-tab-title">{tab.title}</span>
                </span>
                {!titleOnlyTabs && tab.descriptionShort && (
                  <span className="vertical-tab-desc">{tab.descriptionShort}</span>
                )}
              </button>
            );
          })}
        </div>
        {panel}
      </section>
    );
  }

  return (
    <section className="interactive-block tabs-block" data-tabs-id={data.id} aria-labelledby={`${data.id}-title`}>
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
      {panel}
    </section>
  );
}
