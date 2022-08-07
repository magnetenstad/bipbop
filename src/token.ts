export class Token {
  private type: TokenTypeSet = new TokenTypeSet()
  key: string
  value: any
  children: Token[]

  constructor(
    type: TokenType,
    key: string = 'untitled',
    children: Token[] = []
  ) {
    this.setType(type)
    this.key = key
    this.children = children
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

  isValue() {
    return this.hasAnyOfTypes([
      TokenType.vString,
      TokenType.vInt,
      TokenType.vFloat,
      TokenType.vBool,
    ])
  }

  isTypeKeyword() {
    return this.hasAnyOfTypes([
      TokenType.kString,
      TokenType.kInt,
      TokenType.kFloat,
      TokenType.kBool,
    ])
  }

  isExpression() {
    return (
      this.isValue() ||
      this.hasAnyOfTypes([
        TokenType.Word,
        TokenType.FunctionCall,
        TokenType.Tuple,
        TokenType.FunctionInterface,
        TokenType.Function,
      ])
    )
  }
}

class TokenTypeSet extends Set<TokenType> {
  get [Symbol.toStringTag]() {
    return JSON.stringify([...this.values()].map((value) => TokenType[value]))
  }
}

export enum TokenType {
  None,

  // Symbols
  sComment,
  sDoubleColon,
  sThinArrow,
  sDoubleEquals,
  sEquals,
  sPlus,
  sMinus,
  sTimes,
  sSlash,
  sBackslash,

  // Keywords
  kChar,
  kString,
  kInt,
  kFloat,
  kBool,

  // Values
  vChar,
  vString,
  vInt,
  vFloat,
  vBool,

  // Other
  Word,
  Type,
  Comment,
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
  TypedWord,
}
