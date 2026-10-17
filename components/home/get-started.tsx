import Link from 'next/link'

const CODE = 'block overflow-x-auto border border-dashed border-border bg-background p-3 text-[11px] leading-relaxed text-foreground select-all'
const LINK = 'text-foreground underline underline-offset-4 hover:text-muted-foreground'

export function GetStarted() {
  return (
    <section id="get-started" aria-labelledby="get-started-heading" className="mx-auto w-full max-w-6xl scroll-mt-6 px-4 pb-12 sm:px-6">
      <div className="mb-5 space-y-2 border-t border-dashed border-border pt-8">
        <h2 id="get-started-heading" className="text-sm tracking-widest uppercase">Make your first ASCII animation</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">Try a ready-made scene, describe an idea to your coding agent, or add ASCII to your app.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="min-w-0 space-y-4 border border-border p-4">
          <h3 className="text-sm font-medium">Try it in your browser</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">Start with a live koi pond. No install or AI setup needed.</p>
          <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
            <li><Link href="/studio#w=koi" className={LINK}>Open the koi pond</Link>.</li>
            <li>Change the colours, light or motion in the side panel.</li>
            <li>Use Export → Share link or PNG to keep your creation.</li>
          </ol>
        </article>
        <article className="min-w-0 space-y-4 border border-border p-4">
          <h3 className="text-sm font-medium">Create with your coding agent</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">Install the ohmyascii skill from <a href="https://skills.sh" className={LINK}>skills.sh</a>. Run this in your project folder and select Claude Code or Codex.</p>
          <code className={CODE}>bunx skills add TimMikeladze/ohmyascii --skill ohmyascii</code>
          <p className="text-xs leading-relaxed text-muted-foreground">Add <code>-g</code> for all projects. You can also use <code>npx</code> instead of <code>bunx</code>.</p>
          <p className="text-xs leading-relaxed text-muted-foreground">Use <code>/ohmyascii</code> in Claude Code or <code>$ohmyascii</code> in Codex, followed by your idea:</p>
          <code className={CODE}>Create a moonlit koi pond in ascii/pond.ascii.json</code>
          <p className="text-xs leading-relaxed text-muted-foreground">In desktop Chrome or Edge, open Studio → Folder (agents) → Open folder and choose the output folder. Select your piece to preview it live.</p>
          <p className="text-xs leading-relaxed text-muted-foreground">The skill provides instructions and templates. For agent-rendered previews, it also needs the renderer checkout or a configured ohmyascii MCP server.</p>
          <a href="https://github.com/TimMikeladze/ohmyascii#install-the-skill-in-another-project" className={`inline-block text-xs ${LINK}`}>Agent setup and local preview guide</a>
        </article>
        <article className="min-w-0 space-y-4 border border-border p-4">
          <h3 className="text-sm font-medium">Add it to your React app</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">Run this in your shadcn project to install the component and renderer.</p>
          <code className={CODE}>npx shadcn@latest add https://ohmyascii.vercel.app/r/ohmyascii.json</code>
          <p className="text-xs leading-relaxed text-muted-foreground">Make something in the studio, then choose Export → React code and paste it into your app.</p>
          <a href="https://github.com/TimMikeladze/ohmyascii#install-with-the-shadcn-cli" className={`inline-block text-xs ${LINK}`}>Component usage and full editor install</a>
        </article>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Want to run the studio locally? <a href="https://github.com/TimMikeladze/ohmyascii#run-locally" className={LINK}>Clone the repo and start with Bun</a>.
      </p>
    </section>
  )
}
