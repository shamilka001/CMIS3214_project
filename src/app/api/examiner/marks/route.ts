import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Fetch modules assigned to the Examiner and the student marks associated with them
export async function GET(request: Request) {
  try {
    // Mocking Dr. Deepani's email who is assigned as Exam Lecturer in seed script
    const userEmail = "deepani.w@wyb.ac.lk"; 

    const { searchParams } = new URL(request.url);
    const moduleCode = searchParams.get("moduleCode");

    if (!moduleCode) {
      // Step A: If no module specified, return the modules assigned to this examiner
      const queryModules = `
        SELECT m.id, m.code, m.name, m.credits, m.is_frozen as "isFrozen"
        FROM modules m
        JOIN system_users u ON m.exam_lecturer_id = u.id
        WHERE u.email = $1 ORDER BY m.code ASC;
      `;
      const { rows } = await pool.query(queryModules, [userEmail]);
      return NextResponse.json(rows);
    }

    // Step B: If module code is provided, fetch the grading sheets
    const queryMarks = `
      SELECT id, student_index as "studentIndex", exam_marks_second as "examMarksSecond", 
             final_theory_first as "finalTheoryFirst", is_absent as "isAbsent"
      FROM student_marks
      WHERE module_code = $1 ORDER BY student_index ASC;
    `;
    const { rows } = await pool.query(queryMarks, [moduleCode]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database error in examiner subsystem:", error);
    return NextResponse.json({ error: "Failed to pull examiner tracking sheet" }, { status: 500 });
  }
}

// PATCH: Commit Second Marking Q1-Q8 updates to the database
export async function PATCH(request: Request) {
  try {
    const { moduleCode, students } = await request.json();

    await pool.query("BEGIN");

    for (const student of students) {
      // Calculate total theory score from Q1-Q8 entries
      const qTotal = Object.values(student.examMarksSecond || {}).reduce((sum: number, mark: any) => sum + (parseFloat(mark) || 0), 0);
      
      // Scale down to a percentage out of 100 max for theory component base
      const finalTheorySecond = student.isAbsent ? 0 : Math.min(100, qTotal);

      const updateQuery = `
        UPDATE student_marks 
        SET exam_marks_second = $3, final_theory_second = $4
        WHERE module_code = $1 AND student_index = $2;
      `;
      await pool.query(updateQuery, [moduleCode, student.studentIndex, JSON.stringify(student.examMarksSecond || {}), finalTheorySecond]);
    }

    await pool.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Examiner transaction rollback processing fault:", error);
    return NextResponse.json({ error: "Failed to persist moderation marks sheet" }, { status: 500 });
  }
}