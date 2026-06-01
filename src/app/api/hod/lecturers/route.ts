// src/app/api/hod/lecturers/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const queryText = `
      SELECT 
        u.id, 
        u.full_name as "fullName", 
        u.email,
        COALESCE(
          (SELECT json_agg(m.code) FROM modules m WHERE m.active_lecturer_id = u.id), 
          '[]'::json
        ) as "activeModules",
        COALESCE(
          (SELECT json_agg(m.code) FROM modules m WHERE m.exam_lecturer_id = u.id), 
          '[]'::json
        ) as "examModules"
      FROM system_users u
      WHERE u.role = 'LECTURER'
      ORDER BY u.full_name ASC;
    `;
    const { rows } = await pool.query(queryText);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database error fetching lecturer assignments:", error);
    return NextResponse.json({ error: "Failed to fetch lecturers" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { lecturerId, activeModuleCodes, examModuleCodes } = await request.json();
    const lecLecturerId = parseInt(lecturerId, 10);

    // Begin transaction to safely update across module rows cleanly
    await pool.query("BEGIN");

    // 1. Clear previous assignments for this lecturer
    await pool.query(
      `UPDATE modules SET active_lecturer_id = NULL WHERE active_lecturer_id = $1`, 
      [lecLecturerId]
    );
    await pool.query(
      `UPDATE modules SET exam_lecturer_id = NULL WHERE exam_lecturer_id = $1`, 
      [lecLecturerId]
    );

    // 2. Insert new active lecturer pairings
    if (activeModuleCodes && activeModuleCodes.length > 0) {
      await pool.query(
        `UPDATE modules SET active_lecturer_id = $1 WHERE code = ANY($2)`,
        [lecLecturerId, activeModuleCodes]
      );
    }

    // 3. Insert new exam lecturer pairings
    if (examModuleCodes && examModuleCodes.length > 0) {
      await pool.query(
        `UPDATE modules SET exam_lecturer_id = $1 WHERE code = ANY($2)`,
        [lecLecturerId, examModuleCodes]
      );
    }

    await pool.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Failed transaction reassigning lecturer workloads:", error);
    return NextResponse.json({ error: "Failed to reassign workload" }, { status: 500 });
  }
}