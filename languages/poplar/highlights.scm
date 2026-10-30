(comment) @comment
(string) @string
(number) @number
(boolean) @boolean
(null) @constant

[
  "fn"
  "mcfn"
  "var"
  "if"
  "else"
  "for"
  "while"
  "return"
  "import"
  "execute"
] @keyword

(function_definition name: (identifier) @function)
(call_expression function: (identifier) @function)
(parameter) @variable.parameter
(for_statement capture: (identifier) @variable.parameter)

; `$x` is a score, `#x` is data storage, `@s` is a selector.
(score_variable) @variable.special
(data_variable) @property
(selector) @tag

; `/say ...;` and `execute (...)` hold raw Minecraft text.
(command "/" @punctuation.special)
(command name: (command_name) @function)
(command_text) @string.special
(insert ["{{" "}}"] @punctuation.special)

(binary_expression operator: _ @operator)
(unary_expression operator: _ @operator)
["=" ".."] @operator

["(" ")" "{" "}" "|"] @punctuation.bracket
[";" "," "."] @punctuation.delimiter
