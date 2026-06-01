import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Force dotenv to explicitly read from .env.local in the root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("❌ Error: DATABASE_URL environment variable is missing.");
    console.error("💡 Tip: Verified that DATABASE_URL is defined inside your .env.local file.");
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    console.log("⚡ Connecting to Neon PostgreSQL using .env.local settings...");
    await client.connect();
    console.log("✅ Connected successfully!");

    // Start a transaction block to make sure all tables link up clean
    await client.query('BEGIN');

    // 1. Initialize core system user tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_hod BOOLEAN DEFAULT FALSE,
        is_active_lec BOOLEAN DEFAULT FALSE,
        is_exam_lec BOOLEAN DEFAULT FALSE
      );
    `);
    console.log("🔹 'system_users' table verified or created.");

    // 2. Initialize modules table referencing system_users SERIAL keys
    await client.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        credits INT NOT NULL,
        is_frozen BOOLEAN DEFAULT FALSE,
        active_lecturer_id INT REFERENCES system_users(id) ON DELETE SET NULL,
        exam_lecturer_id INT REFERENCES system_users(id) ON DELETE SET NULL,
        stats JSONB DEFAULT '{}'::jsonb
      );
    `);
    console.log("🔹 'modules' table verified or created.");

    // 3. Initialize the student marks ledger table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_marks (
        id SERIAL PRIMARY KEY,
        module_code VARCHAR(50) REFERENCES modules(code) ON DELETE CASCADE,
        student_index VARCHAR(50) NOT NULL,
        ca_marks JSONB DEFAULT '{}'::jsonb,
        practical_mark NUMERIC(5,2) DEFAULT 0.0,
        is_absent BOOLEAN DEFAULT FALSE,
        UNIQUE(module_code, student_index)
      );
    `);
    console.log("🔹 'student_marks' table verified or created.");

    // 4. Wipe old records to prevent duplicate key conflicts during dev refreshes
    // CASCADE ensures dependent student_marks wipe automatically when modules are truncated
    await client.query('TRUNCATE TABLE student_marks, modules, system_users RESTART IDENTITY CASCADE;');
    console.log("🧹 Flushed existing staging records.");

    // 5. Populate authentic university accounts with modular status flags
    const userSeedQuery = `
      INSERT INTO system_users (email, full_name, role, is_hod, is_active_lec, is_exam_lec)
      VALUES 
        ($1, $2, $3, $4, $5, $6),
        ($7, $8, $9, $10, $11, $12),
        ($13, $14, $15, $16, $17, $18)
      RETURNING id, full_name;
    `;

    const userValues = [
      'asanka.s@wyb.ac.lk', 'Prof. Asanka Sanjeewa', 'LECTURER', false, true, false, 
      'charith.k@wyb.ac.lk', 'Dr. Charith Kapukotuwa', 'LECTURER', true, true, false, 
      'deepani.w@wyb.ac.lk', 'Dr. Deepani Wijesekara', 'LECTURER', false, true, true
    ];

    const userResult = await client.query(userSeedQuery, userValues);
    console.log("🎉 Database seeded successfully with realistic user profiles!");

    // Capture returned auto-generated IDs to map modular links safely
    const usersMap = userResult.rows.reduce((acc, row) => {
      acc[row.full_name] = row.id;
      return acc;
    }, {} as Record<string, number>);

    // Generate stable UUID keys for CA components to simulate initialized structures
    const quizComponentId = "c1a1b1c1-1111-4111-a111-111111111111";
    const assignmentComponentId = "c2b2c2d2-2222-4222-b222-222222222222";

    const defaultCaBlueprint = [
      { id: quizComponentId, name: "Continuous Quiz Block", weightage: 40 },
      { id: assignmentComponentId, name: "Coursework Assignment", weightage: 60 }
    ];

    // 6. Populate expanded academic course modules matching the HOD design matrix
    const moduleSeedQuery = `
      INSERT INTO modules (code, name, credits, is_frozen, active_lecturer_id, exam_lecturer_id, stats)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14),
        ($15, $16, $17, $18, $19, $20, $21),
        ($22, $23, $24, $25, $26, $27, $28),
        ($29, $30, $31, $32, $33, $34, $35),
        ($36, $37, $38, $39, $40, $41, $42),
        ($43, $44, $45, $46, $47, $48, $49);
    `;

    const moduleValues = [
      'CMIS 3112', 'Rapid Application Development', 3, false, 
      usersMap['Prof. Asanka Sanjeewa'], usersMap['Dr. Deepani Wijesekara'], 
      JSON.stringify({ caCompletionRate: 100, moderationStatus: "MODERATING", caComponents: defaultCaBlueprint }),

      'CMIS 3123', 'Advanced Database Systems', 3, true, 
      usersMap['Dr. Deepani Wijesekara'], usersMap['Prof. Asanka Sanjeewa'], 
      JSON.stringify({ caCompletionRate: 100, moderationStatus: "VERIFIED", caComponents: defaultCaBlueprint }),

      'CMIS 3122', 'Mobile Application Development', 3, false,
      usersMap['Dr. Charith Kapukotuwa'], usersMap['Dr. Deepani Wijesekara'],
      JSON.stringify({ caCompletionRate: 0, moderationStatus: "PENDING" }),

      'CMIS 3225', 'Cloud Computing & DevOps', 3, false,
      usersMap['Prof. Asanka Sanjeewa'], null,
      JSON.stringify({ caCompletionRate: 100, moderationStatus: "MODERATING", caComponents: defaultCaBlueprint }),

      'CMIS 4121', 'Artificial Intelligence & Machine Learning', 3, false,
      null, usersMap['Dr. Charith Kapukotuwa'],
      JSON.stringify({ caCompletionRate: 0, moderationStatus: "PENDING" }),

      'CMIS 4222', 'Information Systems Security', 2, false,
      null, null,
      JSON.stringify({ caCompletionRate: 0, moderationStatus: "PENDING" }),

      'CMIS 2125', 'Web Application Architectures', 3, false,
      usersMap['Dr. Deepani Wijesekara'], usersMap['Prof. Asanka Sanjeewa'],
      JSON.stringify({ caCompletionRate: 0, moderationStatus: "PENDING" })
    ];

    await client.query(moduleSeedQuery, moduleValues);
    console.log("🎉 Academic blueprints loaded into database modules schema!");

    // 7. Seed sample student records into CMIS 3112 mimicking spreadsheet image_b43805.jpg
    console.log("📦 Injecting student mark rows mimicking traditional marksheets...");
    
    const studentMarkQuery = `
      INSERT INTO student_marks (module_code, student_index, ca_marks, practical_mark, is_absent)
      VALUES 
        ($1, $2, $3, $4, $5),
        ($6, $7, $8, $9, $10),
        ($11, $12, $13, $14, $15);
    `;

    const studentValues = [
      // Student 1: Normal Grade Entry 
      'CMIS 3112', '23001', 
      JSON.stringify({ [quizComponentId]: 85, [assignmentComponentId]: 70 }), 
      75.50, false,

      // Student 2: Normal Grade Entry
      'CMIS 3112', '23002', 
      JSON.stringify({ [quizComponentId]: 60, [assignmentComponentId]: 90 }), 
      82.00, false,

      // Student 3: Corresponds to Row 13 Absentee Case
      'CMIS 3112', '23013', 
      JSON.stringify({}), 
      0.00, true
    ];

    await client.query(studentMarkQuery, studentValues);
    console.log("🎉 Student marks records populated into marks ledger!");

    // Commit changes safely to cloud instance
    await client.query('COMMIT');

    // 8. Print structural confirmation logs
    const resUsers = await client.query('SELECT id, full_name, email, role FROM system_users;');
    console.log("\n📊 Live 'system_users' Database Records:");
    console.table(resUsers.rows);

    const resModules = await client.query('SELECT code, name, is_frozen as "isFrozen" FROM modules;');
    console.log("\n📊 Live 'modules' Database Records:");
    console.table(resModules.rows);

    const resMarks = await client.query('SELECT module_code as "module", student_index as "index", ca_marks as "ca", practical_mark as "practical", is_absent as "absent" FROM student_marks;');
    console.log("\n📊 Live 'student_marks' Sample Grid Matrix:");
    console.table(resMarks.rows);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Database script operation execution failure:", error);
  } finally {
    await client.end();
    console.log("\n🔒 Database connection closed securely.");
  }
}

seedDatabase();