import { useState } from 'react';

type Group = { label: string; items: string[] };
type Criterion = { title: string; desc: string };

type InputPhase   = { type: 'input';   id: string; index: string; title: string; groups: Group[] };
type CombinePhase = { type: 'combine'; id: string; index: string; title: string; items: string[] };
type ConvergePhase= { type: 'converge';id: string; index: string; title: string; solutionLabel?: string; solution: string; criteria: Criterion[] };
type Phase = InputPhase | CombinePhase | ConvergePhase;

export default function CvdBlock({ data }: { data: { phases: Phase[] } }) {
  const [activeId, setActiveId] = useState(data.phases[0].id);
  const active = data.phases.find(p => p.id === activeId) ?? data.phases[0];

  return (
    <section className="interactive-block tabs-block tabs-block--cvd">
      <div className="folder-tab-nav" role="tablist">
        {data.phases.map(phase => (
          <button
            key={phase.id}
            role="tab"
            type="button"
            aria-selected={phase.id === activeId}
            className={`folder-tab${phase.id === activeId ? ' is-active' : ''}`}
            onClick={() => setActiveId(phase.id)}
          >
            <span className="folder-tab-header">
              <span className="folder-tab-title">{phase.title}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="folder-tab-panel" role="tabpanel">
        {active.type === 'input' && (
          <div className="cvd-groups-container">
            {active.groups.map(group => (
              <div key={group.label} className="cvd-group-section">
                <p className="cvd-group-label">{group.label}</p>
                <div className="cvd-group-items">
                  {group.items.map((item, i) => (
                    <div key={i} className="cvd-item">
                      <span className="cvd-item-chip">{String(i + 1).padStart(2, '0')}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {active.type === 'combine' && (
          <div className="cvd-combine-list">
            {active.items.map((item, i) => (
              <div key={i} className="cvd-item">
                <span className="cvd-item-chip cvd-item-chip--label">{'ABCD'[i]}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        {active.type === 'converge' && (
          <div>
            <div className="cvd-solution">
              {active.solutionLabel && (
                <span className="cvd-item-chip" style={{ flexShrink: 0 }}>
                  {active.solutionLabel}
                </span>
              )}
              <p className="cvd-solution-text">{active.solution}</p>
            </div>
            <div className="cvd-criteria">
              {active.criteria.map((c, i) => (
                <div key={i} className="cvd-criterion">
                  <p className="cvd-criterion-title">{c.title}</p>
                  <p className="cvd-criterion-desc">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
