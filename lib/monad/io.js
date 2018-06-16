"use strict";

var expect = require('expect.js');
var fs = require('fs');

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
  /* IO.puts:: LIST[CHAR] => IO[] */
  putString: (alist) => {
    return List.match(alist, {
      empty: (_) => {
        return IO.done();
      },
      cons: (head, tail) => {
        return IO.seq(IO.putc(head))(IO.puts(tail));
      }
    });
  },
  // **IO#getc**
  /* IO.getc :: IO[CHAR] */
  getChar: () => {
    const continuation = () => {
      const chunk = process.stdin.read();
      return chunk;
    }; 
    process.stdin.setEncoding('utf8');
    return process.stdin.on('readable', continuation);
  }
};

module.exports = IO;
