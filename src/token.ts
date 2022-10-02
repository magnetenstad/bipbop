export class Token {
  private type: TokenType = TokenType.None
  key: string
  value: any
  children: Token[]

  constructor(type: TokenType, key: string = '', children: Token[] = []) {
    this.setType(type)
    this.key = key
    this.children = children
  }

  get [Symbol.toStringTag]() {
    return TokenType[this.getType()]
  }

  getType() {
    return this.type
  }

  isOfType(type: TokenType) {
    return this.type === type
  }

  isAnyOfTypes(types: TokenType[]) {
    return types.some((type) => this.isOfType(type))
  }

  setType(type: TokenType) {
    this.type = type
  }

  isValue() {
    return this.isAnyOfTypes([
      TokenType.vString,
      TokenType.vInt,
      TokenType.vFloat,
      TokenType.vBool,
    ])
  }

  isTypeKeyword() {
    return this.isAnyOfTypes([
      TokenType.kString,
      TokenType.kInt,
      TokenType.kFloat,
      TokenType.kBool,
    ])
  }

  isExpression() {
    return (
      this.isValue() ||
      this.isAnyOfTypes([
        TokenType.Word,
        TokenType.FunctionCall,
        TokenType.Tuple,
        TokenType.Function,
        TokenType.BinaryOperation,
        TokenType.Parenthesis,
        TokenType.TypedWord,
        TokenType.Array,
        TokenType.PipeExpression,
        TokenType.Else,
      ])
    )
  }

  isBinaryOperator() {
    return this.isAnyOfTypes([
      TokenType.sPlus,
      TokenType.sMinus,
      TokenType.sTimes,
      TokenType.sSlash,
    ])
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
  sLess,
  sGreater,
  sLessEquals,
  sGreaterEquals,
  sNotEquals,
  sPlus,
  sMinus,
  sTimes,
  sSlash,
  sBackslash,
  sEscaped,
  sString,
  sPipe,
  sIf,

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
  WhiteSpace,
  Word,
  Type,
  Comment,
  Assignment,
  AssignmentStart,
  ConstantAssignment,
  ConstantAssignmentStart,
  Tuple,
  Array,
  FunctionCall,
  FunctionInterface,
  Function,
  Statement,
  StatementList,
  Parenthesis,
  BinaryOperation,
  If,
  Condition,
  TypedWord,
  Sequence,
  Block,
  PipeExpression,
  Else,
}
