'use client';
import { getAuth } from 'firebase/auth';
import type { User } from '@firebase/auth';

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

interface FirebaseAuthToken {
  name: string | null;
  email: string | null;
  email_verified: boolean;
  phone_number: string | null;
  sub: string;
  firebase: {
    identities: Record<string, string[]>;
    sign_in_provider: string;
    tenant: string | null;
  };
}

interface FirebaseAuthObject {
  uid: string;
  token: FirebaseAuthToken;
}

interface SecurityRuleRequest {
  auth: FirebaseAuthObject | null;
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds a security-rule-compliant auth object from the Firebase User.
 * @param currentUser The currently authenticated Firebase user.
 * @returns An object that mirrors request.auth in security rules, or null.
 */
function buildAuthObject(currentUser: User | null): FirebaseAuthObject | null {
  if (!currentUser) {
    return null;
  }

  const token: FirebaseAuthToken = {
    name: currentUser.displayName,
    email: currentUser.email,
    email_verified: currentUser.emailVerified,
    phone_number: currentUser.phoneNumber,
    sub: currentUser.uid,
    firebase: {
      identities: currentUser.providerData.reduce((acc: Record<string, string[]>, p: any) => {
        if (p.providerId) {
          acc[p.providerId] = [p.uid];
        }
        return acc;
      }, {} as Record<string, string[]>),
      sign_in_provider: currentUser.providerData[0]?.providerId || 'custom',
      tenant: currentUser.tenantId,
    },
  };

  return {
    uid: currentUser.uid,
    token: token,
  };
}

/**
 * Builds the complete, simulated request object for the error message.
 * It safely tries to get the current authenticated user.
 * @param context The context of the failed Firestore operation.
 * @returns A structured request object.
 */
function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  let authObject: FirebaseAuthObject | null = null;
  try {
    // Safely attempt to get the current user.
    const firebaseAuth = getAuth();
    const currentUser = firebaseAuth.currentUser;
    if (currentUser) {
      authObject = buildAuthObject(currentUser);
    }
  } catch {
    // This will catch errors if the Firebase app is not yet initialized.
    // In this case, we'll proceed without auth information.
  }

  return {
    auth: authObject,
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: context.requestResourceData ? { data: sanitizeData(context.requestResourceData) } : undefined,
  };
}

/**
 * Builds the final, formatted error message for the LLM.
 * @param requestObject The simulated request object.
 * @returns A string containing the error message and the JSON payload.
 */
function safeStringify(obj: any): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(
      obj,
      (key, value) => {
        if (
          key &&
          (key.startsWith('__react') ||
            key.startsWith('__v0') ||
            key.startsWith('_react') ||
            key === 'stateNode' ||
            key === 'return' ||
            key === 'child' ||
            key === 'alternate' ||
            key === 'memoizedProps' ||
            key === 'memoizedState' ||
            key === 'updateQueue')
        ) {
          return undefined;
        }

        if (typeof value === 'object' && value !== null) {
          if (
            (typeof Node !== 'undefined' && value instanceof Node) ||
            (typeof Window !== 'undefined' && value instanceof Window) ||
            (typeof Element !== 'undefined' && value instanceof Element) ||
            (typeof Event !== 'undefined' && value instanceof Event) ||
            value.nodeType !== undefined ||
            value.nativeElement !== undefined ||
            (value.constructor &&
              typeof value.constructor.name === 'string' &&
              (value.constructor.name.includes('Element') ||
                value.constructor.name.includes('Node') ||
                value.constructor.name.includes('Fiber') ||
                value.constructor.name.includes('Event') ||
                value.constructor.name.includes('Synthetic')))
          ) {
            return '[DOM/React Object]';
          }

          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }

        if (typeof value === 'function') {
          return '[Function]';
        }

        return value;
      },
      2
    );
  } catch {
    try {
      return String(obj);
    } catch {
      return '[Unstringifiable Object]';
    }
  }
}

function sanitizeData(data: any): any {
  if (!data) return data;
  try {
    return JSON.parse(safeStringify(data));
  } catch {
    return String(data);
  }
}

function buildErrorMessage(requestObject: SecurityRuleRequest): string {
  return `Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${safeStringify(requestObject)}`;
}

/**
 * A custom error class designed to be consumed by an LLM for debugging.
 * It structures the error information to mimic the request object
 * available in Firestore Security Rules.
 */
export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const requestObject = buildRequestObject(context);
    super(buildErrorMessage(requestObject));
    this.name = 'FirebaseError';
    this.request = requestObject;
  }
}
