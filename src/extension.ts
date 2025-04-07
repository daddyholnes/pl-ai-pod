import * as vscode from 'vscode';
import { ChatViewProvider } from './chatViewProvider';
// Import other components like codeExecutor, projectManager as needed

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "podplay-pen-extension" is now active!');

    // Register Chat View Provider
    const chatProvider = new ChatViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatProvider)
    );

    // Register Commands (Example)
    let startChatDisposable = vscode.commands.registerCommand('podplay-pen.startChat', () => {
        // Logic to focus/open the chat view if not already visible
        // This might not be strictly necessary if the view is always loaded via activationEvents
        vscode.commands.executeCommand('workbench.view.extension.podplay-pen'); // Focus the container
        // Potentially send a message to the webview if needed
        // chatProvider.postMessageToWebview({ command: 'focusChat' });
        vscode.window.showInformationMessage('Chat View Activated!');
    });
    context.subscriptions.push(startChatDisposable);

    let generateCodeDisposable = vscode.commands.registerCommand('podplay-pen.generateCode', () => {
        // Logic for code generation command
        // - Get context (e.g., selected text, active editor content)
        // - Call Gemini API via geminiApi.ts
        // - Insert/replace code in the editor
        vscode.window.showInformationMessage('Generate Code command triggered!');
    });
    context.subscriptions.push(generateCodeDisposable);

    // Initialize other components like codeExecutor, projectManager here
}

export function deactivate() {
    // Cleanup resources, e.g., close database connection if ChatMemory holds it open
    // Note: ChatMemory example closes DB in its own method if needed.
}
