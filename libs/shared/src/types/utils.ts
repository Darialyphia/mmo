export type Nullable<T> = T | null | undefined;
export type NonNullable<T> = Exclude<T, undefined | null>;
export type PartialBy<T, K extends keyof T = never> = Omit<T, K> &
  Partial<Pick<T, K>>;
export type Boundaries<T = number> = { min: T; max: T };
export type Range = Boundaries<number>;
export type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T];
export type Matrix<T> = T[][];
export type AnyObject = { [key: string]: any };
export type AnyFunction = (...args: any[]) => any;
export type Keys<T> = keyof T;
export type Values<T> = T[keyof T];
export type Override<A, B> = Omit<A, keyof B> & B;
export type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };
export type Constructor<T = AnyObject> = new (...args: any[]) => T;
export type AnyConstructor = Constructor<AnyObject>;
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;
export type MaybePromise<T> = T | Promise<T>;
export type Iterableify<T> = { [K in keyof T]: Iterable<T[K]> };
export type Defined<T> = Extract<T, undefined | null>;

export type ApiError = {
  message: string;
  statusCode: number;
  meta: Nullable<AnyObject>;
};
