import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  GET_RELEASES, 
  CREATE_RELEASE, 
  UPDATE_CHECKLIST, 
  UPDATE_ADDITIONAL_INFO, 
  DELETE_RELEASE, 
  RELEASE_STEPS 
} from './graphql';

const ICON_STYLES = [
  { bg: '#0f172a', letter: 'M' },
  { bg: '#10b981', letter: 'E' },
  { bg: '#3b82f6', letter: 'A' },
  { bg: '#6366f1', letter: 'C' },
  { bg: '#0ea5e9', letter: 'S' },
];

export default function App() {
  const { data, loading, error, refetch } = useQuery(GET_RELEASES);
  const [createRelease] = useMutation(CREATE_RELEASE);
  const [updateChecklist] = useMutation(UPDATE_CHECKLIST);
  const [updateAdditionalInfo] = useMutation(UPDATE_ADDITIONAL_INFO);
  const [deleteRelease] = useMutation(DELETE_RELEASE);

  const [selectedReleaseId, setSelectedReleaseId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const releases = data?.releases || [];
  
  // Set default selected release if none selected
  const activeRelease = releases.find(r => r.id === selectedReleaseId) || releases[0] || null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    const res = await createRelease({
      variables: { input: { name, date, additionalInfo } }
    });

    setName('');
    setDate('');
    setAdditionalInfo('');
    setShowCreateModal(false);
    await refetch();
    if (res?.data?.createRelease?.id) {
      setSelectedReleaseId(res.data.createRelease.id);
    }
  };

  const handleToggleStep = async (release, stepId) => {
    const current = release.completedSteps || [];
    const updated = current.includes(stepId)
      ? current.filter(id => id !== stepId)
      : [...current, stepId];

    await updateChecklist({
      variables: { id: release.id, completedSteps: updated }
    });
    refetch();
  };

  const handleSaveNotes = async () => {
    if (!activeRelease) return;
    await updateAdditionalInfo({
      variables: { id: activeRelease.id, additionalInfo: notesText }
    });
    setEditingNotes(false);
    refetch();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this release?')) {
      await deleteRelease({ variables: { id } });
      setSelectedReleaseId(null);
      refetch();
    }
  };

  const formatStatus = (status) => {
    if (status === 'ONGOING') return 'Ongoing';
    if (status === 'DONE') return 'Done';
    return 'Planned';
  };

  return (
    <div className="app-container">
      {/* 1. Left Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo-area">
            <span className="rocket-icon">🚀</span>
            <div className="brand-text">
              <h2>Shipo</h2>
              <p>Release Checklist</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className="nav-item active">
              <span>🏠</span> Home
            </button>
            <button className="nav-item" onClick={() => setShowCreateModal(true)}>
              <span>➕</span> Create Release
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="nav-item">
            <span>⚙️</span> Settings
          </button>
        </div>
      </aside>

      {/* 2. Main Center Content */}
      <main className="main-workspace">
        <section className="releases-view">
          <div className="view-header">
            <div>
              <h1>All Releases</h1>
              <p>Track and manage your software releases</p>
            </div>
            <button className="btn-create-top" onClick={() => setShowCreateModal(true)}>
              <span>+</span> Create Release
            </button>
          </div>

          {loading && <p style={{ color: '#64748b' }}>Loading releases...</p>}
          {error && <p style={{ color: '#ef4444' }}>Error connecting to backend.</p>}

          <div className="release-card-list">
            {releases.map((release, idx) => {
              const iconMeta = ICON_STYLES[idx % ICON_STYLES.length];
              const completedCount = release.completedSteps?.length || 0;
              const percent = (completedCount / RELEASE_STEPS.length) * 100;
              const formattedStatus = formatStatus(release.status);
              const isSelected = activeRelease?.id === release.id;

              return (
                <div 
                  key={release.id} 
                  className={`release-list-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedReleaseId(release.id);
                    setEditingNotes(false);
                  }}
                >
                  <div className="card-left">
                    <div className="app-icon-badge" style={{ backgroundColor: iconMeta.bg }}>
                      {release.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="card-info">
                      <h3>{release.name}</h3>
                      <p className="card-due">Due: {release.date}</p>
                      <p className="card-desc">{release.additionalInfo || 'No notes provided'}</p>
                    </div>
                  </div>

                  <div className="card-right">
                    <div className="card-progress-col">
                      <span className={`status-pill ${formattedStatus}`}>{formattedStatus}</span>
                      <span className="card-step-text">{completedCount} / {RELEASE_STEPS.length} steps completed</span>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <span className="card-chevron">›</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Right Release Detail Panel */}
        {activeRelease && (
          <aside className="detail-panel">
            <div className="detail-header">
              <div 
                className="app-icon-badge" 
                style={{ backgroundColor: '#0f172a', width: '48px', height: '48px' }}
              >
                {activeRelease.name.charAt(0).toUpperCase()}
              </div>
              <div className="detail-title-info" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2>{activeRelease.name}</h2>
                  <span className={`status-pill ${formatStatus(activeRelease.status)}`}>
                    {formatStatus(activeRelease.status)}
                  </span>
                </div>
                <p>Due: {activeRelease.date}</p>
                <p style={{ color: '#94a3b8' }}>{activeRelease.additionalInfo || 'No notes'}</p>
              </div>
            </div>

            {/* Checklist Header & Progress */}
            <div>
              <div className="checklist-title-row">
                <h4>Release Checklist</h4>
                <span>{activeRelease.completedSteps?.length || 0} / {RELEASE_STEPS.length} completed</span>
              </div>
              <div className="progress-track" style={{ width: '100%', height: '8px' }}>
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${((activeRelease.completedSteps?.length || 0) / RELEASE_STEPS.length) * 100}%` 
                  }} 
                />
              </div>
            </div>

            {/* Checklist Steps */}
            <div className="checklist-container">
              {RELEASE_STEPS.map((step) => {
                const isChecked = activeRelease.completedSteps?.includes(step.id);

                return (
                  <div 
                    key={step.id} 
                    className="check-item-row"
                    onClick={() => handleToggleStep(activeRelease, step.id)}
                  >
                    <div className={`check-box-custom ${isChecked ? 'checked' : ''}`}>
                      {isChecked && '✓'}
                    </div>
                    <span className="step-num">{step.id}.</span>
                    <span className={`check-item-text ${isChecked ? 'completed' : ''}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Additional Information Section */}
            <div className="detail-info-section">
              <h4>Additional Information</h4>

              {editingNotes ? (
                <div style={{ marginBottom: '1.25rem' }}>
                  <textarea 
                    className="modal-input" 
                    rows={3} 
                    value={notesText} 
                    onChange={(e) => setNotesText(e.target.value)} 
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="btn-submit" onClick={handleSaveNotes}>Save</button>
                    <button className="btn-cancel" onClick={() => setEditingNotes(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="detail-info-box">
                  {activeRelease.additionalInfo || 'First public release'}
                </div>
              )}

              <div className="detail-actions-row">
                <button 
                  className="btn-outline" 
                  onClick={() => {
                    setEditingNotes(true);
                    setNotesText(activeRelease.additionalInfo || '');
                  }}
                >
                  ✏️ Edit Information
                </button>
                <button 
                  className="btn-outline-danger" 
                  onClick={() => handleDelete(activeRelease.id)}
                >
                  🗑️ Delete Release
                </button>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* 4. Create Release Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Release</h3>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div>
                  <label className="input-label">Release Name <span>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. E-Commerce v2.0"
                    className="modal-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">Due Date <span>*</span></label>
                  <input
                    type="date"
                    required
                    className="modal-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">Additional Information</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. First public release"
                    className="modal-input"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}