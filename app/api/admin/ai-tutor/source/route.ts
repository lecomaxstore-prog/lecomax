import { NextRequest } from "next/server";
import { tutorAccess, tutorJson, tutorFailure } from "@/lib/ai-tutor-server";
import { TUTOR_EXAMPLES } from "@/lib/ai-tutor";
import { getLearningSourceContext } from "@/lib/learning-source-context";
import { assertTutorContentSafe } from "@/lib/ai-tutor-security";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const access = await tutorAccess(req);
    if (access.denied) return access.denied;
    const example = TUTOR_EXAMPLES.find(item => item.id === req.nextUrl.searchParams.get("example"));
    if (!example) return tutorJson({ error: "اختر مثالًا من القائمة." }, 400);
    const context = await getLearningSourceContext(example.path, 1, example.anchor);
    assertTutorContentSafe(context.text);
    const snapshot = JSON.parse(context.text);
    // Only show a small excerpt starting at the lesson's function, with original line numbers.
    const rows: string[] = snapshot.excerpt.split("\n");
    const start = rows.findIndex(row => row.includes(example.anchor));
    if (start < 0) throw new Error("SOURCE_UNAVAILABLE");
    return tutorJson({ ...context.sources[0], focusLine: snapshot.startLine + start, excerpt: rows.slice(start, start + 14).join("\n") });
  } catch (error) { return tutorFailure(error); }
}
