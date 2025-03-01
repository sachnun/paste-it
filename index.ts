import { sql } from "bun";
import { format } from "timeago.js";

await sql`
    CREATE TABLE IF NOT EXISTS paste (
        id TEXT PRIMARY KEY DEFAULT substring(md5(random()::text), 1, 8),
        content TEXT,
        created_at TIMESTAMP DEFAULT now()
    )
`

interface Paste {
    id: string;
    content: string;
    created_at: Date;
}

const server = Bun.serve({
    routes: {
        "/": {
            GET: async (req) => {
                const rows = await sql`SELECT id, created_at FROM paste`;
                const pastes = rows.map((paste: Paste) => {
                    return `${new URL(paste.id, req.url)} (${format(paste.created_at)})`
                });

                return new Response(pastes.join("\n"), { headers: { "Content-Type": "text/plain" } });
            },
            POST: async (req) => {
                const content = await req.text();
                if (!content) throw { message: "No content", errno: 400 };

                const [{ id }] = await sql`INSERT INTO paste (content) VALUES (${content}) RETURNING id`;

                return new Response(new URL(String(id), req.url).toString(), { status: 201 });
            }
        },
        "/:id": {
            GET: async (req) => {
                const { id } = req.params;
                const [{ content }] = await sql`SELECT content FROM paste WHERE id = ${id}`;
                if (!content) throw { message: "Not found", errno: 404 };

                return new Response(content, { headers: { "Content-Type": "text/plain" } });
            }
        }
    },
    error(err) {
        return new Response(err.message, { status: err.errno || 500 });
    }
})

console.log(`🚀 Server running on ${server.url}`)