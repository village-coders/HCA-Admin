import React, {useState} from 'react';

/**
 * SecurityWarningModal
 * Visual security verification modal modeled after retro/classic window warning alert.
 * Prompts the administrator to review and verify document integrity before upload.
 */
const SecurityWarningModal = ({
  isOpen,
  title = 'SECURITY VERIFICATION ALERT',
  warningHeading = 'WARNING!',
  files = [],
  onContinue,
  onCancel,
  setSecurityModal
}) => {
  if (!isOpen) return null;

  // const [loopCount, setLoopCount] = useState(0);

  // Format file names if provided
  const fileNames = Array.isArray(files)
    ? files.filter(Boolean).map(f => (typeof f === 'string' ? f : f.name))
    : files?.name ? [files.name] : [];



  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '16px'
      }}
    >
      {/* Modal Window Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '2px solid #1f2937',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          animation: 'securityModalPop 0.18s ease-out'
        }}
      >
        {/* Window Title Bar */}
        <div
          style={{
            backgroundColor: '#1f2937',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}
        >
          <span
            style={{
              color: '#e5e7eb',
              fontSize: '11.5px',
              fontFamily: 'monospace, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}
          >
            {title}
          </span>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Window Content Body */}
        <div
          style={{
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Left Text & Actions Section */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: '0 0 10px 0',
                fontSize: '28px',
                fontWeight: 900,
                color: '#111827',
                letterSpacing: '0.05em',
                lineHeight: 1.1,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {warningHeading}
            </h2>

            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '12.5px',
                lineHeight: 1.5,
                color: '#4b5563'
              }}
            >
              Malware Detection Warning: The uploaded file contains malicious code, an active virus signature, or unauthorized script injection and cannot be processed. Please upload a clean, verified file.
            </p>

            {/* Target file indicators */}
            {fileNames.length > 0 && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #050506ff',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#334151',
                  maxHeight: '68px',
                  overflowY: 'auto'
                }}
              >
                <span style={{ fontWeight: 700, color: '#475569' }}>Target File(s): </span>
                {fileNames.join(', ')}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={onContinue}
                style={{
                  padding: '7px 18px',
                  backgroundColor: '#475569',
                  color: '#ffffff',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#334155')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#475569')}
              >
                Continue Anyway
              </button>
            </div>
          </div>

          {/* Right Danger X Graphic */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 4px 8px rgba(220, 38, 38, 0.25))' }}
            >
              {/* Danger red circle without blue outer border */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="#DC2626"
              />
              {/* Inner accent ring */}
              <circle
                cx="60"
                cy="60"
                r="46"
                stroke="#EF4444"
                strokeWidth="2"
                fill="none"
              />
              {/* Bold White Danger X */}
              <path
                d="M42 42 L78 78 M78 42 L42 78"
                stroke="#FFFFFF"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityWarningModal;
