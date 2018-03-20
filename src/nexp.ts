const escapes = {
  '*': '*',
  '+': '+',
  '?': '?',
  '.': '.',
  's': ' ',
};

type RegAst = {
  content: string;
  escape?: boolean;
  position?: number;
}

export default class NExp {
  exp: string;
  operators: Array<string>;

  constructor(exp: RegExp) {
    this.exp = this._handleExp(exp);
    this.operators = ['\\', '()', '[]', '*', '.', '?', '{}', '^', '$'];
  }

  get regexp() {
    return this.exp;
  }

  exec(target: string): Object {
    const res = this._find(target)
    return res || {};
  }

  test(target: string): boolean {
    const res = this._find(target)
    return res ? true : false;
  }

  private _handleExp(exp: RegExp): string {
    const _exp = exp.toString();
    if (_exp[0] !== '/' || _exp[_exp.length - 1] !== '/') {
      throw new Error('Incorrect Exp Value');
    }

    return _exp.slice(1, -1);
  }

  private _isSpecial(reg: RegAst) {
    return !reg.escape && (reg.content === '*' || reg.content === '?' || reg.content === '+');
  }

  private _isDot(reg: RegAst) {
    return !reg.escape && reg.content === '.';
  }

  private _findIndex(target: Array<string>, char: string) {
    return target.map((t, index) => ({i: index, c: t})).filter(t => t.c === char).map(t => t.i)
  }

  private _realContent(char: RegAst) {
    return char.escape ? escapes[char.content] : char.content
  }

  // 生成一个 ast
  // 主要处理 \ 转义
  private _formAst(exp: string): Array<RegAst> {
    const _exp = exp.split('');
    const _reg = [];
    let flag = 0; // mark position
    let escaped = false;

    for (let i = 0; i < _exp.length; i++) {
      const v = _exp[i];

      if (v === '\\' && !escaped) {
        _reg.push({
          escape: true,
          position: flag,
        });

        escaped = true;
      } else {
        const _tmp = _reg[flag] || {};

        _reg[flag++] = {
          ..._tmp,
          content: v,
        }

        escaped = false;
      }
    }

    return _reg;
  }

  private _find(target: string) {
    const reg = this._formAst(this.exp);

    const result = this._run(target, reg);

    return result;
  }

  // 执行函数
  private _run(target: string, reg: Array<RegAst>): Object|string {
    let res = [];
    let flag = 0;

    const _target = target.split('');

    const firstChar = reg[0];

    if (this._isSpecial(firstChar)) {
      throw new Error('error regexp');
    }

    const indexs = this._findIndex(_target, firstChar.content);

    for (let _i = 0; _i < indexs.length; _i++) {
      const _result = [];
      let _start = indexs[_i];
      let _pos = _start;
      let _flag;
      let check = true;

      for (_flag = 0; _flag < reg.length; _flag++) {
        const char = reg[_flag];
        const _char = _flag < reg.length - 1 ? reg[_flag+1] : {} as RegAst;

        if(!this._isSpecial(_char)) {
          if (_target[_pos] === this._realContent(char)) {
            _result.push(_target[_pos])

            _pos++;
          } else if (this._isDot(char)) {
            _result.push(_target[_pos])

            _pos++;
          } else {
            check = false;
            break;
          }
        }
      }

      if (check) {
        res = _result;
        flag = _start;
        break;
      }
    }

    // 从字符串的第一位开始匹配，某次没匹配上，则去除第一位，sub之后的字符串重新进行匹配

    return {
      res: res.join(''),
      index: flag,
    };
  }
}