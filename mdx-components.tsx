import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-+/g, "-");
}

function nodeToString(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToString).join("");
  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>; // children may be undefined
    return nodeToString(el.props?.children);
  }
  return "";
}

function Heading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const Tag = `h${level}` as unknown as React.ElementType;

  return function H({
    children,
    id,
    className,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) {
    const text = nodeToString(children);
    const anchor = id || slugify(text);

    const base =
      level === 1
        ? "mt-2 scroll-mt-28 text-4xl font-bold tracking-tight leading-tight text-gray-900 dark:text-gray-50"
        : level === 2
        ? "mt-12 scroll-mt-28 border-b border-gray-200 dark:border-gray-800 pb-3 text-3xl font-semibold tracking-tight leading-tight text-gray-900 dark:text-gray-50 first:mt-0"
        : level === 3
        ? "mt-10 scroll-mt-28 text-2xl font-semibold tracking-tight leading-snug text-gray-900 dark:text-gray-100"
        : level === 4
        ? "mt-8 scroll-mt-28 text-xl font-semibold tracking-tight leading-snug text-gray-900 dark:text-gray-100"
        : level === 5
        ? "mt-8 scroll-mt-28 text-lg font-semibold tracking-tight leading-snug text-gray-900 dark:text-gray-100"
        : "mt-8 scroll-mt-28 text-base font-semibold tracking-tight leading-snug text-gray-900 dark:text-gray-100";

    return (
      <Tag id={anchor} className={cn(base, className)} {...props}>
        <a
          href={`#${anchor}`}
          className="group inline-block align-baseline"
          aria-label={text}
        >
          {children}
          <span className="ml-2 text-gray-400 transition-all duration-200 group-hover:opacity-100 opacity-0 dark:text-gray-500">
            #
          </span>
        </a>
      </Tag>
    );
  };
}

function A({
  href = "",
  className,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal =
    /^https?:\/\//.test(href) ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:");

  const base =
    "font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-4 transition-all duration-200 hover:text-blue-700 hover:decoration-blue-700/50 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:text-blue-300 dark:hover:decoration-blue-300/50";

  if (!href) {
    return (
      <a className={cn(base, className)} {...props}>
        {children}
      </a>
    );
  }

  if (isExternal) {
    return (
      <a
        href={href}
        className={cn(base, className)}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cn(base, className)} {...(props as any)}>
      {children}
    </Link>
  );
}

function P({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "leading-relaxed text-base text-gray-700 dark:text-gray-300 [&:not(:first-child)]:mt-6",
        className
      )}
      {...props}
    />
  );
}

function Ul(props: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={cn("my-6 ml-6 list-disc space-y-2", props.className)}
      {...props}
    />
  );
}

function Ol(props: React.HTMLAttributes<HTMLOListElement>) {
  return (
    <ol
      className={cn("my-6 ml-6 list-decimal space-y-2", props.className)}
      {...props}
    />
  );
}

function Li(props: React.LiHTMLAttributes<HTMLLIElement>) {
  return (
    <li
      className={cn(
        "leading-relaxed text-gray-700 dark:text-gray-300",
        props.className
      )}
      {...props}
    />
  );
}

function Blockquote({
  className,
  ...props
}: React.QuoteHTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className={cn(
        "mt-6 border-l-4 border-blue-500/20 dark:border-blue-400/20 bg-blue-50/50 dark:bg-blue-900/10 pl-6 pr-4 py-4 italic text-gray-700 dark:text-gray-400 rounded-r-lg",
        className
      )}
      {...props}
    />
  );
}

function Hr(props: React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={cn(
        "my-10 border-gray-200 dark:border-gray-800",
        props.className
      )}
      {...props}
    />
  );
}

function Code({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const isInline = !className || !/language-/.test(className);
  if (isInline) {
    return (
      <code
        className={cn(
          "relative rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-1 font-mono text-[0.875em] text-gray-800 dark:text-gray-200",
          className
        )}
        {...props}
      />
    );
  }
  return <code className={className} {...props} />;
}

function Pre({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <pre
      className={cn(
        "my-8 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-5 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  // Wrapper provides border, radius, shadow and horizontal scrolling
  return (
    <div className="my-8 w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <table
        {...props}
        className={cn(
          // separate + spacing-0 lets us round header corners cleanly
          "w-full border-separate border-spacing-0 table-auto",
          "text-sm leading-6",
          className
        )}
      />
    </div>
  );
}

function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      {...props}
      className={cn(
        // distinct header background
        "bg-gray-50 dark:bg-gray-900/50",
        props.className
      )}
    />
  );
}

function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      {...props}
      className={cn(
        // zebra stripes only for body rows
        "odd:[&_tr]:bg-white even:[&_tr]:bg-gray-50/60 dark:odd:[&_tr]:bg-transparent dark:even:[&_tr]:bg-gray-900/30",
        props.className
      )}
    />
  );
}

function Tr(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={cn(
        // subtle hover across rows
        "transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-900/40",
        // row dividers (bottom border)
        "border-b border-gray-200 dark:border-gray-800 last:border-0",
        props.className
      )}
    />
  );
}

function Th(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={cn(
        // spacing
        "px-6 py-3",
        // alignment/typography
        "text-left text-xs font-semibold uppercase tracking-wide",
        "text-gray-700 dark:text-gray-300",
        // header bottom border
        "border-b border-gray-200 dark:border-gray-800",
        // rounded header corners (first/last th)
        "first:rounded-tl-xl last:rounded-tr-xl",
        // keep header above body on scroll inside container
        "sticky top-0 z-10",
        // ensure sticky header keeps its background
        "bg-gray-50 dark:bg-gray-900/50",
        // prevent awkward wrapping for short headers
        "whitespace-nowrap",
        props.className
      )}
      scope={props.scope ?? "col"}
    />
  );
}

function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={cn(
        // spacing
        "px-6 py-4",
        // content alignment and typography
        "align-top text-gray-700 dark:text-gray-300",
        // wrap long content nicely
        "whitespace-normal break-words",
        // subtle row borders
        "border-b border-gray-200 dark:border-gray-800 last:border-0",
        props.className
      )}
    />
  );
}

// Optional: if you use <caption>, this styles it nicely
function Caption(props: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      {...props}
      className={cn(
        "caption-bottom mt-3 text-sm text-gray-500 dark:text-gray-400",
        props.className
      )}
    />
  );
}

function Strong(props: React.HTMLAttributes<HTMLElement>) {
  return (
    <strong
      className={cn(
        "font-semibold text-gray-900 dark:text-gray-100",
        props.className
      )}
      {...props}
    />
  );
}

function Em(props: React.HTMLAttributes<HTMLElement>) {
  return <em className={cn("italic", props.className)} {...props} />;
}

function Kbd(props: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-2 py-1 font-mono text-xs font-medium shadow-sm text-gray-800 dark:text-gray-200",
        props.className
      )}
      {...props}
    />
  );
}

function Details(props: React.DetailsHTMLAttributes<HTMLDetailsElement>) {
  return (
    <details
      className={cn(
        "my-6 rounded-xl border border-gray-200 dark:border-gray-800 p-5 transition-all duration-200 open:bg-gray-50 dark:open:bg-gray-900/30 open:shadow-sm",
        props.className
      )}
      {...props}
    />
  );
}

// FIX: Summary uses generic HTMLAttributes — SummaryHTMLAttributes does not exist in React types
function Summary(props: React.HTMLAttributes<HTMLElement>) {
  return (
    <summary
      className={cn(
        "cursor-pointer font-medium text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 select-none",
        props.className
      )}
      {...props}
    />
  );
}

function Img(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { src = "", alt = "", width, height, className, ...rest } = props;
  const w = typeof width === "string" ? parseInt(width, 10) : width;
  const h = typeof height === "string" ? parseInt(height, 10) : height;

  if (src && w && h) {
    return (
      <Image
        src={src}
        alt={alt}
        width={w}
        height={h}
        className={cn(
          "my-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 shadow-sm",
          className
        )}
        {...(rest as any)}
      />
    );
  }

  // Fallback when dimensions are unknown
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn(
        "my-8 max-w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 shadow-sm",
        className
      )}
      {...rest}
    />
  );
}

const baseComponents: MDXComponents = {
  // Headings with anchor links
  h1: Heading(1),
  h2: Heading(2),
  h3: Heading(3),
  h4: Heading(4),
  h5: Heading(5),
  h6: Heading(6),

  // Typography
  p: P,
  strong: Strong,
  em: Em,
  blockquote: Blockquote,
  hr: Hr,

  // Lists
  ul: Ul,
  ol: Ol,
  li: Li,

  // Links and media
  a: A,
  img: Img,

  // Code
  pre: Pre,
  code: Code,

  // Tables
  table: Table,
  thead: THead,
  tbody: TBody,
  tr: Tr,
  th: Th,
  td: Td,
  caption: Caption,

  // Extras
  kbd: Kbd,
  details: Details,
  summary: Summary,
};

// Merge with any components passed from MDXProvider (if you use one)
export function useMDXComponents(
  components: MDXComponents = {}
): MDXComponents {
  return {
    ...baseComponents,
    ...components,
  };
}

export default baseComponents;
