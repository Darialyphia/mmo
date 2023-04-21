export type ECSEntityId = string;

export type ECSEntity = {
  id: ECSEntityId;
};

export type ECSComponent<T extends string, Props extends {} = {}> = {
  [key in T]: Props;
};

export type BrandFromComponent<C extends ECSComponent<string>> =
  C extends ECSComponent<infer Brand> ? Brand : never;

export type BrandsFromComponents<C extends ECSComponent<string>[]> = {
  [Key in keyof C]: BrandFromComponent<C[Key]>;
};

export type ECSComponentProps<C extends ECSComponent<string>> =
  C extends ECSComponent<any, infer Props> ? Props : never;

export const has =
  <C extends ECSComponent<string>>(brand: BrandFromComponent<C>) =>
  <E extends ECSEntity = ECSEntity>(e: E): e is E & C =>
    brand in e;

type ECSComponentBuilder<C extends ECSComponent<string>> =
  ECSComponentProps<C> extends Record<string, never>
    ? () => C
    : (props: ECSComponentProps<C>) => () => C;

export const ecsComponent = <C extends ECSComponent<string>>(
  brand: BrandFromComponent<C>
): ECSComponentBuilder<C> =>
  ((props?: ECSComponentProps<C>) => {
    if (props === undefined) return { [brand]: {} };
    return () => ({ [brand]: props });
  }) as ECSComponentBuilder<C>;

export type ECSEntityBuilder<T extends ECSEntity> = {
  with<C extends ECSComponent<string>>(
    component: () => C
  ): ECSEntityBuilder<T & C>;
  build(): T;
};
