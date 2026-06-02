import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

// GET: Fetch all registered users in the system for the Admin control desk dashboard roster
export async function GET(request: Request) {
  try {
    // 🔒 In a production setup, verify the requesting session belongs to an ADMIN role here.
    const queryText = `
      SELECT id, email, full_name as "fullName", role, is_hod as "isHod", 
             is_active_lec as "isActiveLec", is_exam_lec as "isExamLec", created_at as "createdAt"
      FROM system_users
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(queryText);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database error retrieving system user registry:", error);
    return NextResponse.json({ error: "Failed to load user records registry" }, { status: 500 });
  }
}

// POST: Provision a brand-new user account with standard authorization flags
export async function POST(request: Request) {
  try {
    const { email, fullName, role, password, isHod, isActiveLec, isExamLec } = await request.json();

    // 1. Basic Payload Form Validation Rules
    if (!email || !fullName || !role || !password) {
      return NextResponse.json({ error: "Missing required profile registration parameters" }, { status: 400 });
    }

    // 2. Check for pre-existing records to prevent unique key violations
    const checkUser = await pool.query("SELECT id FROM system_users WHERE email = $1;", [email.toLowerCase().trim()]);
    if (checkUser.rows.length > 0) {
      return NextResponse.json({ error: "An account with this email address already exists" }, { status: 409 });
    }

    // 3. Hash the provisioned user password securely
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Insert the clean profile record right into the database block matrix
    const insertQuery = `
      INSERT INTO system_users (email, full_name, role, password_hash, is_hod, is_active_lec, is_exam_lec)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, full_name as "fullName", role;
    `;
    
    const { rows } = await pool.query(insertQuery, [
      email.toLowerCase().trim(),
      fullName.trim(),
      role.toUpperCase(),
      hashedPassword,
      isHod || false,
      isActiveLec || false,
      isExamLec || false
    ]);

    return NextResponse.json({ success: true, user: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Failed executing user provisioning pipeline:", error);
    return NextResponse.json({ error: "Internal server error during account generation" }, { status: 500 });
  }
}

// DELETE: Purge a user profile record completely from the system registry matrix
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "Missing required identifier parameter 'id'" }, { status: 400 });
    }

    // 🔒 In a production setup, verify the requesting session belongs to an ADMIN role here.

    // Execute deletion from the system_users database table
    const deleteQuery = `
      DELETE FROM system_users 
      WHERE id = $1 
      RETURNING id;
    `;
    const { rows } = await pool.query(deleteQuery, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Target user profile not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User profile successfully purged" });
  } catch (error) {
    console.error("Database pipeline error deleting user profile entry:", error);
    return NextResponse.json({ error: "Internal server error during account deletion" }, { status: 500 });
  }
}