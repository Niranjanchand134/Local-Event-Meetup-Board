import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { rsvpApi } from '../../../lib/rsvpApi';
import type { RsvpOut } from '../../../types';

export const Route = createFileRoute('/payments/esewa/callback')({
  component: EsewaCallbackPage,
});

function EsewaCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [rsvp, setRsvp] = useState<RsvpOut | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transactionUuid = params.get('transaction_uuid');

    if (!transactionUuid) {
      setErrorMsg('No transaction ID found in the callback URL. Payment may have been cancelled.');
      setStatus('failed');
      return;
    }

    rsvpApi
      .verifyPayment(transactionUuid)
      .then((result) => {
        setRsvp(result);
        setStatus('success');
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail ?? 'Payment verification failed. Please contact support.';
        setErrorMsg(msg);
        setStatus('failed');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-20 h-20 rounded-full bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-[40px] text-[#ffb4ab]">
            progress_activity
          </span>
        </div>
        <div className="text-center">
          <h2 className="font-headline-lg text-[24px] text-[#e5e2e1] font-bold mb-2">Verifying Payment…</h2>
          <p className="font-data-mono text-[13px] text-[#e6bdb8]">
            Please wait while we confirm your payment with eSewa
          </p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center gap-6 px-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-[#690005]/20 border border-[#ffb4ab]/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-[40px] text-[#ffb4ab]">error</span>
        </div>
        <div>
          <h2 className="font-headline-lg text-[24px] text-[#e5e2e1] font-bold mb-2">Payment Failed</h2>
          <p className="font-data-mono text-[13px] text-[#e6bdb8] leading-relaxed">{errorMsg}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => navigate({ to: '/events' })}
            className="flex-1 bg-[#2a2a2a] text-[#e5e2e1] font-label-caps text-[12px] py-3.5 rounded-xl hover:bg-[#353534] transition-colors font-bold"
          >
            BROWSE EVENTS
          </button>
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="flex-1 bg-[#ffb4ab] text-[#690005] font-label-caps text-[12px] py-3.5 rounded-xl hover:bg-[#ffdad6] transition-colors font-bold"
          >
            MY DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  // Success
  const statusCfg: Record<string, { label: string; color: string; icon: string }> = {
    confirmed: { label: 'Confirmed', color: 'text-green-400', icon: 'check_circle' },
    waitlisted: { label: 'Waitlisted', color: 'text-yellow-400', icon: 'schedule' },
    pending_payment: { label: 'Pending', color: 'text-orange-400', icon: 'hourglass_empty' },
  };
  const sc = statusCfg[rsvp?.status ?? 'confirmed'] ?? statusCfg.confirmed;

  return (
    <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center gap-6 px-6 text-center max-w-md mx-auto">
      <div className="w-24 h-24 rounded-full bg-[#ffb4ab]/10 border border-[#ffb4ab]/40 flex items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-[#ffb4ab] animate-bounce">
          check_circle
        </span>
      </div>

      <div>
        <h2 className="font-headline-lg text-[28px] text-[#e5e2e1] font-bold mb-2">Payment Verified!</h2>
        <p className="font-data-mono text-[13px] text-[#e6bdb8]">
          Your spot has been reserved successfully.
        </p>
      </div>

      {rsvp && (
        <div className="w-full bg-[#201f1f] border border-[#353534] p-5 rounded-xl text-left space-y-3">
          <div>
            <span className="font-label-caps text-[10px] text-[#e6bdb8] block mb-1 font-bold">RSVP ID</span>
            <span className="font-data-mono text-[13px] text-[#ffb4ab] font-bold">
              #{rsvp.id.slice(0, 12).toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-label-caps text-[10px] text-[#e6bdb8] block mb-1 font-bold">STATUS</span>
            <span className={`font-data-mono text-[13px] font-bold flex items-center gap-2 ${sc.color}`}>
              <span className="material-symbols-outlined text-[16px]">{sc.icon}</span>
              {sc.label.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-3 w-full">
        <button
          onClick={() => navigate({ to: '/events' })}
          className="flex-1 bg-[#2a2a2a] text-[#e5e2e1] font-label-caps text-[12px] py-3.5 rounded-xl hover:bg-[#353534] transition-colors font-bold"
        >
          BROWSE EVENTS
        </button>
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          className="flex-1 bg-[#ffb4ab] text-[#690005] font-label-caps text-[12px] py-3.5 rounded-xl hover:bg-[#ffdad6] transition-colors font-bold"
        >
          MY DASHBOARD
        </button>
      </div>
    </div>
  );
}
