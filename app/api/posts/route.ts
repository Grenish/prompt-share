import { NextResponse } from "next/server";
import { postAction, deletePosts } from "@/util/actions/postsActions";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

  const text = String(form.get("text") ?? "");
  const category = String(form.get("category") ?? "");
  const subCategory = String(form.get("subCategory") ?? "");
  const modelName = String(form.get("modelName") ?? "");
  const categorySlug = String(form.get("categorySlug") ?? "");
  const subCategorySlug = String(form.get("subCategorySlug") ?? "");
  const modelProviderLabel = String(form.get("modelProviderLabel") ?? "");
  const modelProviderSlug = String(form.get("modelProviderSlug") ?? "");
  const modelKey = String(form.get("modelKey") ?? "");
  const modelLabel = String(form.get("modelLabel") ?? "");
  const modelKind = String(form.get("modelKind") ?? "");

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

    const result = await postAction({
      text,
      files,
      category,
      subCategory,
      modelName,
      tags,
      categorySlug,
      subCategorySlug,
      modelProviderLabel,
      modelProviderSlug,
      modelKey,
      modelLabel,
      modelKind,
    });
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

export async function DELETE(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let postId: string | undefined;

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      if (body && typeof body.postId === "string") postId = body.postId;
    } else {
      const url = new URL(req.url);
      const qp = url.searchParams.get("postId");
      if (qp) postId = qp;
    }

    if (!postId) {
      return NextResponse.json(
        { ok: false, error: "Missing postId" },
        { status: 400 }
      );
    }

    const result = await deletePosts(postId);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Failed to delete post" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
