"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
function debugMsg(msg) {
    const extensionConfig = vscode.workspace.getConfiguration("djangointellisense");
    if (extensionConfig.debugMessages) {
        vscode.window.showInformationMessage("[debug] " + msg);
    }
}
function getKindNumber(kind) {
    switch (kind) {
        case "type":
            return vscode.CompletionItemKind.TypeParameter;
        case "function":
            return vscode.CompletionItemKind.Function;
        case "method":
            return vscode.CompletionItemKind.Method;
        case "property":
            return vscode.CompletionItemKind.Property;
        case "class":
            return vscode.CompletionItemKind.Class;
        case "attribute":
            return vscode.CompletionItemKind.Value;
        case "bool":
            return vscode.CompletionItemKind.Value;
        case "int":
            return vscode.CompletionItemKind.Value;
        case "float":
            return vscode.CompletionItemKind.Value;
        case "NoneType":
            return vscode.CompletionItemKind.Value;
    }
    return vscode.CompletionItemKind.Property;
}
function provideCompletionItemsInternal(document, position, token, config) {
    let lineText = document.lineAt(position.line).text;
    let lineTillCurrentPosition = lineText.substr(0, position.character);
    let stdout = "";
    let stderr = "";
    const extension = vscode.extensions.getExtension("shamanu4.django-intellisense");
    const extensionConfig = vscode.workspace.getConfiguration("djangointellisense");
    const pythonConfig = vscode.workspace.getConfiguration("python");
    const installPath = extension ? extension.extensionPath : "";
    const pythonInterpreter = path.join(extensionConfig.projectRoot, pythonConfig.pythonPath);
    const args = [
        path.join(installPath, "out", "autocomplete.py"),
        extensionConfig.projectRoot,
        extensionConfig.settingsModule,
        document.fileName,
        lineTillCurrentPosition
    ];
    debugMsg(JSON.stringify([pythonInterpreter, args, {}]));
    let p = cp.spawn(pythonInterpreter, args, {});
    p.stdout.on("data", data => (stdout += data));
    p.stderr.on("data", data => (stderr += data));
    return new Promise((resolve, reject) => {
        p.on("close", code => {
            let data = [];
            debugMsg("stdout: " + stdout);
            debugMsg("stderr: " + stderr);
            try {
                data = JSON.parse(stdout.replace(/'/g, '"'));
            }
            catch (err) {
                return resolve([]);
            }
            if (data.length) {
                return resolve(data);
            }
            else {
                return resolve([]);
            }
        });
        p.on("error", err => {
            return reject(err);
        });
    });
}
function registerCompletionProvider(ctx) {
    ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider("python", {
        provideCompletionItems(document, position, token) {
            return provideCompletionItemsInternal(document, position, token, vscode.workspace.getConfiguration("python", document.uri)).then(result => {
                if (!result) {
                    return new vscode.CompletionList([], false);
                }
                if (Array.isArray(result)) {
                    const suggestionItemList = result.map(item => {
                        // const kind = item[0].toString();
                        const kind = getKindNumber(item[0]);
                        const name = item[1];
                        let i = new vscode.CompletionItem(name, kind);
                        i.sortText = "a";
                        return i;
                    });
                    return new vscode.CompletionList(suggestionItemList, false);
                }
                return result;
            });
        }
    }, ".", '"'));
}
exports.registerCompletionProvider = registerCompletionProvider;
//# sourceMappingURL=suggest.js.map