-- Set the journal mode to Write-Ahead Logging for improved concurrency
PRAGMA journal_mode = WAL;

-- Change synchronous mode to NORMAL for a better performance/robustness balance
PRAGMA synchronous = NORMAL;

-- Display the current encoding used by the database
PRAGMA encoding;
