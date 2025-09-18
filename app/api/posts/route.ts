import { NextResponse } from "next/server";
import { postAction } from "@/util/actions/postsActions";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const text = String(form.get("text") ?? "");
    const category = String(form.get("category") ?? "");
    const subCategory = String(form.get("subCategory") ?? "");
    const modelName = String(form.get("modelName") ?? "");

    let tags: string[] = [];
    const tagsRaw = form.get("tags");
    if (typeof tagsRaw === "string") {
      try {
        const parsed = JSON.parse(tagsRaw);
        if (Array.isArray(parsed)) tags = parsed.filter(Boolean);
      } catch {
        // ignore invalid tags
      }
    }

    const files: File[] = [];
    for (const entry of form.getAll("files")) {
      if (entry instanceof File && entry.size > 0) {
        files.push(entry);
      }
    }

    const result = await postAction({ text, files, category, subCategory, modelName, tags });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, post: result.post });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
