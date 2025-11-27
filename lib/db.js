// lib/db.js
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

let db = null;

export async function getDb() {
  if (db) return db;

  // Đảm bảo thư mục database tồn tại
  const dbDir = path.join(process.cwd(), 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'my-course-app.db');
  console.log('USING FIXED DB PATH:', dbPath);

  const sqlite = sqlite3.verbose();
  db = new sqlite.Database(dbPath);

  // Khởi tạo schema + tạo admin nếu chưa có
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1) Tạo bảng users nếu chưa tồn tại
      db.run(
        `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          email TEXT,
          created_at TEXT DEFAULT (datetime('now','localtime')),
          time_zone TEXT
        )
      `,
        (err) => {
          if (err) {
            console.error('CREATE TABLE users ERROR:', err);
            reject(err);
            return;
          }

          // 2) Tạo bảng password_resets nếu chưa tồn tại
          db.run(
            `
            CREATE TABLE IF NOT EXISTS password_resets (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              code TEXT NOT NULL,
              expires_at INTEGER NOT NULL,
              created_at TEXT DEFAULT (datetime('now','localtime')),
              FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `,
            (err2) => {
              if (err2) {
                console.error('CREATE TABLE password_resets ERROR:', err2);
                reject(err2);
                return;
              }

              // 3) Kiểm tra user admin
              db.get(
                "SELECT * FROM users WHERE username = 'admin'",
                async (err3, row) => {
                  if (err3) {
                    console.error('SELECT admin ERROR:', err3);
                    reject(err3);
                    return;
                  }

                  // Nếu chưa có admin -> tạo mới
                  if (!row) {
                    try {
                      const adminPassword =
                        process.env.ADMIN_PASSWORD || 'admin';
                      const hash = await bcrypt.hash(adminPassword, 10);

                      db.run(
                        `
                        INSERT INTO users (username, password_hash, role, created_at)
                        VALUES (?, ?, 'admin', datetime('now','localtime'))
                      `,
                        ['admin', hash],
                        (err4) => {
                          if (err4) {
                            console.error(
                              'INSERT admin ERROR:',
                              err4
                            );
                            reject(err4);
                          } else {
                            console.log(
                              'Auto admin created: admin /',
                              adminPassword
                            );
                            resolve();
                          }
                        }
                      );
                    } catch (hashErr) {
                      console.error('BCRYPT admin ERROR:', hashErr);
                      reject(hashErr);
                    }
                  } else {
                    // Đã có admin rồi
                    resolve();
                  }
                }
              );
            }
          );
        }
      );
    });
  });

  console.log('Database connected and ready at:', dbPath);
  return db;
}
