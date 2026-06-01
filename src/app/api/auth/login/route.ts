import { NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email target parameters required" }, { status: 400 });
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    // Challenge the user directory entry
    const query = `
      SELECT id, email, full_name as "fullName", role, is_hod as "isHOD", is_active_lec as "isActiveLec", is_exam_lec as "isExamLec"
      FROM system_users 
      WHERE LOWER(email) = LOWER($1) 
      LIMIT 1;
    `;

    const result = await client.query(query, [email.trim()]);
    await client.end();

    const dbUser = result.rows[0];

    if (!dbUser) {
      return NextResponse.json({ error: "Access Denied. Institutional identity record not found." }, { status: 401 });
    }

    // Format properties cleanly to match system front-end interface shapes
    const formattedUser = {
      id: String(dbUser.id),
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: dbUser.role, // "LECTURER" or "ADMIN"
      capabilities: {
        isHOD: dbUser.isHOD,
        isActiveLec: dbUser.isActiveLec,
        isExamLec: dbUser.isExamLec,
      }
    };

    return NextResponse.json({ user: formattedUser });

  } catch (error: any) {
    console.error("🔒 Backend Auth Error:", error);
    return NextResponse.json({ error: "Internal Database Security Server Failure" }, { status: 500 });
  }
}