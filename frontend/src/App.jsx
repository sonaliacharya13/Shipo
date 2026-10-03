import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_RELEASES,
  CREATE_RELEASE,
  UPDATE_CHECKLIST,
  UPDATE_ADDITIONAL_INFO,
  DELETE_RELEASE,
  DEFAULT_CHECKLIST_STEPS
} from './graphql';


// --------------------------------------------------
// User ID Helper
// --------------------------------------------------

const getUserId = () => {
  let uid = localStorage.getItem('shipo-user-id');

  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('shipo-user-id', uid);
  }

  return uid;
};

const currentUserId = getUserId();


// --------------------------------------------------
// Icon Styles
// --------------------------------------------------

const ICON_STYLES = [
  { bg: '#0f172a', letter: 'M' },
  { bg: '#10b981', letter: 'E' },
  { bg: '#3b82f6', letter: 'A' },
  { bg: '#6366f1', letter: 'C' },
  { bg: '#0ea5e9', letter: 'S' },
];


// --------------------------------------------------
// App Component
// --------------------------------------------------

export default function App() {

  // --------------------------------------------------
  // GraphQL
  // --------------------------------------------------

  const { data, loading, error, refetch } = useQuery(GET_RELEASES, {
    variables: {
      userId: currentUserId
    }
  });

  const [createRelease] = useMutation(CREATE_RELEASE);
  const [updateChecklist] = useMutation(UPDATE_CHECKLIST);
  const [updateAdditionalInfo] = useMutation(UPDATE_ADDITIONAL_INFO);
  const [deleteRelease] = useMutation(DELETE_RELEASE);


  // --------------------------------------------------
  // App Layout States
  // --------------------------------------------------

  const [theme, setTheme] = useState(
    localStorage.getItem('shipo-theme') || 'light'
  );

  const [selectedReleaseId, setSelectedReleaseId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isForceEditing, setIsForceEditing] = useState(false);


  // --------------------------------------------------
  // Custom Steps Storage
  // --------------------------------------------------

  const [customStepsMap, setCustomStepsMap] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('shipo-steps-map') || '{}'
      );
    } catch {
      return {};
    }
  });

  const [newStepLabel, setNewStepLabel] = useState('');


  // --------------------------------------------------
  // Notes Edit State
  // --------------------------------------------------

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');


  // --------------------------------------------------
  // Form States
  // --------------------------------------------------

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');


  // --------------------------------------------------
  // Theme Effect
  // --------------------------------------------------

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('shipo-theme', theme);
  }, [theme]);


  // --------------------------------------------------
  // Custom Steps Persistence
  // --------------------------------------------------

  useEffect(() => {
    localStorage.setItem(
      'shipo-steps-map',
      JSON.stringify(customStepsMap)
    );
  }, [customStepsMap]);


  // --------------------------------------------------
  // Theme Toggle
  // --------------------------------------------------

  const toggleTheme = () => {
    setTheme(prev =>
      prev === 'light' ? 'dark' : 'light'
    );
  };


  // --------------------------------------------------
  // Releases
  // --------------------------------------------------

  const releases = data?.releases || [];

  const activeRelease =
    releases.find(r => r.id === selectedReleaseId) ||
    releases[0] ||
    null;


  // --------------------------------------------------
  // Get Release Steps
  // --------------------------------------------------

  const getReleaseSteps = (releaseId) => {
    if (!releaseId) {
      return DEFAULT_CHECKLIST_STEPS;
    }

    return (
      customStepsMap[releaseId] ||
      DEFAULT_CHECKLIST_STEPS
    );
  };


  const currentSteps = activeRelease
    ? getReleaseSteps(activeRelease.id)
    : DEFAULT_CHECKLIST_STEPS;

  const isCompleted =
    activeRelease?.status === 'DONE';


  // --------------------------------------------------
  // Create Release
  // --------------------------------------------------

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!name.trim() || !date) {
      return;
    }

    const res = await createRelease({
      variables: {
        input: {
          name,
          date,
          additionalInfo,
          userId: currentUserId
        }
      }
    });

    setName('');
    setDate('');
    setAdditionalInfo('');
    setShowCreateModal(false);

    await refetch();

    if (res?.data?.createRelease?.id) {
      const newId = res.data.createRelease.id;

      setSelectedReleaseId(newId);

      setCustomStepsMap(prev => ({
        ...prev,
        [newId]: [...DEFAULT_CHECKLIST_STEPS]
      }));

      setIsForceEditing(false);
    }
  };


  // --------------------------------------------------
  // Toggle Checklist Step
  // --------------------------------------------------

  const handleToggleStep = async (
    release,
    stepId
  ) => {

    const current =
      release.completedSteps || [];

    const updated = current.includes(stepId)
      ? current.filter(id => id !== stepId)
      : [...current, stepId];

    await updateChecklist({
      variables: {
        id: release.id,
        completedSteps: updated
      }
    });

    refetch();
  };


  // --------------------------------------------------
  // Add Custom Checklist Step
  // --------------------------------------------------

  const handleAddCustomStep = (e) => {
    e.preventDefault();

    if (
      !newStepLabel.trim() ||
      !activeRelease
    ) {
      return;
    }

    const existing =
      getReleaseSteps(activeRelease.id);

    const nextId =
      existing.length > 0
        ? Math.max(...existing.map(s => s.id)) + 1
        : 1;

    const updatedList = [
      ...existing,
      {
        id: nextId,
        label: newStepLabel.trim()
      }
    ];

    setCustomStepsMap(prev => ({
      ...prev,
      [activeRelease.id]: updatedList
    }));

    setNewStepLabel('');
  };


  // --------------------------------------------------
  // Remove Checklist Step
  // --------------------------------------------------

  const handleRemoveStep = async (stepId) => {

    if (!activeRelease) {
      return;
    }

    const existing =
      getReleaseSteps(activeRelease.id);

    const updatedList =
      existing.filter(
        s => s.id !== stepId
      );

    const completed =
      activeRelease.completedSteps || [];

    if (completed.includes(stepId)) {

      await updateChecklist({
        variables: {
          id: activeRelease.id,
          completedSteps:
            completed.filter(
              id => id !== stepId
            )
        }
      });

      refetch();
    }

    setCustomStepsMap(prev => ({
      ...prev,
      [activeRelease.id]: updatedList
    }));
  };


  // --------------------------------------------------
  // Save Additional Information
  // --------------------------------------------------

  const handleSaveNotes = async () => {

    if (!activeRelease) {
      return;
    }

    await updateAdditionalInfo({
      variables: {
        id: activeRelease.id,
        additionalInfo: notesText
      }
    });

    setEditingNotes(false);

    refetch();
  };


  // --------------------------------------------------
  // Delete Release
  // --------------------------------------------------

  const handleDelete = async (id) => {

    if (window.confirm('Delete this release?')) {

      await deleteRelease({
        variables: {
          id
        }
      });

      setCustomStepsMap(prev => {

        const copy = {
          ...prev
        };

        delete copy[id];

        return copy;
      });

      setSelectedReleaseId(null);

      refetch();
    }
  };


  // --------------------------------------------------
  // Format Status
  // --------------------------------------------------

  const formatStatus = (status) => {

    if (status === 'ONGOING') {
      return 'Ongoing';
    }

    if (status === 'DONE') {
      return 'Done';
    }

    return 'Planned';
  };


  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="app-container">

      {/* ==========================================
          1. LEFT SIDEBAR
          ========================================== */}

      <aside className="sidebar">

        <div>

          <div className="sidebar-logo-area">

            <div className="brand-text">

              <h2>Shipo</h2>

              <p>
                Release Checklist
              </p>

            </div>

          </div>


          <nav className="sidebar-nav">

            <button
              className="nav-item active"
            >
              <span>📋</span>
              All Releases
            </button>


            <button
              className="nav-item"
              onClick={() =>
                setShowCreateModal(true)
              }
            >
              <span>➕</span>
              Create Release
            </button>

          </nav>

        </div>


        <div className="sidebar-footer">

          <button
            className="nav-item"
            onClick={() =>
              setShowSettingsModal(true)
            }
          >
            <span>⚙️</span>
            Settings
          </button>

        </div>

      </aside>


      {/* ==========================================
          2. MAIN WORKSPACE
          ========================================== */}

      <main className="main-workspace">

        {/* ------------------------------------------
            Releases View
            ------------------------------------------ */}

        <section className="releases-view">

          <div className="view-header">

            <div>

              <h1>
                All Releases
              </h1>

              <p>
                Track and manage your software releases
              </p>

            </div>


            <button
              className="btn-create-top"
              onClick={() =>
                setShowCreateModal(true)
              }
            >
              + Create Release
            </button>

          </div>


          {loading && (
            <p
              style={{
                color: 'var(--text-muted)'
              }}
            >
              Loading releases...
            </p>
          )}


          {error && (
            <p
              style={{
                color: 'var(--danger)'
              }}
            >
              Error connecting to backend.
            </p>
          )}


          <div className="release-card-list">

            {releases.map((release, idx) => {

              const iconMeta =
                ICON_STYLES[
                  idx % ICON_STYLES.length
                ];

              const stepsForThis =
                getReleaseSteps(release.id);

              const completedCount =
                (release.completedSteps || [])
                  .filter(id =>
                    stepsForThis.some(
                      s => s.id === id
                    )
                  ).length;

              const percent =
                stepsForThis.length > 0
                  ? (
                      completedCount /
                      stepsForThis.length
                    ) * 100
                  : 0;

              const formattedStatus =
                formatStatus(
                  release.status
                );

              const isSelected =
                activeRelease?.id === release.id;


              return (

                <div
                  key={release.id}
                  className={`release-list-card ${
                    isSelected
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => {

                    setSelectedReleaseId(
                      release.id
                    );

                    setIsForceEditing(false);

                    setEditingNotes(false);

                  }}
                >

                  <div className="card-left">

                    <div
                      className="app-icon-badge"
                      style={{
                        backgroundColor:
                          iconMeta.bg
                      }}
                    >
                      {release.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>


                    <div className="card-info">

                      <h3>
                        {release.name}
                      </h3>

                      <p className="card-due">
                        Due: {release.date}
                      </p>

                      <p className="card-desc">
                        {release.additionalInfo ||
                          'No notes provided'}
                      </p>

                    </div>

                  </div>


                  <div className="card-right">

                    <div className="card-progress-col">

                      <span
                        className={`status-pill ${formattedStatus}`}
                      >
                        {formattedStatus}
                      </span>


                      <span className="card-step-text">
                        {completedCount} /{' '}
                        {stepsForThis.length}{' '}
                        steps completed
                      </span>


                      <div className="progress-track">

                        <div
                          className="progress-fill"
                          style={{
                            width: `${percent}%`
                          }}
                        />

                      </div>

                    </div>


                    <span className="card-chevron">
                      ›
                    </span>

                  </div>

                </div>

              );

            })}

          </div>

        </section>


        {/* ==========================================
            3. RIGHT RELEASE DETAIL PANEL
            ========================================== */}

        {activeRelease && (

          <aside className="detail-panel">

            <div className="detail-header">

              <div
                className="app-icon-badge"
                style={{
                  backgroundColor: '#0f172a',
                  width: '48px',
                  height: '48px'
                }}
              >
                {activeRelease.name
                  .charAt(0)
                  .toUpperCase()}
              </div>


              <div
                className="detail-title-info"
                style={{
                  flex: 1
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'space-between'
                  }}
                >

                  <h2>
                    {activeRelease.name}
                  </h2>

                  <span
                    className={`status-pill ${
                      formatStatus(
                        activeRelease.status
                      )
                    }`}
                  >
                    {formatStatus(
                      activeRelease.status
                    )}
                  </span>

                </div>


                <p>
                  Due: {activeRelease.date}
                </p>


                <p
                  style={{
                    color:
                      'var(--text-muted)'
                  }}
                >
                  {activeRelease.additionalInfo ||
                    'No notes'}
                </p>

              </div>

            </div>


            {/* Completion Banner */}

            {isCompleted &&
              !isForceEditing && (

                <div className="completion-banner">

                  <div className="completion-banner-text">
                    <span>✓</span>
                    Release Completed
                  </div>


                  <button
                    className="btn-reopen"
                    onClick={() =>
                      setIsForceEditing(true)
                    }
                  >
                    Edit Checklist
                  </button>

                </div>

              )}


            {/* Checklist Header */}

            <div>

              <div className="checklist-title-row">

                <h4>
                  Release Checklist
                </h4>

                <span>

                  {
                    (
                      activeRelease.completedSteps ||
                      []
                    ).filter(id =>
                      currentSteps.some(
                        s => s.id === id
                      )
                    ).length
                  }

                  {' / '}

                  {currentSteps.length}{' '}
                  completed

                </span>

              </div>


              <div
                className="progress-track"
                style={{
                  width: '100%',
                  height: '8px'
                }}
              >

                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      currentSteps.length > 0
                        ? (
                            (
                              activeRelease.completedSteps ||
                              []
                            ).filter(id =>
                              currentSteps.some(
                                s => s.id === id
                              )
                            ).length /
                            currentSteps.length
                          ) * 100
                        : 0
                    }%`
                  }}
                />

              </div>

            </div>


            {/* Checklist Steps */}

            <div className="checklist-container">

              {currentSteps.map(
                (step, index) => {

                  const isChecked =
                    activeRelease
                      .completedSteps
                      ?.includes(step.id);


                  return (

                    <div
                      key={step.id}
                      className="check-item-row"

                      onClick={() => {

                        if (
                          !isCompleted ||
                          isForceEditing
                        ) {

                          handleToggleStep(
                            activeRelease,
                            step.id
                          );

                        }

                      }}

                      style={{
                        cursor:
                          isCompleted &&
                          !isForceEditing
                            ? 'default'
                            : 'pointer',

                        opacity:
                          isCompleted &&
                          !isForceEditing
                            ? 0.75
                            : 1
                      }}
                    >

                      <div
                        className={`check-box-custom ${
                          isChecked
                            ? 'checked'
                            : ''
                        }`}
                      >
                        {isChecked && '✓'}
                      </div>


                      <span className="step-num">
                        {index + 1}.
                      </span>


                      <span
                        className={`check-item-text ${
                          isChecked
                            ? 'completed'
                            : ''
                        }`}
                      >
                        {step.label}
                      </span>


                      {/* Remove Step */}

                      {(!isCompleted ||
                        isForceEditing) && (

                        <button
                          type="button"
                          className="btn-remove-step"
                          title="Remove step"

                          onClick={(e) => {

                            e.stopPropagation();

                            handleRemoveStep(
                              step.id
                            );

                          }}
                        >
                          ✕
                        </button>

                      )}

                    </div>

                  );

                }
              )}


              {/* Add Custom Step */}

              {(!isCompleted ||
                isForceEditing) && (

                <form
                  onSubmit={
                    handleAddCustomStep
                  }
                  className="checklist-add-row"
                >

                  <input
                    type="text"
                    className="input-add-step"
                    placeholder="+ Add custom checklist step..."
                    value={newStepLabel}
                    onChange={(e) =>
                      setNewStepLabel(
                        e.target.value
                      )
                    }
                  />


                  <button
                    type="submit"
                    className="btn-add-step"
                  >
                    Add
                  </button>

                </form>

              )}

            </div>


            {/* Additional Information */}

            <div className="detail-info-section">

              <h4>
                Additional Information
              </h4>


              {editingNotes ? (

                <div
                  style={{
                    marginBottom: '1.25rem'
                  }}
                >

                  <textarea
                    className="modal-input"
                    rows={3}
                    value={notesText}
                    onChange={(e) =>
                      setNotesText(
                        e.target.value
                      )
                    }
                  />


                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '0.5rem'
                    }}
                  >

                    <button
                      className="btn-submit"
                      onClick={
                        handleSaveNotes
                      }
                    >
                      Save
                    </button>


                    <button
                      className="btn-cancel"
                      onClick={() =>
                        setEditingNotes(false)
                      }
                    >
                      Cancel
                    </button>

                  </div>

                </div>

              ) : (

                <div className="detail-info-box">

                  {activeRelease
                    .additionalInfo ||
                    'No additional information.'}

                </div>

              )}


              <div className="detail-actions-row">

                <button
                  className="btn-outline"

                  onClick={() => {

                    setEditingNotes(true);

                    setNotesText(
                      activeRelease
                        .additionalInfo || ''
                    );

                  }}
                >
                  Edit Information
                </button>


                <button
                  className="btn-outline-danger"
                  onClick={() =>
                    handleDelete(
                      activeRelease.id
                    )
                  }
                >
                  Delete Release
                </button>

              </div>

            </div>

          </aside>

        )}

      </main>


      {/* ==========================================
          4. CREATE RELEASE MODAL
          ========================================== */}

      {showCreateModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowCreateModal(false)
          }
        >

          <div
            className="modal-dialog"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h3>
                Create Release
              </h3>

              <button
                className="btn-close"
                onClick={() =>
                  setShowCreateModal(false)
                }
              >
                ✕
              </button>

            </div>


            <form onSubmit={handleCreate}>

              <div className="modal-body">

                <div>

                  <label className="input-label">
                    Release Name{' '}
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. E-Commerce v2.0"
                    className="modal-input"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                  />

                </div>


                <div>

                  <label className="input-label">
                    Due Date{' '}
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    required
                    className="modal-input"
                    value={date}
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                  />

                </div>


                <div>

                  <label className="input-label">
                    Additional Information
                  </label>

                  <textarea
                    rows={3}
                    placeholder="e.g. First public release"
                    className="modal-input"
                    value={additionalInfo}
                    onChange={(e) =>
                      setAdditionalInfo(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>


              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="btn-submit"
                >
                  Create Release
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ==========================================
          5. SETTINGS MODAL
          ========================================== */}

      {showSettingsModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowSettingsModal(false)
          }
        >

          <div
            className="modal-dialog"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h3>
                Settings
              </h3>

              <button
                className="btn-close"
                onClick={() =>
                  setShowSettingsModal(false)
                }
              >
                ✕
              </button>

            </div>


            <div className="modal-body">

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center'
                }}
              >

                <div>

                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    Appearance
                  </div>


                  <div
                    style={{
                      fontSize: '0.78rem',
                      color:
                        'var(--text-muted)'
                    }}
                  >
                    Switch between Light and Dark interface
                  </div>

                </div>


                <button
                  className="btn-cancel"
                  onClick={toggleTheme}
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '0.5rem'
                  }}
                >
                  {theme === 'light'
                    ? '🌙 Dark Mode'
                    : '☀️️ Light Mode'}
                </button>

              </div>

            </div>


            <div className="modal-footer">

              <button
                className="btn-submit"
                onClick={() =>
                  setShowSettingsModal(false)
                }
              >
                Done
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
