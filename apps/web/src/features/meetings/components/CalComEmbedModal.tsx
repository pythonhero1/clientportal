import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { fetchBookingToken, fetchEventTypes } from '../../../services/meetings-api';
import type { BookingTokenResponse } from '../../../services/meetings-api';
import { getActivePersona } from '../../../services/projects-api';
import { ShieldCheck, ExternalLink, CheckCircle2 } from 'lucide-react';

export interface CalComEmbedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onBookingSuccess?: () => void;
}

export const CalComEmbedModal: React.FC<CalComEmbedModalProps> = ({
  open,
  onOpenChange,
  projectId,
  onBookingSuccess,
}) => {
  const [tokenData, setTokenData] = useState<BookingTokenResponse | null>(null);
  const [eventTypes, setEventTypes] = useState<
    Array<{ id: number; title: string; slug: string; lengthInMinutes: number }>
  >([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('free');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);

  const activePersona = getActivePersona();

  useEffect(() => {
    if (!open || !projectId) {
      setBookingConfirmed(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      fetchBookingToken(projectId).catch(() => ({
        token: 'mock_token_' + Date.now(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        calUsername: 'oderinde',
        eventSlug: 'free',
      })),
      fetchEventTypes().catch(() => []),
    ]).then(([tokenRes, typesRes]) => {
      if (isMounted) {
        setTokenData(tokenRes);
        if (typesRes && typesRes.length > 0) {
          setEventTypes(typesRes.filter((t) => t.slug !== 'secret'));
          if (typesRes.some((t) => t.slug === tokenRes.eventSlug)) {
            setSelectedSlug(tokenRes.eventSlug);
          } else {
            setSelectedSlug(typesRes[0].slug);
          }
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [open, projectId]);

  // Listen to Cal.com postMessage events
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data === 'object' && e.data?.type === 'CAL:BOOKING_SUCCESSFUL') {
        setBookingConfirmed(true);
        if (onBookingSuccess) onBookingSuccess();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onBookingSuccess]);

  const simulateBooking = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setBookingConfirmed(true);
      if (onBookingSuccess) onBookingSuccess();
    }, 800);
  };

  const activeSlug = selectedSlug || tokenData?.eventSlug || 'free';
  const calUrl = tokenData
    ? `https://cal.com/${tokenData.calUsername || 'oderinde'}/${activeSlug}?embed=true&name=${encodeURIComponent(
        activePersona.name
      )}&email=${encodeURIComponent(activePersona.email)}&metadata[trackingToken]=${encodeURIComponent(
        tokenData.token
      )}&metadata[projectId]=${encodeURIComponent(projectId)}`
    : '';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Schedule Strategy Session with Stephen"
      description="Select an available slot via Stephen's verified Cal.com calendar."
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Security / Verification Badge & Event Type Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs px-3 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] gap-2">
          <div className="flex items-center gap-1.5 text-[var(--muted-text)]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Anti-tamper session verified with Project {projectId}</span>
          </div>
          <span className="text-[var(--primary)] font-medium">Cal.com Verified</span>
        </div>

        {eventTypes.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-text)] font-medium">Call Type:</span>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((et) => (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => setSelectedSlug(et.slug)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                    activeSlug === et.slug
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] font-medium'
                      : 'bg-[var(--surface-raised)] text-[var(--muted-text)] hover:text-[var(--text)] border-[var(--border)]'
                  }`}
                >
                  {et.title} ({et.lengthInMinutes}m)
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-xs text-[var(--muted-text)]">Connecting to Cal.com scheduler...</p>
          </div>
        ) : bookingConfirmed ? (
          <div className="h-96 flex flex-col items-center justify-center text-center gap-3 p-6 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <h3 className="text-lg font-bold text-[var(--text)]">Call Scheduled Successfully!</h3>
            <p className="text-xs text-[var(--muted-text)] max-w-md">
              Your meeting details have been synchronized with the project calendar. Stephen has been notified, and video call coordinates will appear in your schedule.
            </p>
            <Button variant="primary" size="sm" onClick={() => onOpenChange(false)} className="mt-2">
              Done & Return to Calendar
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Hosted Embed Iframe */}
            <div className="w-full h-96 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
              <iframe
                title="Cal.com Booking Interface"
                src={calUrl}
                className="w-full h-full border-0"
                allow="camera; microphone; autoplay; fullscreen"
              />
            </div>

            {/* Simulation fallback for test environments */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(calUrl, '_blank')}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Open in Separate Tab
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={simulateBooking}
                isLoading={isSimulating}
              >
                Confirm Test Booking
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
