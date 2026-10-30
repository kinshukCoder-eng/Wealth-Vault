import { useLayoutEffect, useRef } from 'react';

// Shared keyboard behavior for every form and confirmation dialog.
export default function useDialogFocus(isOpen) {
  const dialogRef = useRef(null);
  useLayoutEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const overlay = dialog.parentElement;
    const siblings = [...overlay.parentElement.children].filter(el => el !== overlay);
    const previousInert = siblings.map(el => el.hasAttribute('inert'));
    siblings.forEach(el => el.setAttribute('inert', ''));
    const controls = () => [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')]
      .filter(el => !el.closest('[hidden], [inert]') && el.type !== 'hidden' && getComputedStyle(el).display !== 'none');
    const focusFirst = () => (controls()[0] || dialog).focus();
    focusFirst();
    const onKeyDown = event => {
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (!items.length) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    const onFocus = event => { if (!dialog.contains(event.target)) focusFirst(); };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocus);
      siblings.forEach((el, index) => { if (!previousInert[index]) el.removeAttribute('inert'); });
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [isOpen]);
  return dialogRef;
}
