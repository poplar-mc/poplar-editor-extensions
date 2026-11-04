(comment) @comment
(string) @string
(number) @number
(boolean) @boolean
(null) @constant

[
  "mcfun"
  "var"
  "if"
  "else"
  "for"
  "while"
  "return"
  "break"
  "continue"
  "import"
  "namespace"
  "execute"
  "as"
  "with"
] @keyword

(number_type) @type
(compound_entry key: (identifier) @property)

(function_definition name: (identifier) @function)

; `namespace combat;`, `import magic;` and the `magic` of `magic:heal()`.
(namespace_name) @module
(call_expression function: (qualified_name name: (identifier) @function))

; `predicate isSneaking { ... }`: the type word, the name and the JSON keys.
(data_file type: (data_file_type) @keyword)
(data_file name: (identifier) @constant)
(json_pair key: (string) @property)
(json_number) @number
(call_expression function: (identifier) @function)
((call_expression function: (identifier) @function.builtin)
  (#any-of? @function.builtin "append" "prepend" "insert" "remove" "len" "text" "onEvent" "onTrigger" "onDeath" "onFirstJoin" "onJoin" "onRespawn" "slice" "str" "startsWith" "endsWith"))
; `$(name)`: a macro argument. `with entity @s` and `with block ~ ~ ~` pass raw Minecraft text.
(macro_key) @variable.parameter
(with_source kind: _ @keyword)
(with_text) @string.special
(for_statement capture: (identifier) @variable.parameter)

; `#x` is a score, `$x` is data storage, `@s` is a selector.
(score_variable) @variable.special
(data_variable) @property
(data_path) @property
(selector) @tag

; `/say ...;` and `execute (...)` hold raw Minecraft text.
(command "/" @punctuation.special)
(command name: (command_name) @function)
(command_text) @string.special
(insert ["{{" "}}"] @punctuation.special)

; `if (block ~ ~-1 ~ stone)`: an `execute if` subcommand as raw text.
(minecraft_check kind: (check_kind) @function)
(check_text) @string.special

(binary_expression operator: _ @operator)
(unary_expression operator: _ @operator)
["=" ".."] @operator

["(" ")" "{" "}" "[" "]" "|"] @punctuation.bracket
[";" "," "."] @punctuation.delimiter
