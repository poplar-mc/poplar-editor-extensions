/**
 * @file Tree-sitter grammar for Poplar, for syntax highlighting in Gram and Zed.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  or: 1,
  and: 2,
  equality: 3,
  compare: 4,
  sum: 5,
  product: 6,
  unary: 7,
  call: 8,
};

const BINARY_OPERATORS = [
  ['or', PREC.or],
  ['and', PREC.and],
  ['==', PREC.equality],
  ['!=', PREC.equality],
  ['<', PREC.compare],
  ['<=', PREC.compare],
  ['>', PREC.compare],
  ['>=', PREC.compare],
  ['+', PREC.sum],
  ['-', PREC.sum],
  ['*', PREC.product],
  ['/', PREC.product],
  ['%', PREC.product],
];

module.exports = grammar({
  name: 'poplar',

  // The scanner (src/scanner.c) gives the end of a line, the start and end of an indented block,
  // and the colon that starts a block. Inside brackets, a line break is only whitespace.
  externals: $ => [$._newline, $._indent, $._dedent, $._block_colon],

  extras: $ => [/\s/, $.comment],

  word: $ => $.identifier,

  rules: {
    source_file: $ => seq(
      optional($.namespace_declaration),
      repeat($._declaration),
    ),

    _declaration: $ => choice(
      $.import_declaration,
      $.constant_declaration,
      $.variable_declaration,
      $.function_definition,
      $.data_file,
    ),

    // `namespace combat`, the first statement of a file.
    namespace_declaration: $ => seq('namespace', field('name', $.namespace_name), $._newline),

    import_declaration: $ => seq('import', field('name', $.namespace_name), $._newline),

    // `const maxMana = 100`: a build-time value, only at the top level.
    constant_declaration: $ => seq(
      'const', field('name', $.identifier),
      '=', field('value', $._expression), $._newline,
    ),

    namespace_name: $ => seq($.identifier, repeat(seq('.', $.identifier))),

    // `magic:heal` or `bs.math:clamp`: a name in another namespace.
    qualified_name: $ => seq(field('namespace', $.namespace_name), ':', field('name', $.identifier)),

    // `mcfun heal:` and its body, which can be empty.
    function_definition: $ => seq(
      'mcfun',
      field('name', $.identifier),
      $._block_colon,
      choice(field('body', $._body), $._newline),
    ),

    // `predicate isSneaking { ...json... }`: a JSON file in the pack. The compiler checks the type word.
    data_file: $ => seq(
      field('type', alias($.identifier, $.data_file_type)),
      field('name', choice($.identifier, $.string)),
      field('body', choice($.json_object, $.json_array)),
      $._newline,
    ),

    json_object: $ => seq('{', commaSep($.json_pair), '}'),
    json_pair: $ => seq(field('key', $.string), ':', field('value', $._json_value)),
    json_array: $ => seq('[', commaSep($._json_value), ']'),
    _json_value: $ => choice($.json_object, $.json_array, $.string, $.json_number, $.boolean, $.null),
    json_number: _ => /-?\d+(\.\d+)?([eE][+-]?\d+)?/,

    // After a `:`: the indented lines under it, or one simple statement on the same line.
    _body: $ => choice($._simple_statement, seq($._newline, $.block)),

    block: $ => seq($._indent, repeat1($._statement), $._dedent),

    _statement: $ => choice($._simple_statement, $._compound_statement),

    _simple_statement: $ => choice(
      $.variable_declaration,
      $.assignment,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.command,
      $.expression_statement,
    ),

    _compound_statement: $ => choice(
      $.if_statement,
      $.while_statement,
      $.for_statement,
      $.execute_statement,
    ),

    variable_declaration: $ => seq(
      'var', field('name', $._variable),
      '=', field('value', $._expression), $._newline,
    ),

    assignment: $ => seq(
      field('target', $._variable), '=', field('value', $._expression), $._newline,
    ),

    return_statement: $ => seq('return', optional($._expression), $._newline),
    break_statement: $ => seq('break', $._newline),
    continue_statement: $ => seq('continue', $._newline),

    if_statement: $ => seq(
      'if',
      field('condition', $._expression),
      $._block_colon,
      field('consequence', $._body),
      repeat(field('alternative', $.elif_clause)),
      optional(field('alternative', $.else_clause)),
    ),

    elif_clause: $ => seq('elif', field('condition', $._expression), $._block_colon, field('consequence', $._body)),

    else_clause: $ => seq('else', $._block_colon, field('body', $._body)),

    while_statement: $ => seq('while', field('condition', $._expression), $._block_colon, field('body', $._body)),

    // `for n in 0..3:`. The end is not included.
    for_statement: $ => seq(
      'for', field('capture', $.identifier), 'in',
      field('start', $._expression), '..', field('end', $._expression),
      $._block_colon, field('body', $._body),
    ),

    // `execute as @a at @s:`. The subcommands are raw Minecraft text, up to the colon that starts
    // the body.
    execute_statement: $ => seq(
      'execute',
      field('subcommands', repeat1(choice($.insert, $.selector, $.macro_key, alias($._subcommand_text, $.command_text)))),
      $._block_colon,
      field('body', $._body),
    ),

    // `/give @p diamond {{count}}`. Everything after the name is raw Minecraft text, to the end
    // of the line, so a `//` there is text and not a comment.
    command: $ => seq(
      '/',
      field('name', $.command_name),
      repeat(choice($.insert, $.selector, $.macro_key, $.command_text)),
      $._newline,
    ),

    command_name: _ => /[a-z_]+/,

    command_text: _ => token(prec(1, /[^\s@{$]+|\{[^{\s]*|\$/)),

    // A word of subcommand text. A colon inside it, as in `minecraft:the_nether`, is part of the
    // word, and a colon at its end starts the body.
    _subcommand_text: _ => /[^\s@{$:]+(:[^\s@{$:]+)*|\$/,

    insert: $ => seq('{{', $._expression, '}}'),

    expression_statement: $ => seq($._expression, $._newline),

    _variable: $ => choice($.identifier, $.qualified_name, $.score_variable, $.data_variable, $.entity_score, $.entity_data),

    _expression: $ => choice(
      $._variable,
      $.number,
      $.string,
      $.boolean,
      $.null,
      $.unary_expression,
      $.binary_expression,
      $.call_expression,
      $.parenthesized_expression,
      $.list_literal,
      $.compound_literal,
      $.selector,
      $.minecraft_check,
      $.macro_key,
    ),

    // `$(name)`: a macro argument of the mcfun.
    macro_key: _ => token(prec(1, /\$\([A-Za-z_][A-Za-z0-9_]*\)/)),

    // `block ~ ~-1 ~ stone` in a condition: an `execute if` subcommand as raw text, up to `and`,
    // `or`, `)` or the colon that starts the body.
    minecraft_check: $ => prec.right(seq(
      field('kind', alias(/(biome|block|blocks|data|dimension|entity|function|items|loaded|predicate|score|slots|stopwatch)\s/, $.check_kind)),
      repeat1(choice($.insert, $.selector, $.macro_key, $.check_text)),
    )),
    check_text: _ => /[^\s(){}@$:]+(:[^\s(){}@$:]+)*|\{[^{\s)]*|\$/,

    list_literal: $ => seq('[', commaSep($._expression), ']'),
    compound_literal: $ => seq('{', commaSep($.compound_entry), '}'),
    compound_entry: $ => seq(field('key', choice($.identifier, $.string)), ':', field('value', $._expression)),

    unary_expression: $ => prec(PREC.unary, seq(
      field('operator', choice('!', '-')),
      field('operand', $._expression),
    )),

    binary_expression: $ => choice(...BINARY_OPERATORS.map(([operator, precedence]) =>
      prec.left(precedence, seq(
        field('left', $._expression),
        // @ts-ignore
        field('operator', operator),
        field('right', $._expression),
      )),
    )),

    call_expression: $ => prec(PREC.call, seq(
      field('function', choice($.identifier, $.qualified_name)),
      field('arguments', $.argument_list),
      optional(seq('with', field('with', choice($.compound_literal, $.data_variable, $.entity_data, $.with_source)))),
    )),

    // `entity @s` or `block ~ ~ ~` after `with`: raw Minecraft text to the end of the line.
    with_source: $ => seq(field('kind', choice('entity', 'block')), field('text', alias(/[^\n]+/, $.with_text))),

    argument_list: $ => seq('(', commaSep($._expression), ')'),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    // `@s.#mana`
    entity_score: $ => seq(field('selector', $.selector), '.', field('score', $.score_variable)),

    // `@s.$Inventory[0].count`: a path in the NBT of an entity.
    entity_data: $ => seq(
      field('selector', $.selector),
      field('path', alias(token.immediate(/\.\$([A-Za-z0-9_.]|\[[^\]\n]*\]|"[^"\n]*")+/), $.data_path)),
    ),

    selector: _ => token(seq('@', /[aeprsn]/, optional(seq('[', /[^\]]*/, ']')))),

    score_variable: _ => /#([a-z0-9_.]+:)?[A-Za-z_][A-Za-z0-9_]*/,

    // `$stats`, or a path in it: `$stats.inventory[0].count`
    data_variable: _ => /\$([a-z0-9_.]+:)?[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*|\."[^"\n]*"|\[[^\]\n]*\])*/,

    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,

    // An SNBT number: `5`, `0.05`, `0.05f` or `1b`.
    number: _ => /\d+(\.\d+)?[bBsSlLfFdD]?/,

    string: _ => /"([^"\\\n]|\\.)*"/,

    boolean: _ => choice('true', 'false'),

    null: _ => 'null',

    comment: _ => token(seq('//', /.*/)),
  },
});

/**
 * @param {RuleOrLiteral} rule
 */
function commaSep(rule) {
  return optional(seq(rule, repeat(seq(',', rule))));
}
