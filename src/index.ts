import { sql } from "bun";
import { format } from "timeago.js";
import index from "./index.html";

const random = sql`substring(md5(random()::text), 1, 8)`.raw()
await sql`
    CREATE TABLE IF NOT EXISTS paste (
        id TEXT PRIMARY KEY DEFAULT ${random},
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
        "/": index,
        "/save": {
            POST: async (req) => {
                const content = await req.text();
                if (!content) throw { message: "No content", errno: 400 };

                const [{ id }] = await sql`INSERT INTO paste (content) VALUES (${content}) RETURNING id`;

                return new Response(new URL(id, req.url).toString(), { status: 201 });
            }
        },
        "/:id": {
            GET: async (req) => {
                const { id } = req.params;
                const [content] = await sql`SELECT content, created_at FROM paste WHERE id = ${id}`;
                if (!content) throw { message: "Not found", errno: 404 };

                return new Response(content.content, {
                    headers: {
                        "Content-Type": "text/plain",
                        "Created": format(content.created_at)
                    }
                });
            }
        },
    },
    error(err) {
        return new Response(err.message, { status: err.errno || 500 });
    }
})

console.log(`🚀 Server running on ${server.url}`)