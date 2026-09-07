import clsx from 'clsx';

import { Add, CloseCircle, TickCircle } from 'iconsax-reactjs';

import { toast as sonnerToast } from 'sonner';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { applyTypography } from '@cgp/ui-kit/lib/typography';

import errorAvatar from '../assets/images/error-toast-avatar.svg';
import infoAvatar from '../assets/images/info-toast-avatar.svg';
import successAvatar from '../assets/images/success-toast-avatar.svg';
import warningAvatar from '../assets/images/warning-toast-avatar.svg';

interface ToastProps {
  id: string | number;
  dismissIds?: Array<string | number>;
  title: string;
  description: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

const TOAST_TEST_IDS: Partial<Record<NonNullable<ToastProps['type']>, string>> =
  {
    success: 'toast-success-message',
    error: 'toast-error-message',
  };

function Toast({
  id,
  dismissIds,
  title,
  description,
  type,
}: Readonly<ToastProps>) {
  let avatarSrc = warningAvatar;
  if (type === 'success') avatarSrc = successAvatar;
  else if (type === 'error') avatarSrc = errorAvatar;
  else if (type === 'info') avatarSrc = infoAvatar;

  return (
    <div
      role="presentation"
      className="pointer-events-auto relative"
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
    >
      <div
        data-testid={type ? TOAST_TEST_IDS[type] : undefined}
        className="relative z-9999 rounded-2xl bg-white"
        style={{ fontFamily: 'Plus Jakarta Sans Variable, sans-serif' }}
      >
        <div className="flex w-99.5 items-center justify-between gap-3 p-6 sm:w-102.25">
          <div className="flex items-center justify-center gap-3">
            {type === 'error' && (
              <div className="flex size-11 min-w-11 items-center justify-center rounded-full bg-red-100">
                <CloseCircle
                  size="24"
                  className="text-red-500"
                  variant="Bold"
                />
              </div>
            )}
            {type === 'success' && (
              <div className="flex size-11 min-w-11 items-center justify-center rounded-full bg-green-100">
                <TickCircle
                  size="24"
                  className="text-green-500"
                  variant="Bold"
                />
              </div>
            )}

            {type === 'warning' && (
              <div>
                <svg
                  data-testid="warning-circle-svg"
                  xmlns="http://www.w3.org/2000/svg"
                  width="44"
                  height="44"
                  viewBox="0 0 44 44"
                  fill="none"
                >
                  <circle cx="22" cy="22" r="22" fill="#FEF9C3" />
                  <circle cx="22" cy="22" r="10" fill="#EAB308" />
                  <path
                    d="M22 18V23.25"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 26.4502V26.5502"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            {type === 'info' && (
              <div>
                <svg
                  data-testid="info-circle-svg"
                  xmlns="http://www.w3.org/2000/svg"
                  width="44"
                  height="44"
                  viewBox="0 0 44 44"
                  fill="none"
                >
                  <circle cx="22" cy="22" r="22" fill="#DBEAFE" />
                  <circle cx="22" cy="22" r="10" fill="#3B82F6" />
                  <path
                    d="M22 18V23.25"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 26.4502V26.5502"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            <div>
              <p className={clsx(applyTypography('h5'), 'text-slate-900')}>
                {title}
              </p>
              <p
                className={clsx(
                  applyTypography('body'),
                  'text-xm text-slate-600'
                )}
              >
                {description}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="pointer-events-auto relative z-10000 size-6"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              const idsToDismiss = dismissIds?.length ? dismissIds : [id];
              idsToDismiss.forEach(toDismissId => {
                sonnerToast.dismiss(toDismissId);
              });
            }}
          >
            <Add className="rotate-45 text-slate-900" />
          </Button>
        </div>
      </div>
      <img
        src={avatarSrc}
        alt={`${(type || 'info').charAt(0).toUpperCase() + (type || 'info').slice(1)} Avatar`}
        className="absolute -top-43.75 right-2.5 -z-10"
        style={{ pointerEvents: 'none' }}
        onError={e => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}

function SuccessToast(toast: Omit<ToastProps, 'id' | 'type'>) {
  return sonnerToast.custom(
    id => (
      <Toast
        id={id}
        title={toast.title}
        description={toast.description}
        type="success"
      />
    ),
    {
      className: 'toast-type-success',
    }
  );
}

function ErrorToast(toast: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom(
    id => (
      <Toast
        id={id}
        title={toast.title}
        description={toast.description}
        type="error"
      />
    ),
    { className: 'toast-type-error' }
  );
}

function WarningToast(toast: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom(
    id => (
      <Toast
        id={id}
        title={toast.title}
        description={toast.description}
        type="warning"
      />
    ),
    {
      className: 'toast-type-warning',
    }
  );
}

function InfoToast(toast: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom(
    id => (
      <Toast
        id={id}
        title={toast.title}
        description={toast.description}
        type="info"
      />
    ),
    {
      className: 'toast-type-info',
    }
  );
}

export { SuccessToast, ErrorToast, WarningToast, InfoToast };
