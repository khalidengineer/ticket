"use client";

import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2, Settings, Download, X } from 'lucide-react';

const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyh6qH4Zq853q6iPvx5N1zGzU5N3fK9Xz8_mail/exec";
const SENDER_EMAIL = "it.ncr@samosaparty.co.in";
const RECIPIENT_EMAIL = "m4mohammadkhalid@gmail.com";

export default function SendMailButton() {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [scriptUrl, setScriptUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('TICKET_MAIL_SCRIPT_URL') || '';
    }
    return '';
  });
  const [alertInfo, setAlertInfo] = useState(null);

  const handleCaptureAndSend = async () => {
    setLoading(true);
    setStatusMessage('Capturing screenshot...');
    setAlertInfo(null);

    try {
      // Dynamic import to prevent SSR issues
      const html2canvas = (await import('html2canvas')).default;

      // Select container or main content
      const targetElement = document.querySelector('main') || document.querySelector('.container') || document.body;
      
      const canvas = await html2canvas(targetElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#f8fafc',
      });

      const base64Image = canvas.toDataURL('image/png');
      setCapturedImage(base64Image);

      const activeScriptUrl = scriptUrl || localStorage.getItem('TICKET_MAIL_SCRIPT_URL');

      if (!activeScriptUrl) {
        setLoading(false);
        setStatusMessage('');
        setShowModal(true);
        return;
      }

      setStatusMessage('Sending email from it.ncr@samosaparty.co.in...');

      const response = await fetch(activeScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Prevents pre-flight CORS issues with Apps Script
        },
        body: JSON.stringify({
          sender: SENDER_EMAIL,
          to: RECIPIENT_EMAIL,
          subject: `Operations Central Dashboard Report - ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
          image: base64Image,
        }),
      });

      const result = await response.json().catch(() => ({ success: true }));

      if (result.success !== false) {
        setAlertInfo({
          type: 'success',
          msg: `Mail successfully sent to ${RECIPIENT_EMAIL} with dashboard screenshot!`,
        });
      } else {
        throw new Error(result.error || 'Failed to send');
      }
    } catch (err) {
      console.error('Mail error:', err);
      setShowModal(true);
      setAlertInfo({
        type: 'error',
        msg: `Unable to send directly: ${err.message}. You can configure Google Apps Script or download the screenshot.`,
      });
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleSaveScriptUrl = (url) => {
    setScriptUrl(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('TICKET_MAIL_SCRIPT_URL', url.trim());
    }
  };

  const downloadScreenshot = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.download = `Operations-Dashboard-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = capturedImage;
    link.click();
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleCaptureAndSend}
          disabled={loading}
          className="send-mail-nav-btn"
          title={`Send Dashboard screenshot to ${RECIPIENT_EMAIL}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '0.88rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(37,99,235,0.25)',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{statusMessage || 'Processing...'}</span>
            </>
          ) : (
            <>
              <Mail size={16} />
              <span>Send Mail</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Email Configuration"
        >
          <Settings size={15} />
        </button>
      </div>

      {/* Alert Banner / Toast */}
      {alertInfo && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: alertInfo.type === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '450px',
            fontSize: '0.9rem',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          {alertInfo.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span style={{ flex: 1 }}>{alertInfo.msg}</span>
          <button
            onClick={() => setAlertInfo(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Configuration & Preview Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              color: '#1e293b',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={22} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Send Mail Setup & Preview</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#f1f5f9', padding: '14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.9rem' }}>
              <p style={{ margin: '4px 0' }}><strong>Sender:</strong> {SENDER_EMAIL}</p>
              <p style={{ margin: '4px 0' }}><strong>To:</strong> {RECIPIENT_EMAIL}</p>
              <p style={{ margin: '4px 0' }}><strong>Attachment:</strong> Live Dashboard Screenshot (PNG)</p>
            </div>

            {capturedImage && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Screenshot Preview:</span>
                  <button
                    onClick={downloadScreenshot}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={14} /> Download PNG
                  </button>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', maxHeight: '180px' }}>
                  <img src={capturedImage} alt="Dashboard Preview" style={{ width: '100%', display: 'block' }} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                Google Apps Script Web App URL (for 1-click automated send):
              </label>
              <input
                type="text"
                value={scriptUrl}
                onChange={(e) => handleSaveScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Google Apps Script deployed under <b>{SENDER_EMAIL}</b> automatically sends the email directly with the attached screenshot.
              </span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.82rem' }}>
              <strong>📋 1-Minute Google Apps Script Code:</strong>
              <pre
                style={{
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                  padding: '10px',
                  borderRadius: '6px',
                  marginTop: '8px',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                }}
              >{`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var base64 = data.image.split(',')[1];
  var blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/png', 'Dashboard-Report.png');
  MailApp.sendEmail({
    to: data.to,
    subject: data.subject,
    htmlBody: '<p>Attached is the live dashboard screenshot.</p>',
    attachments: [blob]
  });
  return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
}`}</pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {capturedImage && (
                <button
                  onClick={handleCaptureAndSend}
                  disabled={loading}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Send Now
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
