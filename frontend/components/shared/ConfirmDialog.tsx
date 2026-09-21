'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
interface ConfirmDialogProps { open: boolean; onOpenChange: (v: boolean) => void; title: string; description: string; consequence?: string; onConfirm: () => void; isLoading?: boolean; confirmLabel?: string; variant?: 'destructive' | 'default'; }
export function ConfirmDialog({ open, onOpenChange, title, description, consequence, onConfirm, isLoading, confirmLabel = 'Confirm', variant = 'destructive' }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <DialogBody>
          <p className="text-slate-600">{description}</p>
          {consequence && <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700 border border-red-200">{consequence}</div>}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm} disabled={isLoading}>{isLoading ? 'Processing...' : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
