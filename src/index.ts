import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { PrismaClient } from "@prisma/client";

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

// リゾルバー（GraphQLの各操作の実装）
const resolvers = {
  Query: {
    // 全てのTodoを取得
    todos: async () => {
      return await prisma.todo.findMany({
        orderBy: { createdAt: "desc" },
      });
    },
    // IDでTodoを取得
    todo: async (_: unknown, args: { id: number }) => {
      return await prisma.todo.findUnique({
        where: { id: args.id },
      });
    },
  },
  Mutation: {
    // 新しいTodoを作成
    createTodo: async (_: unknown, args: { title: string }) => {
      return await prisma.todo.create({
        data: { title: args.title },
      });
    },
    // Todoを更新
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
    // Todoを削除
    deleteTodo: async (_: unknown, args: { id: number }) => {
      return await prisma.todo.delete({
        where: { id: args.id },
      });
    },
  },
};

// サーバー起動
async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀 Server ready at ${url}`);
}

startServer().catch(console.error);
