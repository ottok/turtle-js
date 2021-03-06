define(["bacon.jquery", "parsestack"], function(bjq, parseStack) {
  return function Editor(root, jsEnv, repl) {
    var editorElement = root.find(".editor")
    var editorArea = editorElement.find("textarea")
    codeMirror = CodeMirror.fromTextArea(editorArea.get(0), { 
      lineNumbers: true,
      mode: "javascript",
      theme: "solarized dark"
    })
  
    code = Bacon.fromEventTarget(codeMirror, "change")
      .map(".getValue")
      .toProperty(codeMirror.getValue())

    repl.history.onValue(function(line) {
      codeMirror.setValue(codeMirror.getValue() ? codeMirror.getValue() + "\n" + line : line)
    })

    // TODO: ctrl-space handling
    var ctrlSpace = editorArea.asEventStream("keyup")
      .filter(function(e) { return e.ctrlKey && e.keyCode == 32})
      .doAction(".preventDefault")

    root.find(".run-link").asEventStream("click").merge(ctrlSpace).map(code).onValue(function(program) {
      clearError()
      try {
        jsEnv.eval(program)
      } catch(e) {
        var parsed = parseStack(e)
        showError(parsed)
      }
    })

    code.changes().onValue(clearError)

    return {
      code: code,
      refresh: function() {
        codeMirror.refresh()
      },
      reset: function() {
        editorArea.val("")
        editorArea.trigger("paste")
        clearError()
      }
    }

    function clearError() {
      showErrorText("")
    }

    function showError(error) {
      showErrorText("Error on line " + error.lineNumber + ": " + error.message)
    }
    
    function showErrorText(text) {
      editorElement.find(".error").text(text)
    }
  }
})
