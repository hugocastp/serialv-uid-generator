import * as vscode from 'vscode';
import * as child_process from 'child_process';

export function insertText(editor: vscode.TextEditor) {
  const serialVersionUID = generateSerialVersionUID();
  let index = serialVersionUID.indexOf("private");
  let text = 'private static final long serialVersionUID = 1L;'
  if (index >= 0) {
      text = serialVersionUID.substring(index);
  }
  editor.edit((editBuilder) => {
    editBuilder.insert(editor.selection.active, text);
  });
}

export function generateSerialVersionUID(): string {
  const [fullyQualifiedName, classFilePath, srcFilePath] = getCurrentClassFullyQualifiedName();

  // Compile the Java source file using the javac command
  child_process.execSync(`javac ${classFilePath}`, { cwd: srcFilePath });

  // Generate the serial version ID using the serialver command
  const output = child_process.execSync(`serialver ${fullyQualifiedName}`, { cwd: srcFilePath });
  console.log(output); 
  return output.toString().trim();
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "serialv-uid-generator" is now active!');

  const disposable = vscode.commands.registerCommand('extension.generateSerialVUID', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      insertText(editor);
    }
  });
  context.subscriptions.push(disposable);
}


function getCurrentClassFullyQualifiedName(): [string, string, string] {
  // Get a reference to the currently active text editor
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active text editor');
    return ['', '',''];
  }

  // Get a reference to the text document being edited
  const document = editor.document;
  if (!document) {
    vscode.window.showErrorMessage('No active text document');
    return ['', '',''];
  }

  // Get the full path to the document on the file system
  const filePath = document.uri.fsPath;

  // Extract the fully qualified name of the current class from the file path
  // (This will depend on your project's naming conventions and directory structure)
  const [fullyQualifiedName, classFilePath, srcFilePath] = extractClassNameAndFilePathFromFilePath(filePath);

  return [fullyQualifiedName, classFilePath, srcFilePath];
}

function extractClassNameAndFilePathFromFilePath(filePath: string): [string, string, string] {
  // Split the file path on '/' or '\' (depending on the operating system)
  const parts = filePath.split(/[/\\]/);

  // Check if the 'src' directory is present in the file path
  if (!parts.includes('src') && !parts.includes('main') && !parts.includes('java')) {
    vscode.window.showErrorMessage('The active file is not located in a subdirectory of src/main/java');
    return ['', '', ''];
  }

  console.log("parts:", parts);

  // Find the index of the 'java' directory
  const javaDirIndex = parts.indexOf('java');

  const srcParts = parts.slice(0, javaDirIndex + 1);
  console.log("srcParts:", srcParts);
  const packageParts = parts.slice(javaDirIndex + 1);


  // Join the remaining parts with '.' to create the fully qualified class name using dot notation
  const fullyQualifiedName = packageParts.join('.').replace(".java", "");
  console.log("fullyQualifiedName:", fullyQualifiedName);
  // The fully qualified class name will be the last part of the file path, with the ".java" suffix removed
  const className = packageParts[packageParts.length - 1].replace('.java', '');
  console.log("className:", className);

  // The file path of the class file
  const classFilePath = `${packageParts.slice(0, -1).join('/')}/${className}.java`;
  const srcFilePath = `${srcParts.join('/')}/`;

  return [fullyQualifiedName, classFilePath, srcFilePath];
}



export function deactivate() {}
