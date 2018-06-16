"use strict";

var fs = require('fs');
var expect = require('expect.js');


//   // **List#toArray**でリストを配列に変換する
//   describe("List#toArrayでリストを配列に変換する", () => {
//     it("1段階のリストを配列に変換する", (next) => {
//       /* theList = [1,2,3,4] */
//       var theList = List.cons(1,List.cons(2,List.cons(3,List.cons(4,List.empty()),List.empty)));
//       expect(
//         List.toArray(theList)
//       ).to.eql(
//         [1,2,3,4]
//       );
//       next();
//     });
//     it("2段階のリストを配列に変換する", (next) => {
//       /* nestedList = [[1],[2]] */
//       var nestedList = List.cons(List.cons(1,List.empty()),
//                                  List.cons(List.cons(2,List.empty()),
//                                            List.empty()));
//       expect(
//         List.toArray(List.flatMap(nestedList)((alist) => {
//           return List.flatMap(alist)((item) => {
//             return List.unit(item);
//           });
//         }))
//       ).to.eql(
//         [1,2]
//       );
//       next();
//     });
//   });
//   // **List#fromArray**で配列をリストに変換する
//   describe("List#toArrayで配列をリストに変換する", () => {
//     it("1段階のリストを配列に変換する", (next) => {
//       expect(
//         List.toArray(
//           List.fromArray([1,2,3])
//         )
//       ).to.eql(
//         [1,2,3]
//       );
//       next();
//     });
//   });
//   describe("Listモナドを活用する",() => {
//     // 素数を判定するisPrimeを定義する
//     it("素数を判定するisPrimeを定義する", (next) => {
//       var enumFromTo = (x,y) => {
//         if(x > y) {
//           return List.empty();
//         } else {
//           return List.cons(x, enumFromTo(x+1,y));
//         }
//       };
//       // ~~~haskell
//       // factors :: Int -> [Int]
//       // factors n = [x | x <- [1..n], n `mod` x == 0]
//       // ~~~
//       var factors = (n) => {
//         return List.flatMap(enumFromTo(1,n))((x) => {
//           if((n % x) === 0){
//             return List.unit(x);
//           } else {
//             return List.empty(); 
//           }
//         });
//       };
//       expect(
//         List.toArray(factors(15))
//       ).to.eql(
//         [1,3,5,15]
//       );
//       expect(
//         List.toArray(factors(7))
//       ).to.eql(
//         [1,7]
//       );
//       // isPrime関数
//       // > isPrime(n) で n が素数かどうかを判定します。
//       // ~~~haskell
//       // isPrime :: Int -> Bool
//       // isPrime n = factors n == [1,n]
//       // ~~~
//       var isPrime = (n) => {
//         return List.toArray(factors(n)) === List.toArray(enumFromTo(1,n));
//       };
//       expect(
//         isPrime(15)
//       ).to.eql(
//         false
//       );
//       expect(
//         isPrime(13)
//       ).to.eql(
//         false
//       );
//       next();
//     });
//     it("フィルターとして使う", (next) => {
//       var even = (n) => {
//         if(n % 2 === 0) {
//           return true;
//         } else {
//           return false;
//         }
//       };
//       var theList = List.cons(1,List.cons(2,List.cons(3,List.cons(4,List.empty()))));
//       expect(
//         List.toArray(List.flatMap(theList)((item) => {
//           if(even(item)) {
//             return List.unit(item);
//           } else {
//             return List.empty();
//           }
//         }))
//       ).to.eql(
//         [2,4]
//       );
//       next();
//     });
//     it("2段階のflatMap", (next) => {
//       var theNumberList = List.cons(1,List.cons(2,List.empty()));
//       var theStringList = List.cons("one",List.cons("two",List.empty()));
//       expect(
//         List.toArray(List.flatMap(theNumberList)((n) => {
//           return List.flatMap(theStringList)((s) => {
//             return List.unit([n,s]);
//           });
//         }))
//       ).to.eql(
//         [[1,"one"],[1,"two"],[2,"one"],[2,"two"]]
//       );
//       next();
//     });
//     describe("Maybeと一緒に使う", () => {
//       it("[just(1)]", (next) => {
//         var theList = List.cons(Maybe.just(1),
//                                 List.empty());
//         var justList = List.flatMap(theList)((maybeItem) => {
//           return Maybe.flatMap(maybeItem)((value) => {
//             return List.unit(value);
//           });
//         });
//         expect(
//           List.toArray(justList)
//         ).to.eql(
//           [1]
//         );
//         next();
//       });
//       it("[just(1),just(2)]", (next) => {
//         var theList = List.cons(Maybe.just(1),
//                                 List.cons(Maybe.just(2),List.empty()));
//         var justList = List.flatMap(theList)((listItem) => {
//           return Maybe.flatMap(listItem)((value) => {
//             return List.unit(value);
//           });
//         });
//         expect(
//           List.toArray(justList)
//         ).to.eql(
//           [1,2]
//         );
//         next();
//       });
//     });
//   });
// });


