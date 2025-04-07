import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import { getSummaryFromGemini } from './geminiApi'; // Assuming geminiApi.ts exports this

const MAX_MESSAGES_IN_MEMORY = 20;
const SUMMARIZE_THRESHOLD = 10; // Number of messages beyond MAX_MESSAGES_IN_MEMORY before summarization

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
        try {
            // First, get the latest summary if there is one
            const summarySql = `
                SELECT id, content, start_message_id, end_message_id, timestamp 
                FROM summaries 
                ORDER BY timestamp DESC 
                LIMIT 1
            `;
            
            const latestSummary = await new Promise<any>((resolve, reject) => {
                this.db.get(summarySql, (err, row) => {
                    if (err) return reject(err);
                    resolve(row); // Will be undefined if no summaries exist
                });
            });
            
            // Get recent messages, limited by the parameter
            const messagesSql = `
                SELECT id, role, content, timestamp FROM messages 
                ORDER BY timestamp DESC 
                LIMIT ?
            `;
            
            const messages = await new Promise<any[]>((resolve, reject) => {
                this.db.all(messagesSql, [limit], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows.reverse()); // Reverse to maintain chronological order
                });
            });
            
            // If we have a summary and we need context, prepend it
            if (latestSummary && messages.length > 0) {
                // Check if the oldest message in our result set comes after the summarized ones
                const oldestRetrievedId = messages[0].id;
                
                if (oldestRetrievedId > latestSummary.end_message_id) {
                    // Insert the summary at the beginning
                    return [
                        { 
                            role: 'system', 
                            content: `Previous conversation summary: ${latestSummary.content}`,
                            timestamp: latestSummary.timestamp,
                            isSummary: true
                        },
                        ...messages
                    ];
                }
            }
            
            return messages;
        } catch (error) {
            console.error("Error retrieving messages:", error);
            return [];
        }
    }

    private async maintainHistoryLimit(): Promise<void> {
        try {
            // 1. Count total messages
            const countSql = `SELECT COUNT(*) as count FROM messages`;
            const count = await new Promise<number>((resolve, reject) => {
                this.db.get(countSql, (err, row: { count: number }) => {
                    if (err) return reject(err);
                    resolve(row.count);
                });
            });

            // 2. If count exceeds threshold, create a summary
            if (count > MAX_MESSAGES_IN_MEMORY + SUMMARIZE_THRESHOLD) {
                // 3. Get the oldest batch of messages that exceed our limit
                const oldestMessagesSql = `
                    SELECT id, role, content, timestamp FROM messages 
                    ORDER BY timestamp ASC 
                    LIMIT ${count - MAX_MESSAGES_IN_MEMORY}
                `;
                
                const messagesToSummarize = await new Promise<any[]>((resolve, reject) => {
                    this.db.all(oldestMessagesSql, (err, rows) => {
                        if (err) return reject(err);
                        resolve(rows);
                    });
                });

                // 4. Create a summary of these messages
                if (messagesToSummarize.length > 0) {
                    await this.createSummary(messagesToSummarize);
                    
                    // 5. Optionally mark these messages as summarized (or delete them)
                    // For now, we'll keep them for history but mark them in a new column
                    // Add a 'summarized' column to messages table if you want to flag them
                    // Alternatively, you could delete them:
                    
                    // const deleteIds = messagesToSummarize.map(msg => msg.id).join(',');
                    // const deleteSql = `DELETE FROM messages WHERE id IN (${deleteIds})`;
                    // await new Promise<void>((resolve, reject) => {
                    //     this.db.run(deleteSql, (err) => {
                    //         if (err) return reject(err);
                    //         console.log(`Deleted ${messagesToSummarize.length} summarized messages`);
                    //         resolve();
                    //     });
                    // });
                }
            }
        } catch (error) {
            console.error("Error maintaining history limit:", error);
        }
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

    // Add a method to create or retrieve a specific chat session
    async createChatSession(title: string = 'New Chat'): Promise<number> {
        const sql = `
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        try {
            await new Promise<void>((resolve, reject) => {
                this.db.run(sql, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            
            // Insert new session
            const insertSql = `INSERT INTO chat_sessions (title) VALUES (?)`;
            const sessionId = await new Promise<number>((resolve, reject) => {
                this.db.run(insertSql, [title], function(err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                });
            });
            
            return sessionId;
        } catch (error) {
            console.error("Error creating chat session:", error);
            throw error;
        }
    }

    // Method to get all chat sessions for the sidebar view
    async getAllChatSessions(): Promise<any[]> {
        const sql = `
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        try {
            await new Promise<void>((resolve, reject) => {
                this.db.run(sql, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            
            // Query all sessions
            const querySql = `
                SELECT id, title, created_at, last_updated 
                FROM chat_sessions 
                ORDER BY last_updated DESC
            `;
            
            const sessions = await new Promise<any[]>((resolve, reject) => {
                this.db.all(querySql, (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                });
            });
            
            return sessions.length > 0 ? sessions : [
                { id: 1, title: 'Default Chat', created_at: new Date().toISOString(), last_updated: new Date().toISOString() }
            ];
        } catch (error) {
            console.error("Error getting chat sessions:", error);
            return [
                { id: 1, title: 'Default Chat', created_at: new Date().toISOString(), last_updated: new Date().toISOString() }
            ];
        }
    }
}
