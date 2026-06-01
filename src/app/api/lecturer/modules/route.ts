import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Fetch only the modules where this specific user is the active lecturer
export async function GET(request: Request) {
  try {
    const userEmail = "asanka.s@wyb.ac.lk"; 

    const queryText = `
      SELECT m.id, m.code, m.name, m.credits, m.is_frozen as "isFrozen", m.stats
      FROM modules m
      JOIN system_users u ON m.active_lecturer_id = u.id
      WHERE u.email = $1
      ORDER BY m.code ASC;
    `;
    
    const { rows } = await pool.query(queryText, [userEmail]);
    
    //  Added log to track queries instantly in your VS Code terminal
    console.log(`🔍 [API] Active lecturer rows found for ${userEmail}:`, rows.length);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database error fetching lecturer assignments:", error);
    return NextResponse.json({ error: "Failed to load assigned modules" }, { status: 500 });
  }
}

// PATCH: Save or modify CA component structures and Exam paper questions inside JSONB metrics block
export async function PATCH(request: Request) {
  try {
    const { moduleCode, caComponents, examTemplate } = await request.json();

    // If CA components are passed, execute existing 100% confirmation rule checks
    if (caComponents && Array.isArray(caComponents)) {
      const totalWeightage = caComponents.reduce((sum: number, c: any) => sum + parseInt(c.weightage || 0, 10), 0);
      if (caComponents.length > 0 && totalWeightage !== 100) {
        return NextResponse.json({ error: `Total CA weightage must equal exactly 100%. Current: ${totalWeightage}%` }, { status: 400 });
      }
    }

    const fetchCurrentStats = await pool.query(`SELECT stats FROM modules WHERE code = $1;`, [moduleCode]);
    if (fetchCurrentStats.rows.length === 0) return NextResponse.json({ error: "Module code not found" }, { status: 404 });

    const currentStats = fetchCurrentStats.rows[0].stats || {};
    
    //Merges both existing layout parameters and incoming configurations cleanly
    const updatedStats = {
      ...currentStats,
      caComponents: caComponents || currentStats.caComponents || [],
      examTemplate: examTemplate || currentStats.examTemplate || [],
      caCompletionRate: (caComponents || currentStats.caComponents || []).length > 0 ? 100 : 0
    };

    const updateQuery = `
      UPDATE modules 
      SET stats = $2 
      WHERE code = $1 AND is_frozen = false
      RETURNING code, stats;
    `;
    
    const { rows } = await pool.query(updateQuery, [moduleCode, JSON.stringify(updatedStats)]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "Cannot update. Blueprint is locked or frozen by the HOD." }, { status: 403 });
    }

    return NextResponse.json({ success: true, stats: rows[0].stats });
  } catch (error) {
    console.error("Database error writing CA and Exam layout configuration matrix:", error);
    return NextResponse.json({ error: "Failed to persist assessment and paper criteria mapping" }, { status: 500 });
  }
}