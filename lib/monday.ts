
export async function mondayQuery(query: string, variables?: Record<string, any>) {
  try {
    const res = await fetch("/api/monday", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.data;
  } catch (e: any) {
    console.error("Monday.com error:", e.message);
    return null;
  }
}

// Get all boards
export async function getBoards() {
  const data = await mondayQuery(`{ boards(limit: 50) { id name state board_kind items_count columns { id title type } groups { id title } } }`);
  return data?.boards || [];
}

// Get board items
export async function getBoardItems(boardId: string, limit = 100) {
  const data = await mondayQuery(`query($boardId: [ID!]!) { boards(ids: $boardId) { name items_page(limit: ${limit}) { items { id name group { title } column_values { id text value column { title } } } } } }`, { boardId: [boardId] });
  return data?.boards?.[0] || null;
}

// Get specific board by name (searches all boards)
export async function findBoardByName(name: string) {
  const boards = await getBoards();
  return boards.find((b: any) => b.name.toLowerCase().includes(name.toLowerCase()));
}

// Parse column values into a clean object
export function parseItem(item: any): Record<string, any> {
  const result: Record<string, any> = { id: item.id, name: item.name, group: item.group?.title || "" };
  (item.column_values || []).forEach((col: any) => {
    const key = col.column?.title || col.id;
    result[key] = col.text || "";
  });
  return result;
}
