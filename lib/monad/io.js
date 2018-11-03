"use strict";

const expect = require('expect.js'),
  fs = require('fs');

const kansuu = require('kansuu.js'),
  array = kansuu.array;

const IO = {
  /* unit:: T => IO[T] */
  unit : (any) => {
    return (_) =>  { // 
      return any;
    };
  },
  // flatMap :: IO[A] => FUN[A => IO[B]] => IO[B]
  flatMap : (instanceA) => {
    return (actionAB) => { // actionAB:: A -> IO[B]
      return (_) => { // 無名関数
        return IO.run(actionAB(IO.run(instanceA)));
      }
    };
  },
  // **IO#done**関数
  // 
  // > IOアクションを何も実行しない
  /* done:: T => IO[T] */
  done : (any) => {
    return IO.unit(null);
  },
  // **IO#run**関数
  //
  // > IOアクションを実行する
  /* run:: IO[A] => A */
  run : (action) => {
    return action();
  },
  // **IO#readFile**
  /* readFile:: STRING => IO[STRING] */
  readFile : (path) => {
    return (_) => {
      var content = fs.readFileSync(path, 'utf8');
      return IO.unit(content)(_);
    };
  },
  // **IO#println**
  /* println:: STRING => IO[null] */
  println : (message) => {
    return (_) => {
      console.log(message);
      return IO.unit(null)(_);
    };
  },
  // **IO#writeFile**
  writeFile : (path) => {
    return (content) => {
      return (_) => {
        fs.writeFileSync(path,content);
        return IO.unit(null)(_);
      };
    };
  },
  // **IO#seq**
  /* IO.seq:: IO[a] => IO[b] => IO[b] */
  seq: (instanceA) => {
    return (instanceB) => {
      return IO.flatMap(instanceA)((a) => {
        return instanceB;
      });
    };
  },
  // ~~~haskell
  // sequence_        :: [IO ()] -> IO ()
  // sequence_ []     =  return ()
  // sequence_ (a:as) =  do a
  //                        sequence as
  // ~~~
  sequence: (alist) => {
    return alist.match({
      empty: () => {
        return IO.done();
      },
      cons: (head, tail) => {
        return IO.flatMap(head)((_) => {
          return IO.sequence(tail); 
        }); 
      }
    });
  },
  // **IO#putc**
  /* IO.putChar:: CHAR => IO[Unit] */
  putChar: (character) => {
    return (_) => {
      process.stdout.write(character);
      return null;
    };
  },
  // **IO#puts**
  // ~~~haskell
  // puts list = seqs (map putc list)
  // ~~~
  /* IO.puts:: Array[CHAR] => IO[] */
  putArray: (anArray) => {
    if(array.isEmpty(anArray)) {
      return IO.done();
    } else {
      return array.match(anArray, {
        cons: (head, tail) => {
          return IO.seq(IO.putChar(head))(IO.putArray(tail));
        }
      });
    }
    // return List.match(alist, {
    //   empty: (_) => {
    //     return IO.done();
    //   },
    //   cons: (head, tail) => {
    //     return IO.seq(IO.putc(head))(IO.puts(tail));
    //   }
    // });a
  },
  // **IO#getc**
  /* IO.getc :: IO[CHAR] */
  getString: () => {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    // Here your code !
    function getStdin() {
      return new Promise((resolve, reject) => {
        let input_string = '';
        process.stdin.on('data', function(chunk) {
          input_string += chunk;
        });

        process.stdin.on('end', function() {
          resolve(input_string);
        });
      });
    };

    async function getStdinSync() {
      var input_string = await getStdin();
      input_string = input_string.toString().trim();
      return input_string;
    }
    return IO.unit(getStdinSync());
      // // on any data into stdin
      // stdin.on( 'data', function( key ){
      //   // ctrl-c ( end of text )
      //   if ( key === '\u0003' ) {
      //     process.exit();
      //   }
      //   // write the key to stdout all normal like
      //   return key;
      //   // process.stdout.write( key );
      // });
      // return IO.unit(stdin.read());

    // const continuation = () => {
    //   const chunk = process.stdin.read();
    //   return chunk;
    // }; 
    // return process.stdin.on('readable', continuation);
  }
};

module.exports = IO;
