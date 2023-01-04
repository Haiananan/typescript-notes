type ParseSingleQuery<Str extends string> = Str extends `${infer P}=${infer V}`
  ? Record<P, V>
  : {};

type ParseQuery<
  Str extends string,
  Res extends Record<string, any> = {}
> = Str extends `${infer First}&${infer Rest}`
  ? ParseQuery<Rest, CombRecord<Res, ParseSingleQuery<First>>>
  : CombRecord<Res, ParseSingleQuery<Str>>;

type CombRecord<
  R1 extends Record<string, any>,
  R2 extends Record<string, any>
> = {
  [K in keyof (R1 & R2)]: K extends keyof R1
    ? R1[K]
    : K extends keyof R2
    ? R2[K]
    : never;
};

type a = "a=1&b=2&c=3&d=4";

type res = ParseQuery<a>;
// type res = {
//   a: "1";
//   b: "2";
//   c: "3";
//   d: "4";
// }

type ParseParam<Param extends string> = 
    Param extends `${infer Key}=${infer Value}`
        ? {
            [K in Key]: Value 
        } : {};

type ParseParamResult = ParseParam<'a=1'>;

type MergeValues<One, Other> = 
    One extends Other 
        ? One
        : Other extends unknown[]
            ? [One, ...Other]
            : [One, Other];

type MergeParams<
    OneParam extends Record<string, any>,
    OtherParam extends Record<string, any>
> = {
  [Key in keyof OneParam | keyof OtherParam]: 
    Key extends keyof OneParam
        ? Key extends keyof OtherParam
            ? MergeValues<OneParam[Key], OtherParam[Key]>
            : OneParam[Key]
        : Key extends keyof OtherParam 
            ? OtherParam[Key] 
            : never
}

type MergeParamsResult = MergeParams<{ a: 1 }, { b: 2 }>;

type ParseQueryString<Str extends string> = 
    Str extends `${infer Param}&${infer Rest}`
        ? MergeParams<ParseParam<Param>, ParseQueryString<Rest>>
        : ParseParam<Str>;


type ParseQueryStringResult = ParseQueryString<'a=1&a=2&b=2&c=3'>;


