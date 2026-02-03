import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const skillPath = path.join(process.cwd(), 'skill', 'skill.md')
    const content = fs.readFileSync(skillPath, 'utf-8')
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Skill file not found' }, { status: 404 })
  }
}
