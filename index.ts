import { Database } from "bun:sqlite";

const db = new Database(":memory:");
const random = "substr(lower(hex(randomblob(4))), 1, 8)";
db.run(`
    CREATE TABLE IF NOT EXISTS paste (
        id TEXT PRIMARY KEY DEFAULT (${random}),
        content TEXT
    )
`)

class Paste {
    id: string | undefined;
    content: string | undefined;
}

const server = Bun.serve({
    routes: {
        "/": {
            GET: async (req) => {
                const pastes = db.query(`SELECT * FROM paste`)
                    .as(Paste).all()
                    .map(paste => new URL(String(paste.id), req.url));

                return new Response(pastes.join("\n"), { headers: { "Content-Type": "text/plain" } });
            },
            POST: async (req) => {
                const content = await req.text();
                if (!content) throw { message: "No content", errno: 400 };

                const id = db
                    .prepare(`INSERT INTO paste (content) VALUES (?) RETURNING id`)
                    .as(Paste).get(content)?.id;

                return Response.json({ id });
            }
        },
        "/:id": {
            GET: async (req) => {
                const { id } = req.params;
                const paste = db
                    .query(`SELECT * FROM paste WHERE id = ?`)
                    .as(Paste).get(id);

                if (!paste) throw { message: "Not found", errno: 404 };

                return new Response(paste.content, { headers: { "Content-Type": "text/plain" } });
            }
        }
    },
    error(err) {
        return new Response(err.message, { status: err.errno || 500 });
    }
})

console.log(`🚀 Server running on ${server.url}`)