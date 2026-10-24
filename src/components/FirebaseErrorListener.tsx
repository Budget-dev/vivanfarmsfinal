'use client';

import React, { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ShieldAlert, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';

/**
 * Global listener for Firebase permission and operation errors.
 * Instead of throwing and crashing the page, it displays an elegant,
 * non-disruptive diagnostic card at the bottom of the screen with a plain-English explanation.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleError = (incomingError: FirestorePermissionError) => {
      console.warn('[Firebase Security/Permission Notice]:', incomingError);
      setError(incomingError);
      setIsDismissed(false); // Re-open if a new error occurs
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (!error || isDismissed || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const requestedPath = error.request?.path || 'database collection';
  const operation = error.request?.method || 'read';
  const isAuthenticated = !!error.request?.auth?.uid;

  return (
    <div 
      className="fixed bottom-5 right-5 z-[9999] max-w-md w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
      role="alert"
      aria-live="polite"
    >
      <div className="bg-[#FFFDF9] border border-amber-300 rounded-2xl shadow-xl overflow-hidden text-left">
        {/* Card Header */}
        <div className="px-4 py-3 bg-amber-50/80 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-full mr-2">
                Firebase Notice
              </span>
              <span className="text-xs font-bold text-gray-800">
                Data Access Restricted
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Content */}
        <div className="p-4">
          <p className="text-xs text-[#5B4E38] leading-relaxed mb-3">
            The website attempted to <strong className="text-gray-900 font-semibold">{operation}</strong> live data from{' '}
            <code className="px-1.5 py-0.5 rounded bg-amber-100/60 text-amber-950 font-mono text-[11px]">
              {requestedPath.replace(/^\/databases\/\(default\)\/documents\//, '')}
            </code>
            , but Firestore security rules restricted this operation.
          </p>

          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/50 text-[11px] text-[#6B5A3D] mb-3">
            {!isAuthenticated ? (
              <span>
                <strong>Why this happened:</strong> You are currently browsing as a guest. If this section requires administrative privileges or an active customer account, please log in.
              </span>
            ) : (
              <span>
                <strong>Why this happened:</strong> Your account does not have permission to access this collection. If you are an administrator, verify your email in <code className="font-mono">firestore.rules</code>.
              </span>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {!isAuthenticated && (
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1B5E3B] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#14482D] transition-colors"
                >
                  <span>Admin Login</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              <span>{showDetails ? 'Hide' : 'Details'}</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Technical Details Accordion */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-amber-200/50">
              <pre className="p-2.5 bg-gray-900 text-amber-200 rounded-lg text-[10px] font-mono overflow-x-auto max-h-36 whitespace-pre-wrap leading-tight">
                {JSON.stringify({
                  operation,
                  path: requestedPath,
                  authenticated: isAuthenticated,
                  authUid: error.request?.auth?.uid || null,
                  userEmail: error.request?.auth?.token?.email || null,
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
