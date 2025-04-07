import * as vscode from 'vscode';
import { ChatMemory } from './chatMemory';
import { getChatResponseFromGemini } from './geminiApi'; // Assuming geminiApi.ts exports this

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'podplayPenChatView'; // Matches package.json

    private _view?: vscode.WebviewView;
    private chatMemory: ChatMemory;
    private extensionContext: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
        // Pass the global storage path for database persistence
        this.chatMemory = new ChatMemory(context.globalStorageUri.fsPath);
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext<unknown>,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.extensionContext.extensionUri, 'resources')]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview (e.g., user input)
        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'sendMessage':
                    const userMessage = message.text;
                    // Add user message to history
                    await this.chatMemory.addMessage('user', userMessage);
                    // Display user message immediately (optional)
                    this._view?.webview.postMessage({ command: 'addMessage', role: 'user', content: userMessage });

                    try {
                        // Get response from Gemini API
                        const history = await this.chatMemory.getMessages(); // Get recent history for context
                        const modelResponse = await getChatResponseFromGemini(userMessage, history);

                        // Add model response to history
                        await this.chatMemory.addMessage('model', modelResponse);
                        // Display model response
                        this._view?.webview.postMessage({ command: 'addMessage', role: 'model', content: modelResponse });

                    } catch (error) {
                        console.error("Error getting response from Gemini:", error);
                        this._view?.webview.postMessage({ command: 'showError', text: 'Error fetching response.' });
                    }
                    return;
                case 'requestHistory':
                    // Load initial history when the view loads
                    const messages = await this.chatMemory.getMessages();
                    this._view?.webview.postMessage({ command: 'loadHistory', messages: messages });
                    return;
                // Add cases for search, image upload triggers etc.
            }
        }, undefined, this.extensionContext.subscriptions);

        // Request initial history load from webview side
         webviewView.webview.postMessage({ command: 'requestHistory' });
    }

    // Public method to potentially send messages from other parts of the extension
    public postMessageToWebview(message: any) {
        this._view?.webview.postMessage(message);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Load HTML, CSS, JS for the chat interface from files in 'resources/'
        // Use webview.asWebviewUri() for resource URIs
        // Include scripts to handle postMessage communication
        // Example (simplified):
        // const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionContext.extensionUri, 'resources', 'main.js'));
        // const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionContext.extensionUri, 'resources', 'styles.css'));

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <!-- <link href="${styleUri}" rel="stylesheet"> -->
                <title>AI Chat</title>
            </head>
            <body>
                <div id="chat-container"></div>
                <textarea id="message-input" rows="3"></textarea>
                <button id="send-button">Send</button>
                <!-- <script src="${scriptUri}"></script> -->
                <script>
                    const vscode = acquireVsCodeApi();
                    const chatContainer = document.getElementById('chat-container');
                    const messageInput = document.getElementById('message-input');
                    const sendButton = document.getElementById('send-button');

                    // Handle messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'addMessage':
                                const div = document.createElement('div');
                                div.textContent = \`[\${message.role}]: \${message.content}\`;
                                chatContainer.appendChild(div);
                                chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll down
                                break;
                            case 'loadHistory':
                                chatContainer.innerHTML = ''; // Clear existing
                                message.messages.forEach(msg => {
                                    const div = document.createElement('div');
                                    div.textContent = \`[\${msg.role}]: \${msg.content}\`;
                                    chatContainer.appendChild(div);
                                });
                                chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll down
                                break;
                            case 'showError':
                                const errDiv = document.createElement('div');
                                errDiv.style.color = 'red';
                                errDiv.textContent = message.text;
                                chatContainer.appendChild(errDiv);
                                break;
                            case 'requestHistory': // Sent by extension to trigger history load
                                vscode.postMessage({ command: 'requestHistory' });
                                break;
                        }
                    });

                    // Send message to the extension
                    sendButton.addEventListener('click', () => {
                        const text = messageInput.value;
                        if (text) {
                            vscode.postMessage({ command: 'sendMessage', text: text });
                            messageInput.value = ''; // Clear input
                        }
                    });

                     // Request history on load
                     vscode.postMessage({ command: 'requestHistory' });

                </script>
            </body>
            </html>`;
    }
}
