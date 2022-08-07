export class Token {
  private type: TokenTypeSet = new TokenTypeSet()
  name: string
  value: any
  valueType: ValueType = ValueType.None
  children: Token[] = []

  constructor(type: TokenType, name: string = 'untitled', value: any = null) {
    this.setType(type)
    this.name = name
    this.value = value
  }

  hasType(type: TokenType) {
    return this.type.has(type)
  }

  hasAnyOfTypes(types: TokenType[]) {
    return types.some((type) => this.type.has(type))
  }

  setType(type: TokenType) {
    this.type.delete(TokenType.None)
    this.type.add(type)
  }
}

class TokenTypeSet extends Set<TokenType> {
  get [Symbol.toStringTag]() {
    return JSON.stringify([...this.values()].map((value) => TokenType[value]))
  }
}

export enum TokenType {
  None,
  Word,
  Type,
  Char,
  String,
  Int,
  Float,
  Bool,
  TripleDash,
  DoubleColon,
  Comment,
  Expression,
  Assignment,
  ConstantAssignment,
  Tuple,
  FunctionCall,
  FunctionInterface,
  Function,
  Statement,
  StatementList,
  Parenthesis,
  Operator,
  Operation,
  Conditional,
}

export enum ValueType {
  None = 'none',
  String = 'string',
  Int = 'int',
  Float = 'float',
  Bool = 'bool',
}
