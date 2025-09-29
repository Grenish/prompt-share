// mdx-components.tsx
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
        ? "mt-2 scroll-mt-28 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100"
        : level === 2
        ? "mt-10 scroll-mt-28 border-b border-gray-200 dark:border-gray-800 pb-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 first:mt-0"
        : level === 3
        ? "mt-8 scroll-mt-28 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100"
        : level === 4
        ? "mt-8 scroll-mt-28 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100"
        : level === 5
        ? "mt-8 scroll-mt-28 text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100"
        : "mt-8 scroll-mt-28 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100";

    return (
      <Tag id={anchor} className={cn(base, className)} {...props}>
        <a
          href={`#${anchor}`}
          className="group inline-block align-baseline"
          aria-label={text}
        >
          {children}
          <span className="ml-2 text-gray-300 transition-opacity group-hover:opacity-100 opacity-0 dark:text-gray-600">
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
    "font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300";

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
        "leading-7 text-gray-700 dark:text-gray-300 [&:not(:first-child)]:mt-6",
        className
      )}
      {...props}
    />
  );
}

function Ul(props: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("my-6 ml-6 list-disc", props.className)} {...props} />
  );
}

function Ol(props: React.HTMLAttributes<HTMLOListElement>) {
  return (
    <ol className={cn("my-6 ml-6 list-decimal", props.className)} {...props} />
  );
}

function Li(props: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li className={cn("mt-2", props.className)} {...props} />;
}

function Blockquote({
  className,
  ...props
}: React.QuoteHTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className={cn(
        "mt-6 border-l-4 border-gray-200 dark:border-gray-800 pl-6 italic text-gray-600 dark:text-gray-400",
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
        "my-8 border-gray-200 dark:border-gray-800",
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
          "relative rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 font-mono text-sm text-gray-800 dark:text-gray-100",
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
        "my-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-4",
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
  return (
    <div className="my-6 w-full overflow-x-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30",
        props.className
      )}
      {...props}
    />
  );
}

function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={props.className} {...props} />;
}

function Tr(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-gray-100 dark:border-gray-900/40 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/40",
        props.className
      )}
      {...props}
    />
  );
}

function Th(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 px-4 text-left align-middle font-medium text-gray-900 dark:text-gray-100",
        props.className
      )}
      {...props}
    />
  );
}

function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("p-4 align-middle", props.className)} {...props} />;
}

function Strong(props: React.HTMLAttributes<HTMLElement>) {
  return <strong className={cn("font-semibold", props.className)} {...props} />;
}

function Em(props: React.HTMLAttributes<HTMLElement>) {
  return <em className={cn("italic", props.className)} {...props} />;
}

function Kbd(props: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-0.5 font-mono text-xs shadow-sm text-gray-700 dark:text-gray-200",
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
        "my-6 rounded-lg border border-gray-200 dark:border-gray-800 p-4 open:bg-gray-50 dark:open:bg-gray-900/30",
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
        "cursor-pointer font-medium text-gray-900 dark:text-gray-100",
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
          "my-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30",
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
        "my-6 max-w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30",
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
