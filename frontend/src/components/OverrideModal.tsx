import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ScheduledBlock } from '../types';
import { X } from 'lucide-react';
import { planApi } from '../api/client';

interface Props {
  block: ScheduledBlock | null;
  planId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OverrideModal({ block, planId, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!block) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await planApi.overrideBlock(planId, block.block_id, {
        explanation: reason,
        status: 'Rejected' // or custom logic
      });
      onSuccess();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <Dialog.Root open={!!block} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 rounded-lg p-6 w-[500px] z-50 text-slate-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-4">Override Block</Dialog.Title>
          <Dialog.Close className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X size={20} />
          </Dialog.Close>

          <div className="mb-6 space-y-2 text-sm">
            <p><span className="text-slate-400">Corridor:</span> {block.corridor_name}</p>
            <p><span className="text-slate-400">Date:</span> {block.block_date}</p>
            <p><span className="text-slate-400">Window:</span> {new Date(block.start_datetime).toLocaleTimeString()} – {new Date(block.end_datetime).toLocaleTimeString()}</p>
            <p><span className="text-slate-400">Departments:</span> {block.departments_involved.join(', ')}</p>
            <p><span className="text-slate-400">Tasks:</span> {block.tasks?.length ?? 0}</p>
            <p className="text-slate-500 text-xs mt-2 italic">{block.explanation}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Reason for override</label>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-white"
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. VIP movement, track availability issue..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded bg-brand text-white hover:bg-indigo-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Override'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
