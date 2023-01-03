# TS基础操作

## 关键字理解

### extends

1. 约束：泛型里的extends`Get<T extends string>`
2. 匹配：形如`A extends B ? true : false`
3. 继承：接口A `extends` 接口B (或者是class)

最常用的关键字之一，在定义类型时，经常用extends做模式匹配和约束——即匹配处理数据，约束入参。

### keyof

1. 取key，输出联合类型

### in

1. 遍历

### infer

1. 取对应位置类型赋值

### as

1. 重映射

## 模式匹配

### 最简单的模式匹配

```ts
type MyType<T> = { someProp: T };

type DemoS = MyType<"beyond">;
type DemoN = MyType<2023>;
type DemoB = MyType<false>;

type GetValue<T> = T extends MyType<infer V> ? V : never;

type ResS = GetValue<DemoS>; // "beyond"
type ResN = GetValue<DemoN>; // 2023
type ResB = GetValue<DemoB>; // false
```

GetValue使用extends做类型匹配，如果匹配成功，就推断类型，赋值给局部变量V，返回V，如果不成功，就返回never

### 数组类型

#### 获取第一个元素类型

```ts
type MyArr = [number, string, boolean];

// 直接写法
type GetFirstType<T extends unknown[]> = T[0];

// 模式匹配
type GetFirstType2<T extends unknown[]> =
  T extends [infer First, ...unknown[]]
  ? First
  : never

type res = GetFirstType<MyArr>; // number
type res2 = GetFirstType2<MyArr>; // number
```

>any 和 unknown 的区别： any 和 unknown 都代表任意类型，但是 unknown 只能接收任意类型的值，而 any 除了可以接收任意类型的值，也可以赋值给任意类型（除了 never）。类型体操中经常用 unknown 接受和匹配任何类型，而很少把任何类型赋值给某个类型变量。

使用模式匹配，将第一个元素类型赋值给First，其余的项使用一个数组接收，来返回类型。如果不满足匹配，则返回never，例如[]。直接写法没有做类型匹配，直接返回第一项元素类型，如果传入空数组，那么就会返回undefined。

#### 获取最后一个元素类型

跟上面一样，直接上代码

```ts
type MyArr = [number, string, boolean];

type GetFirstType<T extends unknown[]> = 
  T extends [...unknown[], infer Last]
  ? Last
  : never;

type res = GetFirstType<MyArr>; // boolean
```

#### 取剩余

取去掉第一个元素后的数组

```ts
type MyArr = [number, string, boolean];

type GetFirstType<T extends unknown[]> = 
  T extends [unknown, ...infer Last]
  ? Last
  : never;

type res = GetFirstType<MyArr>; 
//type res = [string, boolean]
```

>注意扩展符和infer的顺序，infer后接一个局部变量，然后再展开这个变量

但是这么写的话，如果MyArr是一个空数组，返回的类型则是never。为了让空数组去掉第一个元素后返回的类型还是空数组，需要做两次模式匹配

```ts
type MyArr = [];

type GetFirstType<T extends unknown[]> = T extends []
  ? []
  : T extends [unknown, ...infer Last]
  ? Last
  : never;

type res = GetFirstType<MyArr>; // type res = []
```

这样问题就解决了。

### 字符串类型

#### 判断开头

```ts
type StartWith<
  T extends string,
  P extends string
> = T extends `${P}${string}` ? true : false;


type r1 = StartWith<'Hello beyond','Hel'> //true
type r2 = StartWith<'Hello beyond','beyond'> //false
```

#### 替换

```ts
type Replace<
  T extends string,
  From extends string,
  To extends string
> = T extends `${infer Pre}${From}${infer Suf}`
  ? `${Pre}${To}${Suf}`
  : T;

type res = Replace<"Beyond", "B", "A">;
// type res = "Aeyond"
```

首先判断有没有匹配到From，同时将From的前后都推导（赋值）出两个变量，匹配成功返回新组装的结果，否则返回类型本身

#### 去空格

```ts
type TrimR<T extends string> = T extends `${infer s}${"" | "\n" | "\t"}`
  ? TrimR<s>
  : T;

type TrimL<T extends string> = T extends `${"" | "\n" | "\t"}${infer s}`
  ? TrimL<s>
  : T;

type Trim<T extends string> = TrimL<TrimR<T>>;


type res = TrimL<' Beyond  '> // 'Beyond'
```

### 函数

#### 获取参数

大同小异，直接上代码

```ts
type GetParams<F extends Function> = F extends (...args: infer A) => unknown
  ? A
  : never;

type fun = (a: string, b: number) => boolean;

type res = GetParams<fun>;
// type res = [a: string, b: number]
```

#### 获取返回值

```ts
type GetReturn<F extends Function> = F extends (...args: any[]) => infer R
  ? R
  : never;

type fun = (a: string, b: number) => boolean;

type res = GetReturn<fun>;
// type res = boolean
```

> 如果args后使用unknow约束，会得到never，原因是参数逆变

#### 提取this类型

```ts
type GetThisParameterType<T> 
    = T extends (this: infer ThisType, ...args: any[]) => any 
        ? ThisType 
        : unknown;
```

### 构造器

#### 获取实例类型

```ts
interface Person {
  name: string;
}

interface PersonConstructor {
  new (name: string): Person;
}

type GetInstance<Constructor extends new (...args: any) => any> 
= Constructor extends new (...args: any) => infer Ins ? Ins : unknown;

type res = GetInstance<PersonConstructor>;
//type res = Person
```

同样的可以获取参数类型，就先不展示了

### 索引类型

#### 获取类型某键的值（的类型）

```ts
type GetNameProp<Props> = "name" extends keyof Props
  ? Props extends { name?: infer V }
    ? V
    : never
  : never;

type res = GetNameProp<{ name: "beyond"; email: 2023 }>; // beyond
type res2 = GetNameProp<{ name?: "beyond" }>; // beyond
type res3 = GetNameProp<{ else: "beyond" }>; // never
type res4 = GetNameProp<{ name: undefined }>; // undefined

```

##### 为什么要判断`"name" extends keyof Props`？

在 ts3.0 里面如果没有对应的索引，Obj[Key] 返回的是 {} 而不是 never，所以这样做下兼容处理。

## 重新构造

### 数组类型

#### 添加、去除元素

```ts
type Tuple = [number, number, boolean, string];

type Push<T extends unknown[], E> = [...T, E];

type Pop<T extends unknown[]> = T extends [...infer R, unknown] ? R : never;

type res1 = Push<Tuple, object>;
//type res1 = [number, number, boolean, string, object]

type res2 = Pop<Tuple>;
// type res2 = [number, number, boolean]
```

构造一个新类型，来作为返回

#### 元组合并

```ts
// 有这样两个元组
type tuple1 = [1,2];
type tuple2 = ['be', 'yond'];
// 我们想把它们合并成这样的元组：
type tuple = [[1, 'be'], [2, 'yond']];
```

尝试一下，只有两对类型，一一对应即可 (用any和unknow都可以，因为any短一点，所以我就用any了)

```ts
type tuple1 = [1, 2];
type tuple2 = ["be", "yond"];

type Compose<
  T1 extends [any, any],
  T2 extends [any, any]
> = T1 extends [infer A1, infer A2]
  ? T2 extends [infer B1, infer B2]
    ? [[A1, B1], [A2, B2]]
    : []
  : [];

type res = Compose<tuple1, tuple2>;
// type res = [[1, "be"], [2, "yond"]]
```

#### 递归元组合并

元素类型变多了，这就需要使用递归，思路相同，代码如下

```ts
type tuple1 = [1, 2, 3, 4, 5, 6];
type tuple2 = ["be", "yond", "hel", "lo", "t", "s"];

type Compose<T1 extends any[], T2 extends any[]> =
T1 extends [
  infer A,
  ...infer OthersA
]
  ? T2 extends [infer B, ...infer OthersB]
    ? [[A, B], ...Compose<OthersA, OthersB>]
    : []
  : [];

type res = Compose<tuple1, tuple2>;
// type res = [[1, "be"], [2, "yond"], [3, "hel"], [4, "lo"], [5, "t"], [6, "s"]]
```

### 字符串类型

#### 首字母大写

```ts
type a = "beyond";

type UpCase<Str> = Str extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : never;

type res = UpCase<a>; // Beyond
```

#### 小驼峰转换

```ts
type a = "ts_ts_ts_ts";

type Camel<Str> = Str extends `${infer L}_${infer R}${infer Rest}`
  ? `${L}_${Uppercase<R>}${Camel<Rest>}`
  : Str;

type res = Camel<a>; // "ts_Ts_Ts_Ts"
```

#### 删除子串

与上文替换类似，只不过这里多了个构造

```ts
type a = "b--eyon-d---";
type sub = "-";

type SubStr<
  Str extends string,
  Sub extends string
> = Str extends `${infer L}${Sub}${infer R}`
  ? `${SubStr<`${L}${R}`, Sub>}`
  : Str;

type res = SubStr<a, sub>; // beyond
```

### 函数

#### 在已有函数上添加一个参数

```ts
type fun = (a: number) => boolean;

type FunAddParam<Fun, P> = Fun extends (...args: infer Args) => infer ReturnType
  ? (...args: [...Args, P]) => ReturnType
  : Fun;

type res = FunAddParam<fun,string>
// type res = (args_0: number, args_1: string) => boolean
```

### 索引类型

索引类型是聚合多个元素的类型，class、对象等都是索引类型，比如这就是一个索引类型：

```ts
type obj = {
  name: string;
  age: number;
  gender: boolean;
}
```

索引类型可以添加修饰符 readonly（只读）、?（可选）:

```ts
type obj = {
  readonly name: string;
  age?: number;
  gender: boolean;
}
```

对它的修改和构造新类型涉及到了映射类型的语法：

```ts
type Mapping<Obj extends object> = {
    [Key in keyof Obj]: Obj[Key]
}
```

#### 重映射（修改key）

```ts
type obj = {
  name: string;
  gender?: string;
};

type KeyToUpperCase<T extends Record<string,any>> = {
  [K in keyof T as Uppercase<K & string>]: T[K];
};

type res = KeyToUpperCase<obj>;
/**type res = {
    NAME: string;
    GENDER?: string | undefined;
} */
```

类型参数 Obj 是待处理的索引类型，通过 extends 约束为 object。

新的索引类型的索引为 Obj 中的索引，也就是 Key in keyof Obj，但要做一些变换，也就是 as 之后的。

通过 Uppercase 把索引 Key 转为大写，因为索引可能为 string、number、symbol 类型，而这里只能接受 string 类型，所以要 & string，也就是取索引中 string 的部分。

Record是内置高级类型，用来创建索引类型

```ts
type Record<K extends string | number | symbol, T> = { [P in K]: T; }
```

#### 加/去除readonly

```ts
type ToReadonly<T> =  {
    readonly [Key in keyof T]: T[Key];
}
type ToMutable<T> = {
    -readonly [Key in keyof T]: T[Key]
}
```

#### 加/去除可选

```ts
type ToPartial<T> = {
    [Key in keyof T]?: T[Key]
}
type ToRequired<T> = {
    [Key in keyof T]-?: T[Key]
}
```

#### 手写过滤器

```ts
type obj = {
  name: string;
  gender?: string;
  age: number;
  hobby: string[];
};

type Filter<T extends Record<string, any>, C> = {
  [K in keyof T as T[K] extends C ? K : never]: T[K];
};

type onlyString = Filter<obj, string | undefined>;
// type onlyString = {
//     name: string;
//     gender?: string | undefined;
// }

type onlyRequiredString = Filter<obj, string>;
// type onlyRequiredString = {
//     name: string;
// }
```

## 递归复用

### 数组

#### 逆序问题

```ts
type arr = [1, 2, 3, 4, 5];

type Reverse<Arr extends any[]> = Arr extends [infer First, ...infer Rest]
  ? [...Reverse<Rest>, First]
  : Arr;

type res = Reverse<arr>;
```

既然类型内无法循环，那么我们可以每次只处理一个。将数组逆序，可以等价于每次将第一个元素拿出来，放到最后，剩下的数组选第一个元素，拿出来，放到最后...直到数组里数组为空。

#### 查找问题

```ts
type arr = [1, 2, 3, 4, 5];

type Include<Arr extends any[], K> = Arr extends [infer First, ...infer Rest]
  ? isEqual<First, K> extends true
    ? true
    : Include<Rest, K>
  : false;

type isEqual<A, B> = (A extends B ? true : false) &
  (B extends A ? true : false);

type res = Include<arr, 4>; // true
type res2 = Include<arr, 43>; // false
```

判断arr内是否包含某类型，分析：每次只取第一个元素，和K进行对比，如果等于则包含，如果不等于，将剩余的元素继续取第一个，与K对比（递归）

> 注意isEqual函数A和B要互相赋值（extends）都为true，结果才为true

#### 生成问题

```ts
type BuildArr<
  Length extends number,
  Ele,
  Arr extends any[] = []
> = Arr["length"] extends Length ? Arr : BuildArr<Length, Ele, [Ele, ...Arr]>;

type res = BuildArr<6, true>;
// type res = [true, true, true, true, true, true]
```

也是每次处理一个，但需要将已生成的数组传入下一次递归作为基础数组。获取数组长度或者其他属性，要使用中括号语法获取

### 字符串类型

#### 替换问题

```ts
type ReplaceAll<
  Str extends string,
  From extends string,
  To extends string
> = Str extends `${infer L}${From}${infer R}`
  ? ReplaceAll<`${L}${To}${R}`, From, To>
  : Str;

type str = "b-e-y-o-n-d";
type res = ReplaceAll<str, "-", "|">;
// type res = "b|e|y|o|n|d"
```

#### 转联合类型

```ts
type ToUnion<Str extends string> = Str extends `${infer First}${infer Rest}`
  ? First | ToUnion<Rest>
  : never;

type str = "beyond";
type res = ToUnion<str>;
// type res = "b" | "e" | "y" | "o" | "n" | "d"
```

每次只取第一位加入联合类型，剩余的内容递归循环，如果剩余的内容为空，就返回never，联合类型中never自动剔除（或者说never不会加入联合类型），于是得到最终结果

#### 反转问题

```ts
type Reverse<Str extends string> = Str extends `${infer First}${infer Rest}`
  ? `${Reverse<Rest>}${First}`
  : Str;

type str = "beyond";
type res = Reverse<str>;
// type res = "dnoyeb"
```

### 索引类型

#### 深度readonly

```ts
// 将这个对象改为readonly
type obj = {
  a: {
    b: {
      c: {
        f: () => "beyond";
        d: {
          e: {
            f: string;
          };
        };
      };
    };
  };
};
```

``` ts
type DeepReadOnly<Obj extends Record<string, any>> =
  obj extends any
  ? {
      readonly [K in keyof Obj]: Obj[K] extends object
        ? Obj[K] extends Function
          ? Obj[K]
          : DeepReadOnly<Obj[K]>
        : Obj[K];
    }
  : never;

type res = DeepReadOnly<obj>;
// type res = {
//     readonly a: {
//         readonly b: {
//             readonly c: {
//                 readonly f: () => "beyond";
//                 readonly d: {
//                     readonly e: {
//                         readonly f: string;
// ...........................................
```

##### 为什么要在外层使用`obj extends any`？

> 因为ts的类型只有被用到才会计算，使用这个技巧让ts计算，从而显示readonly。如果不加这个判断的话，编译器是只显示一层的readonly，然后子层显示递归类型，像下面这样。所以可以在前面加上一段 Obj extends never ? never 或者 Obj extends any 等，从而触发计算。而且写 Obj extends any 还有额外的好处就是能处理联合类型。

```ts
type res = {
    readonly a: DeepReadOnly<{
        b: {
            c: {
                f: () => "beyond";
                d: {
                    e: {
                        f: string;
```

## 元组计数

### 原理

##### 只有元组的length是数，而其他类型的length为类型number（或不存在length）

TypeScript 类型系统中没有加减乘除运算符，但是可以通过构造不同的数组然后取 length 的方式来完成数值计算，把数值的加减乘除转化为对数组的提取和构造。

```ts
type tuple1 = [1, 2, 3, 4]["length"];
type tuple2 = [unknown, never, undefined, null]["length"];
type tuple3 = ["", "more", "beyond", false]["length"];
// type tuple1,2,3 = 4

type str = "beyond"["length"];
// type str = number

type obj = { a: any; b: number }["length"];
// 报错：类型“{ a: any; b: number; }”上不存在属性“length”。ts(2339)

```

### 实现加减乘除

#### 加

利用上文写过的生成数组，可以很方便的实现加法计算，数组合并后取length即可

```ts
type BuildArray<
  Length extends number,
  Ele = unknown,
  Arr extends unknown[] = []
> = Arr["length"] extends Length ? Arr : BuildArray<Length, Ele, [...Arr, Ele]>;

type Add<N1 extends number, N2 extends number> = [
  ...BuildArray<N1>,
  ...BuildArray<N2>
]["length"];

type res = Add<4, 5>; //type res = 9
```

#### 减

减法稍有不一样，思路是从一个元组当中（被减数）剔除一定数量的元素（减数）

```ts
type Sub<N1 extends number, N2 extends number> = BuildArray<N1> extends [
  ...arr1: BuildArray<N2>,
  ...arr2: infer Rest
]
  ? Rest["length"]
  : never;

type res2 = Sub<18, 6>; //type res2 = 12
```

#### 乘

乘法可以转换为递归的加法

```ts
type Mul<
  N1 extends number,
  N2 extends number,
  Res extends any[] = []
> = N2 extends 0
  ? Res["length"]
  : Mul<N1, Sub<N2, 1>, [...BuildArray<N1>, ...Res]>;

type res3 = Mul<8, 5>; // type res3 = 40
```

#### 除

了解了乘法之后，除法就是乘法的逆向思维。如果不能被整除，返回never。

```ts
type Div<
  N1 extends number,
  N2 extends number,
  Res extends any[] = []
> = N1 extends 0 ? Res["length"] : Div<Sub<N1, N2>, N2, [...Res, any]>;

type res4 = Div<40,8> // type res4 = 5
```

### 字符串长度

上文提到，在字符串类型下获取length属性，会得到`type = number`，但是可以利用元组在递归中计数，来获取字符串长度。

```ts
type StrLen<
  Str extends string,
  Count extends any[] = []
> = Str extends `${infer First}${infer Rest}`
  ? StrLen<Rest, [...Count, any]>
  : Count["length"];

type res = StrLen<"beyond">; // type res = 6
```
