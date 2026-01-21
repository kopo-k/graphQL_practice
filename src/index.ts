import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

// GraphQL スキーマ定義
const typeDefs = `#graphql
  type Todo {
    id: Int!
    title: String!
    completed: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    todos: [Todo!]!
    todo(id: Int!): Todo
  }

  type Mutation {
    createTodo(title: String!): Todo!
    updateTodo(id: Int!, title: String, completed: Boolean): Todo
    deleteTodo(id: Int!): Todo
  }
`;

// リゾルバー
const resolvers = {
  Query: {
    todos: async () => {
      return await prisma.todo.findMany({
        orderBy: { createdAt: "desc" },
      });
    },
    todo: async (_: unknown, args: { id: number }) => {
      return await prisma.todo.findUnique({
        where: { id: args.id },
      });
    },
  },
  Mutation: {
    createTodo: async (_: unknown, args: { title: string }) => {
      return await prisma.todo.create({
        data: { title: args.title },
      });
    },
    updateTodo: async (
      _: unknown,
      args: { id: number; title?: string; completed?: boolean }
    ) => {
      return await prisma.todo.update({
        where: { id: args.id },
        data: {
          ...(args.title !== undefined && { title: args.title }),
          ...(args.completed !== undefined && { completed: args.completed }),
        },
      });
    },
    deleteTodo: async (_: unknown, args: { id: number }) => {
      return await prisma.todo.delete({
        where: { id: args.id },
      });
    },
  },
};

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  await server.start();

  // 静的ファイル配信
  app.use(express.static(path.join(__dirname, "../public")));

  // GraphQL エンドポイント
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server)
  );

  const PORT = 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);
