# TypeScript类型体操基础

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

### 比较大小

核心思路：元组计数，每次加一后跟AB对比，先等于哪个，说明哪个更小。

```ts
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
```

### 斐波那契数列

有了上面的基本运算，这个实现起来是不难了，但是要注意数值传递的关系

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

type Fib<
  N extends number,
  Cur extends number = 2,
  Pre extends number = 1,
  Counter extends any[] = [1, 1]
> = N extends Counter["length"]
  ? Cur
  : Fib<
      N,
      Add<Cur, Pre> extends number ? Add<Cur, Pre> : never,
      Cur,
      [...Counter, any]
    >;

type GetFib<N extends number> = N extends 0 | 1 ? 1 : Fib<N>;

type res0 = GetFib<0>; // 1
type res1 = GetFib<1>; // 1
type res2 = GetFib<2>; // 2
type res3 = GetFib<3>; // 3
type res4 = GetFib<4>; // 5
type res5 = GetFib<5>; // 8
type res6 = GetFib<6>; // 13
type res7 = GetFib<7>; // 21
```

或者继续使用元组计数

```ts
type FibonacciLoop<
    PrevArr extends unknown[], 
    CurrentArr extends unknown[], 
    IndexArr extends unknown[] = [], 
    Num extends number = 1
> = IndexArr['length'] extends Num
    ? CurrentArr['length']
    : FibonacciLoop<CurrentArr, [...PrevArr, ...CurrentArr], [...IndexArr, unknown], Num> 

type Fibonacci<Num extends number> = FibonacciLoop<[1], [1,1], [1,1], Num>;

type res8 = Fibonacci<8> // 34
```

## 简化联合

### 分布式条件类型

当类型参数为联合类型，并且在条件类型左边直接引用该类型参数的时候，TypeScript 会把每一个元素单独传入来做类型运算，最后再合并成联合类型，这种语法叫做分布式条件类型。

```ts
// 比如这样一个联合类型：
type Union = 'a' | 'b' | 'c';
// 我们想把其中的 a 大写，就可以这样写：
type UppercaseA<Item extends string> =
    Item extends 'a' ?  Uppercase<Item> : Item;
```

像分配律那样，拆解类型参数，逐一执行，再合并

```ts
// 拆
'a' extends 'a' ?  Uppercase<Item> : Item;
'b' extends 'a' ?  Uppercase<Item> : Item;
'c' extends 'a' ?  Uppercase<Item> : Item;

// 合
'a' extends 'a' ?  Uppercase<Item> : Item |
'b' extends 'a' ?  Uppercase<Item> : Item |
'c' extends 'a' ?  Uppercase<Item> : Item

// 相当于
UppercaseA<'a'> |  UppercaseA<'b'> | UppercaseA<'c'>

// 结果是
'A' | 'b' | 'c'
```

注意满足的条件

1. 入参是联合类型
2. 入参被直接引用（直接跟`extends`）

#### 例子

```ts
type UpperFirst<Str extends string> = Str extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : never;

type UniStr = "beyond" | "typescript" | "hello";

type res = UpperFirst<UniStr>;
// type res = "Beyond" | "Typescript" | "Hello"
```

### 判断联合类型

#### 前置例子

```ts
type TestUnion<A, B = A> = A extends B ? { a: A; b: B } : never;

type TestUnionResult = TestUnion<"a" | "b" | "c">;

/*
type TestUnionResult = {
  a: "a";
  b: "a" | "b" | "c";
} | {
  a: "b";
  b: "a" | "b" | "c";
} | {
  a: "c";
  b: "a" | "b" | "c";
}
 */
```

条件类型中如果左边的类型是联合类型(A)，会把每个元素单独传入做计算，而右边不会(B)。

所以 A 是 `'a'` 的时候，B 是 `'a' | 'b' | 'c'`， A 是 `'b'` 的时候，B 是 `'a' | 'b' | 'c'`...

#### 实现

```ts
type IsUnion<A, B = A> =
    A extends A
        ? [B] extends [A]
            ? false
            : true
        : never
```

**当 A 是联合类型时：**

`A extends A` 这种写法是为了触发分布式条件类型，让每个类型单独传入处理的，没别的意义。

`A extends A` 和 `[A] extends [A]` 是不同的处理，前者是单个类型和整个类型做判断，后者两边都是整个联合类型，因为只有 `extends` 左边直接是类型参数才会触发分布式条件类型。

### 元组转联合类型

#### 查找类型

```ts
interface Person {
  name: string;
  age: number;
  location: string;
}
type K1 = keyof Person; // "name" | "age" | "location"
type K2 = keyof Person[]; // "length" | "push" | "pop" | "concat" | ...
type K3 = keyof { [x: string]: Person }; // string

// The dual of this is indexed access types, also called lookup types. Syntactically, they look exactly like an element access, but are written as types:

type P1 = Person["name"]; // string
type P2 = Person["name" | "age"]; // string | number
type P3 = string["charAt"]; // (pos: number) => string
type P4 = string[]["push"]; // (...items: string[]) => number
type P5 = string[][0]; // string
```

由`type P2`可以看到，查找类型中的[]内可以是联合类型，返回一个与之索引对应的联合类型。那么，元组转联合可以很简单的这样子实现

```ts
type tuple = ["beyond", "hello"];

type res = tuple[number];
// type res = "beyond" | "hello"
```

其中number相当于`0 | 1 | 2 | 3`....

### 小案例

#### 实现BEM

```ts
type BEM<
  B extends string,
  E extends string[],
  M extends string[]
> = `${B}__${E[number]}--${M[number]}`;

type bemResult = BEM<"beyond", ["aaa", "bbb"], ["warning", "success"]>;
// type bemResult = "beyond__aaa--warning" | "beyond__aaa--success" | "beyond__bbb--warning" | "beyond__bbb--success"
```

字符串类型中遇到联合类型的时候，会每个元素单独传入计算

#### 排列组合

##### 两两组合

```ts
type CombTwo<A extends string, B extends string> =
  | A
  | B
  | `${A}${B}`
  | `${B}${A}`;

type res = CombTwo<"D", "Q">;
// type res = "D" | "Q" | "DQ" | "QD"
```

##### 多个组合

```ts
type CombAll<U extends string, UB extends string = U> = U extends UB
  ? CombTwo<U, CombAll<Exclude<UB, U>>>
  : never;

type resAll = CombAll<"A" | "B" | "C">;
// type resAll = "A" | "B" | "C" | "BC" | "CB" | "AB" | "AC" | "ABC" | "ACB" | "BA" | "CA" | "BCA" | "CBA" | "BAC" | "CAB"
```

推理：每次拿出来一个，剩下的元素递归，直到只剩一个，两两组合。

```ts
// 传入 "A" | "B" | "C"
CombTwo<"A", CombAll<"B" | "C">>
CombTwo<"B", CombAll<"A" | "C">>
CombTwo<"C", CombAll<"B" | "A">>

// 拿第一行举例，传入 "B" | "C"
CombTwo<"B", CombAll<"C">> 相当于 CombTwo<"B","C">
CombTwo<"C", CombAll<"B">> 相当于 CombTwo<"C","B">

// 其他同理
```

## 一些特性

### IsAny

any 类型与任何类型的交叉都是 any，也就是 1 & any 结果是 any。

```ts
type IsAny<T> = true extends false & T ? true : false;

type res1 = IsAny<string>;
type res2 = IsAny<boolean>;
type res3 = IsAny<unknown>;
type res4 = IsAny<undefined>;
type res5 = IsAny<any>; //true
```

这里只需要保证true和false位置上的类型是不同的即可

那如果相同了呢？

```ts
type IsAny<T> = true extends true & T ? true : false;

type res1 = IsAny<string>;
type res2 = IsAny<boolean>; // true
type res3 = IsAny<unknown>; //true
type res4 = IsAny<undefined>;
type res5 = IsAny<any>; //true
```

那么会让any, unknow, 和参与条件判断的类型都为true

#### 一个特性

传参为any类似分布式，将结果联合返回

```ts
type Test<T> = T extends number ? 1 : 2;
type res = Test<any>;
// type res = 1 | 2
```

### isEqual

之前的写法会导致任何类型与any对比都返回true

```ts
type IsEqual<A, B> = (A extends B ? true : false) & (B extends A ? true : false);
```

所以需改进一下

```ts
type IsEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true : false;
```

这个与ts源码有关系，看不懂可以先记住

### isUnion

```ts
type IsUnion<A, B = A> =
    A extends A
        ? [B] extends [A]
            ? false
            : true
        : never
```

never 在条件类型中也比较特殊，如果条件类型左边是类型参数，并且传入的是 never，那么直接返回 never：

```ts
type TestNever<T> = T extends number ? 1 : 2;
type res = TestNever<never> // never
```

需要这样写

```ts
type IsNever<T> = [T] extends [never] ? true : false
type res = TestNever<never> // true
```

#### isTuple

元组类型的 length 是数字字面量，而数组的 length 是 number。

```ts
type NotEqual<A, B> = 
    (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? false : true;

type IsTuple<T> = 
    T extends [...params: infer Eles] 
        ? NotEqual<Eles['length'], number> 
        : false
```

#### 联合转交叉

类型之间是有父子关系的，更具体的那个是子类型，比如 A 和 B 的交叉类型 A & B 就是联合类型 A | B 的子类型，因为更具体。

如果允许父类型赋值给子类型，就叫做逆变。
如果允许子类型赋值给父类型，就叫做协变。

在 TypeScript 中有函数参数是有逆变的性质的，也就是如果参数可能是多个类型，参数类型会变成它们的交叉类型。

```ts
type UnionToIntersection<U> = (
  U extends U ? (x: U) => unknown : never
) extends (x: infer R) => unknown
  ? R
  : never;

type res = UnionToIntersection<{ a: 2 } | { b: 3 }>;
/*
type res = {
    a: 2;
} & {
    b: 3;
}
*/
```

#### 提取可选类型

可选索引的值为 undefined 和值类型的联合类型。

```ts
type GetOptional<Obj extends Record<string, any>> = {
  [Key in keyof Obj as {} extends Pick<Obj, Key> ? Key : never]: Obj[Key];
};

type test = {
  a: "beyond";
  b: "hello";
  c?: "2023";
};

type res = GetOptional<test>;
/* 
type res = {
    c?: "2023" | undefined;
}
*/
```

#### 提取必选类型

```ts
type GetRequired<Obj extends Record<string, any>> = {
  [Key in keyof Obj as {} extends Pick<Obj, Key> ? never : Key]: Obj[Key];
};

type res2 = GetRequired<test>;
// type res2 = {
//     a: "beyond";
//     b: "hello";
// }
```

#### 移除索引签名

索引类型可能有索引，也可能有可索引签名。

比如：

```ts
type beyond = {
  [key: string]: any;
  coding(): void;
}
```

这里的 sleep 是具体的索引，[key: string]: any 就是可索引签名，代表可以添加任意个 string 类型的索引。

##### 性质：索引签名不能构造成字符串字面量类型，因为它没有名字，而其他索引可以

```ts
type RemoveIndexSignature<Obj extends Record<string, any>> = {
  [Key in keyof Obj as Key extends `${infer Str}` ? Str : never]: Obj[Key];
};

type res = RemoveIndexSignature<beyond>;
// type res = {
//     coding: () => void;
// }
```

#### 获取类的公共属性

```ts
type ClassPublicProps<Obj extends Record<string, any>> = {
    [Key in keyof Obj]: Obj[Key]    
}
```

#### as const

让推导出的类型具有字面量

```ts
const beyond = {
  a: 3,
  b: false,
} as const;

type res = typeof beyond;
// type res = {
//     readonly a: 3;
//     readonly b: false;
// }
```

这样推导出来的类型进行模式匹配时，也需要使用readonly修饰，否则匹配不到

### 总结

- any 类型与任何类型的交叉都是 any，也就是 1 & any 结果是 any，可以用这个特性判断 any 类型。
- 联合类型作为类型参数出现在条件类型左侧时，会分散成单个类型传入，最后合并。
never 作为类型参数出现在条件类型左侧时，会直接返回 never。
- any 作为类型参数出现在条件类型左侧时，会直接返回 trueType 和 falseType 的联合类型。
- 元组类型也是数组类型，但 length 是数字字面量，而数组的 length 是 number。可以用来判断元组类型。
- 函数参数处会发生逆变，可以用来实现联合类型转交叉类型。
- 可选索引的索引可能没有，那 Pick 出来的就可能是 {}，可以用来过滤可选索引，反过来也可以过滤非可选索引。
- 索引类型的索引为字符串字面量类型，而可索引签名不是，可以用这个特性过滤掉可索引签名。
- keyof 只能拿到 class 的 public 的索引，可以用来过滤出 public 的属性。
- 默认推导出来的不是字面量类型，加上 as const 可以推导出字面量类型，但带有 readonly 修饰，这样模式匹配的时候也得加上 readonly 才行。

## 综合

### ParseQueryString

#### 基础情况

a=1&b=2&c=3&d=4解析成索引类型

```ts
// 解析单个键值对，例如a=1，将这个字符串转换为索引类型{a:1}
type ParseSingleQuery<Str extends string> = Str extends `${infer P}=${infer V}`
  ? Record<P, V>
  : {};

// 解析整个query，每次只处理一对，然后填入到Res中进入下一次递归
type ParseQuery<
  Str extends string,
  Res extends Record<string, any> = {}
> = Str extends `${infer First}&${infer Rest}`
  ? ParseQuery<Rest, CombRecord<Res, ParseSingleQuery<First>>>
  // 循环到最后传入d=1，匹配不到?&?模式，所以将d=1单独解析，合并返回
  : CombRecord<Res,ParseSingleQuery<Str>>;

// 结合两个索引类型，比如{a:1}和{b:2}结合，结果为{a:1,b:2}
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
```

#### 合并情况

a=1&a=2&b=2&c=3将重复参数合并为一个数组

```ts
type ParseParam<Param extends string> =
  Param extends `${infer Key}=${infer Value}`
    ? {
        [K in Key]: Value;
      }
    : {};

type ParseParamResult = ParseParam<"a=1">;

type MergeValues<One, Other> = One extends Other
  ? One
  : Other extends unknown[]
  ? [One, ...Other]
  : [One, Other];

type MergeParams<
  OneParam extends Record<string, any>,
  OtherParam extends Record<string, any>
> = {
  [Key in keyof OneParam | keyof OtherParam]: Key extends keyof OneParam
    ? Key extends keyof OtherParam
      ? MergeValues<OneParam[Key], OtherParam[Key]>
      : OneParam[Key]
    : Key extends keyof OtherParam
    ? OtherParam[Key]
    : never;
};

type MergeParamsResult = MergeParams<{ a: 1 }, { b: 2 }>;

type ParseQueryString<Str extends string> =
  Str extends `${infer Param}&${infer Rest}`
    ? MergeParams<ParseParam<Param>, ParseQueryString<Rest>>
    : ParseParam<Str>;

type ParseQueryStringResult = ParseQueryString<"a=1&a=2&b=2&c=3">;
// type ParseQueryStringResult = {
//     a: ["1", "2"];
//     b: "2";
//     c: "3";
// }
```
