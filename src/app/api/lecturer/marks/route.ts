import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Fetch all student mark sheets associated with a specific module code
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const moduleCode = searchParams.get("moduleCode");

  if (!moduleCode) {
    return NextResponse.json({ error: "Missing module context parameters" }, { status: 400 });
  }

  try {
    const queryText = `
      SELECT id, student_index as "studentIndex", ca_marks as "caMarks", 
             practical_mark as "practicalMark", is_absent as "isAbsent"
      FROM student_marks
      WHERE module_code = $1
      ORDER BY student_index ASC;
    `;
    const { rows } = await pool.query(queryText, [moduleCode]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database error retrieving student roster maps:", error);
    return NextResponse.json({ error: "Failed to load marks worksheet" }, { status: 500 });
  }
}

// POST: Save or patch bulk student list arrays directly down to the ledger
export async function POST(request: Request) {
  try {
    const { moduleCode, students } = await request.json();

    // Check module freeze lock safety state first
    const lockCheck = await pool.query(`SELECT is_frozen FROM modules WHERE code = $1;`, [moduleCode]);
    if (lockCheck.rows.length > 0 && lockCheck.rows[0].is_frozen) {
      return NextResponse.json({ error: "This module blueprint is frozen by HOD. Data locked." }, { status: 403 });
    }

    await pool.query("BEGIN");

    for (const student of students) {
      const upsertQuery = `
        INSERT INTO student_marks (module_code, student_index, ca_marks, practical_mark, is_absent)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (module_code, student_index) 
        DO UPDATE SET 
          ca_marks = EXCLUDED.ca_marks,
          practical_mark = EXCLUDED.practical_mark,
          is_absent = EXCLUDED.is_absent;
      `;
      await pool.query(upsertQuery, [
        moduleCode,
        student.studentIndex,
        JSON.stringify(student.caMarks || {}),
        student.practicalMark || 0,
        student.isAbsent || false
      ]);
    }

    await pool.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Failed handling bulk mark ledger transaction updates:", error);
    return NextResponse.json({ error: "Failed to persist student grade sheet profiles" }, { status: 500 });
  }
}