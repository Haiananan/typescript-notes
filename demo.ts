type GreaterThan<
  A extends number,
  B extends number,
  Counter extends any[] = []
> = A extends B
  ? false
  : A extends Counter["length"]
  ? false
  : B extends Counter["length"]
  ? true
  : GreaterThan<A, B, [...Counter, any]>;

type res = GreaterThan<3, 2>; // true
type res2 = GreaterThan<3, 3>; // false
type res3 = GreaterThan<3, 4>; // false
