import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// Force Next.js to bypass all route caching layers completely
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const queryText = `
      SELECT 
        m.id, m.code, m.name, m.credits, m.is_frozen as "isFrozen",
        m.stats,
        CASE 
          WHEN la.id IS NOT NULL THEN json_build_object('id', la.id, 'fullName', la.full_name) 
          ELSE NULL 
        END as "assignedActiveLec",
        CASE 
          WHEN le.id IS NOT NULL THEN json_build_object('id', le.id, 'fullName', le.full_name) 
          ELSE NULL 
        END as "assignedExamLec"
      FROM modules m
      LEFT JOIN system_users la ON m.active_lecturer_id = la.id
      LEFT JOIN system_users le ON m.exam_lecturer_id = le.id
      ORDER BY m.code ASC;
    `;
    const { rows } = await pool.query(queryText);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database error fetching modules:", error);
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { code, isFrozen, activeLecturerId, examLecturerId } = body;

    let queryText = "";
    let queryParams = [];

    // Check if the action intent is a lock/freeze switch or an assignment shift
    if (isFrozen !== undefined) {
      queryText = `
        UPDATE modules 
        SET is_frozen = $2 
        WHERE code = $1
        RETURNING id, code, is_frozen as "isFrozen";
      `;
      queryParams = [code, isFrozen];
    } else {
      queryText = `
        UPDATE modules 
        SET active_lecturer_id = CASE WHEN $2 = -1 THEN NULL WHEN $2 IS NOT NULL THEN $2 ELSE active_lecturer_id END,
            exam_lecturer_id = CASE WHEN $3 = -1 THEN NULL WHEN $3 IS NOT NULL THEN $3 ELSE exam_lecturer_id END
        WHERE code = $1
        RETURNING id, code;
      `;
      
      // Parse strings from client options cleanly into numerical keys; map unassigned to -1 sentinel
      const activeId = activeLecturerId === "" ? -1 : (activeLecturerId ? parseInt(activeLecturerId, 10) : null);
      const examId = examLecturerId === "" ? -1 : (examLecturerId ? parseInt(examLecturerId, 10) : null);
      
      queryParams = [code, activeId, examId];
    }

    const { rows } = await pool.query(queryText, queryParams);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Module not found in system schema" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...rows[0] });
  } catch (error) {
    console.error("Database error executing update query payload:", error);
    return NextResponse.json({ error: "Failed to process module adjustment action" }, { status: 500 });
  }
}