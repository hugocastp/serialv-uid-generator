"use strict";
exports.__esModule = true;
exports.deactivate = exports.activate = exports.generateSerialVersionUID = exports.insertText = void 0;
var vscode = require("vscode");
var child_process = require("child_process");
function insertText(editor) {
    var serialVersionUID = generateSerialVersionUID();
    var index = serialVersionUID.indexOf("private");
    var text = 'private static final long serialVersionUID = 1L;';
    if (index >= 0) {
        text = serialVersionUID.substring(index);
    }
    editor.edit(function (editBuilder) {
        editBuilder.insert(editor.selection.active, text);
    });
}
exports.insertText = insertText;
function generateSerialVersionUID() {
    var _a = getCurrentClassFullyQualifiedName(), fullyQualifiedName = _a[0], classFilePath = _a[1], srcFilePath = _a[2];
    // Compile the Java source file using the javac command
    child_process.execSync("javac ".concat(classFilePath), { cwd: srcFilePath });
    // Generate the serial version ID using the serialver command
    var output = child_process.execSync("serialver ".concat(fullyQualifiedName), { cwd: srcFilePath });
    console.log(output);
    return output.toString().trim();
}
exports.generateSerialVersionUID = generateSerialVersionUID;
function activate(context) {
    console.log('Congratulations, your extension "serialv-uid-generator" is now active!');
    var disposable = vscode.commands.registerCommand('extension.generateSerialVUID', function () {
        var editor = vscode.window.activeTextEditor;
        if (editor) {
            insertText(editor);
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function getCurrentClassFullyQualifiedName() {
    // Get a reference to the currently active text editor
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor');
        return ['', '', ''];
    }
    // Get a reference to the text document being edited
    var document = editor.document;
    if (!document) {
        vscode.window.showErrorMessage('No active text document');
        return ['', '', ''];
    }
    // Get the full path to the document on the file system
    var filePath = document.uri.fsPath;
    // Extract the fully qualified name of the current class from the file path
    // (This will depend on your project's naming conventions and directory structure)
    var _a = extractClassNameAndFilePathFromFilePath(filePath), fullyQualifiedName = _a[0], classFilePath = _a[1], srcFilePath = _a[2];
    return [fullyQualifiedName, classFilePath, srcFilePath];
}
function extractClassNameAndFilePathFromFilePath(filePath) {
    // Split the file path on '/' or '\' (depending on the operating system)
    var parts = filePath.split(/[/\\]/);
    // Check if the 'src' directory is present in the file path
    if (!parts.includes('src') && !parts.includes('main') && !parts.includes('java')) {
        vscode.window.showErrorMessage('The active file is not located in a subdirectory of src/main/java');
        return ['', '', ''];
    }
    console.log("parts:", parts);
    // Find the index of the 'java' directory
    var javaDirIndex = parts.indexOf('java');
    var srcParts = parts.slice(0, javaDirIndex + 1);
    console.log("srcParts:", srcParts);
    var packageParts = parts.slice(javaDirIndex + 1);
    // Join the remaining parts with '.' to create the fully qualified class name using dot notation
    var fullyQualifiedName = packageParts.join('.').replace(".java", "");
    console.log("fullyQualifiedName:", fullyQualifiedName);
    // The fully qualified class name will be the last part of the file path, with the ".java" suffix removed
    var className = packageParts[packageParts.length - 1].replace('.java', '');
    console.log("className:", className);
    // The file path of the class file
    var classFilePath = "".concat(packageParts.slice(0, -1).join('/'), "/").concat(className, ".java");
    var srcFilePath = "".concat(srcParts.join('/'), "/");
    return [fullyQualifiedName, classFilePath, srcFilePath];
}
function deactivate() { }
exports.deactivate = deactivate;
