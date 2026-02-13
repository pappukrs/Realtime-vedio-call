"use client";

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}

class Logger {
    private logs: LogEntry[] = [];
    private maxLogs = 1000;

    private formatMessage(message: string): string {
        return `[${new Date().toLocaleTimeString()}] ${message}`;
    }

    private saveLog(level: LogLevel, message: string, data?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Also log to console for development
        const consoleMsg = this.formatMessage(message);
        if (level === 'ERROR') {
            console.error(consoleMsg, data || '');
        } else if (level === 'WARN') {
            console.warn(consoleMsg, data || '');
        } else {
            console.log(consoleMsg, data || '');
        }
    }

    info(message: string, data?: any) {
        this.saveLog('INFO', message, data);
    }

    warn(message: string, data?: any) {
        this.saveLog('WARN', message, data);
    }

    error(message: string, data?: any) {
        this.saveLog('ERROR', message, data);
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }

    downloadLogs() {
        const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-logs-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

export const logger = new Logger();
