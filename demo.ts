type StrLen<
  Str extends string,
  Count extends any[] = []
> = Str extends `${infer First}${infer Rest}`
  ? StrLen<Rest, [...Count, any]>
  : Count["length"];

type res = StrLen<"beyond">; // type res = 6
