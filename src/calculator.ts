import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const server = new McpServer({
  name: "Calculator Server",
  version: "1.0.0"
});

let transport: SSEServerTransport;

interface CalculatorParams {
  operation: "add" | "subtract" | "multiply" | "divide";
  a: number;
  b: number;
}

// 計算機能の実装
server.tool("calculator", {
  operation: z.enum(["add", "subtract", "multiply", "divide"]),
  a: z.number(),
  b: z.number()
}, async (args: CalculatorParams) => {
  let result: number = 0;

  switch (args.operation) {
    case "add":
      result = args.a + args.b;
      break;
    case "subtract":
      result = args.a - args.b;
      break;
    case "multiply":
      result = args.a * args.b;
      break;
    case "divide":
      if (args.b === 0) {
        throw new Error("0で除算することはできません");
      }
      result = args.a / args.b;
      break;
  }

  return {
    content: [{
      type: "text",
      text: String(result)
    }]
  };
});

app.get("/sse", async (req, res) => {

  console.log("Received connection");

  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);

  req.on("close", async () => {
    await server.close();
  });
});


app.post("/message", async (req, res) => {
  console.log("Received message");
  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 8083;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 