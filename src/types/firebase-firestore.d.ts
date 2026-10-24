declare module '@firebase/firestore' {
  export interface Firestore {
    type: string;
    app: any;
    toJSON(): object;
  }
  export interface DocumentReference<T = any> {
    id: string;
    path: string;
    parent: any;
    firestore: Firestore;
  }
  export interface CollectionReference<T = any> extends Query<T> {
    id: string;
    path: string;
    parent: DocumentReference | null;
  }
  export interface Query<T = any> {
    type: string;
    firestore: Firestore;
  }
  export interface DocumentData {
    [field: string]: any;
  }
  export interface DocumentSnapshot<T = DocumentData> {
    id: string;
    ref: DocumentReference<T>;
    exists(): boolean;
    data(): T | undefined;
    get(fieldPath: string): any;
  }
  export interface QuerySnapshot<T = DocumentData> {
    docs: DocumentSnapshot<T>[];
    size: number;
    empty: boolean;
    forEach(callback: (result: DocumentSnapshot<T>) => void): void;
  }
  export interface FirestoreError extends Error {
    code: string;
    message: string;
    name: string;
    stack?: string;
  }
  export interface SetOptions {
    merge?: boolean;
    mergeFields?: string[];
  }
}
