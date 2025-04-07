import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import { getSummaryFromGemini } from './geminiApi'; // Assuming geminiApi.ts exports this

const MAX_MESSAGES_IN_MEMORY = 20;

export class ChatMemory {
    private db: sqlite3.Database;
    private dbPath: string;

    constructor(contextStoragePath: string) {
        // Store DB in extension's global storage path for persistence
        this.dbPath = path.join(contextStoragePath, 'chat_history.db');
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database', err);
            } else {
                console.log('Database opened successfully at', this.dbPath);
                this.createTables();
            }
        });
    }

    private createTables(): Promise<void> {
        const sqlMessages = `
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        const sqlSummaries = `
            CREATE TABLE IF NOT EXISTS summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                start_message_id INTEGER,
                end_message_id INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (start_message_id) REFERENCES messages(id),
                FOREIGN KEY (end_message_id) REFERENCES messages(id)
            )
        `;
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(sqlMessages, (err) => {
                    if (err) return reject(err);
                });
                this.db.run(sqlSummaries, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    }

    async addMessage(role: 'user' | 'model', content: string): Promise<void> {
        const sql = `INSERT INTO messages (role, content) VALUES (?, ?)`;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [role, content], function (err) { // Use function() to access this.lastID
                if (err) {
                    console.error('Error adding message:', err);
                    return reject(err);
                }
                console.log(`Message added with ID: ${this.lastID}`);
                this.maintainHistoryLimit(); // Check if summary is needed
                resolve();
            });
        });
    }

    async getMessages(limit: number = MAX_MESSAGES_IN_MEMORY): Promise<any[]> {
        // This should retrieve the latest 'limit' messages, potentially including
        // the most recent summary if it replaces older messages in the active view.
        // Implementation needs to query both messages and summaries table and combine results.
        // For simplicity, returning latest messages directly from DB for now:
        const sql = `SELECT role, content, timestamp FROM messages ORDER BY timestamp DESC LIMIT ?`;
        return new Promise((resolve, reject) => {
            this.db.all(sql, [limit], (err, rows) => {
                if (err) return reject(err);
                resolve(rows.reverse()); // Reverse to maintain chronological order
            });
        });
    }

    private async maintainHistoryLimit(): Promise<void> {
        // 1. Count messages
        // 2. If count > MAX_MESSAGES_IN_MEMORY + threshold (e.g., 10)
        // 3. Get the oldest (count - MAX_MESSAGES_IN_MEMORY) messages
        // 4. Call createSummary with these messages
        // 5. Potentially delete or mark summarized messages (optional, depends on retrieval logic)
        console.log('Checking history limit...');
        // Implementation details omitted for brevity
    }

    private async createSummary(messagesToSummarize: any[]): Promise<void> {
        if (!messagesToSummarize || messagesToSummarize.length === 0) return;

        const summaryContent = await getSummaryFromGemini(messagesToSummarize); // Call Gemini API
        const startMessageId = messagesToSummarize[0].id;
        const endMessageId = messagesToSummarize[messagesToSummarize.length - 1].id;

        const sql = `INSERT INTO summaries (content, start_message_id, end_message_id) VALUES (?, ?, ?)`;
        return new Promise((resolve, reject) => {
            this.db.run(sql, [summaryContent, startMessageId, endMessageId], function (err) {
                if (err) {
                    console.error('Error saving summary:', err);
                    return reject(err);
                }
                console.log(`Summary created for messages ${startMessageId} to ${endMessageId}`);
                resolve();
            });
        });
    }

    async searchHistory(query: string): Promise<any[]> {
        // Implement search logic using SQL LIKE operator on messages and summaries content
        const sql = `
            SELECT 'message' as type, content, timestamp FROM messages WHERE content LIKE ?
            UNION ALL
            SELECT 'summary' as type, content, timestamp FROM summaries WHERE content LIKE ?
            ORDER BY timestamp DESC
        `;
        const searchTerm = `%${query}%`;
        return new Promise((resolve, reject) => {
            this.db.all(sql, [searchTerm, searchTerm], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) return reject(err);
                console.log('Database closed.');
                resolve();
            });
        });
    }
}
