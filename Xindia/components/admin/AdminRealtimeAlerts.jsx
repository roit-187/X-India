'use client';

import { useEffect, useRef } from 'react';

/**
 * Synthesizes an alert chime using Web Audio API.
 * Frequency envelope: D5 (587.33 Hz) -> A5 (880.00 Hz) with exponential decay.
 * Zero external audio assets required; immune to CORS and network latency.
 */
function playAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880.00, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.onended = () => {
      ctx.close().catch(() => {});
    };

    osc.start(now);
    osc.stop(now + 0.4);

    // Fallback cleanup timer in case onended does not fire
    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 600);
  } catch (err) {
    // Silently ignore browser autoplay restriction errors
  }
}

export default function AdminRealtimeAlerts() {
  const seenAlertIdsRef = useRef(new Set());
  const isFirstPollRef = useRef(true);

  // Request browser desktop notification permission on first user interaction
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      const handleUserInteraction = () => {
        try {
          Notification.requestPermission().catch(() => {});
        } catch {
          // ignore
        }
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('keydown', handleUserInteraction);
      };

      window.addEventListener('click', handleUserInteraction, { once: true });
      window.addEventListener('keydown', handleUserInteraction, { once: true });

      return () => {
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('keydown', handleUserInteraction);
      };
    }
  }, []);

  // Poll alerts, pending verification requests, and moderation cases
  useEffect(() => {
    let isCancelled = false;

    const pollAlerts = async () => {
      try {
        const [alertsRes, verifRes, modRes] = await Promise.allSettled([
          fetch('/api/admin/alerts?status=OPEN&limit=10'),
          fetch('/api/admin/verification/queue?status=pending&limit=1'),
          fetch('/api/admin/dashboard/moderation-count'),
        ]);

        let openAlerts = [];
        let openAlertsCount = 0;
        if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
          const data = await alertsRes.value.json();
          if (data.success) {
            openAlerts = data.alerts || [];
            openAlertsCount = data.openCount ?? data.total ?? openAlerts.length;
          }
        }

        let pendingVerifCount = 0;
        if (verifRes.status === 'fulfilled' && verifRes.value.ok) {
          const data = await verifRes.value.json();
          if (data.success) {
            pendingVerifCount = data.total ?? (data.requests ? data.requests.length : 0);
          }
        }

        let moderationCount = 0;
        if (modRes.status === 'fulfilled' && modRes.value.ok) {
          const data = await modRes.value.json();
          if (data.success) {
            moderationCount = data.count ?? 0;
          }
        }

        if (isCancelled) return;

        // Broadcast count update for AdminSidebar badges
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('admin-counts-update', {
              detail: {
                alerts: openAlertsCount,
                verifications: pendingVerifCount,
                moderation: moderationCount,
              },
            })
          );
        }

        // Identify any unread new alerts
        const currentSeen = seenAlertIdsRef.current;
        const newAlerts = [];

        for (const alert of openAlerts) {
          if (!currentSeen.has(alert._id)) {
            currentSeen.add(alert._id);
            newAlerts.push(alert);
          }
        }

        // Trigger notifications and chime only on subsequent polls (not on initial page mount)
        if (!isFirstPollRef.current && newAlerts.length > 0) {
          playAlertChime();

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            for (const alert of newAlerts.slice(0, 3)) {
              try {
                const n = new Notification(alert.title || 'New Admin Alert', {
                  body: alert.body || 'A new alert or complaint requires operational review.',
                  icon: '/favicon.ico',
                  tag: alert._id,
                });
                n.onclick = () => {
                  window.focus();
                  window.location.href = '/admin/alerts';
                };
              } catch {
                // Ignore notification construction errors
              }
            }
          }
        }

        isFirstPollRef.current = false;
      } catch (err) {
        // Silently tolerate background fetch network dropouts
      }
    };

    // Execute first poll immediately
    pollAlerts();

    // Poll every 20 seconds
    const intervalId = setInterval(pollAlerts, 20000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return null;
}
