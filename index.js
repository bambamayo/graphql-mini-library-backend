require("dotenv").config();

const { ApolloServer, gql, UserInputError } = require("apollo-server");
const { v4: uuidv4 } = require("uuid");
const Book = require("./models/book-model");
const Author = require("./models/author-model");

const connectDB = require("./config/db");

connectDB();

let authors = [
  {
    name: "Robert Martin",
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: "Martin Fowler",
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963,
  },
  {
    name: "Fyodor Dostoevsky",
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821,
  },
  {
    name: "Joshua Kerievsky", // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  {
    name: "Sandi Metz", // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
];

let books = [
  {
    title: "Clean Code",
    published: 2008,
    author: "Robert Martin",
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring"],
  },
  {
    title: "Agile software development",
    published: 2002,
    author: "Robert Martin",
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ["agile", "patterns", "design"],
  },
  {
    title: "Refactoring, edition 2",
    published: 2018,
    author: "Martin Fowler",
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring"],
  },
  {
    title: "Refactoring to patterns",
    published: 2008,
    author: "Joshua Kerievsky",
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring", "patterns"],
  },
  {
    title: "Practical Object-Oriented Design, An Agile Primer Using Ruby",
    published: 2012,
    author: "Sandi Metz",
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring", "design"],
  },
  {
    title: "Crime and punishment",
    published: 1866,
    author: "Fyodor Dostoevsky",
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ["classic", "crime"],
  },
  {
    title: "The Demon ",
    published: 1872,
    author: "Fyodor Dostoevsky",
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ["classic", "revolution"],
  },
];

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook(data: CreateNewBookInput): Book!
    editAuthor(name: String!, setBornTo: Int!): Author
  }

  input CreateNewBookInput {
    title: String!
    author: String!
    published: Int!
    genres: [String!]!
  }
`;

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: (parent, args) => {
      if (!args.author || args.genre) {
        return Book.find({});
      }
      if (args.genre) {
        return Book.find({ genre: { $in: [args.genre] } });
      }
    },
    allAuthors: () => Author.find({}),
  },

  Author: {
    bookCount: (parent, args) =>
      Book.countDocuments({ "author.name": parent.name }),
  },

  Mutation: {
    addBook: async (parent, args) => {
      const newBook = new Book({ ...args.data });

      let authorPresent = Author.find({ name: args.data.author.name });

      if (!authorPresent) {
        let newAuthor = new Author({ name: args.data.author.name });

        try {
          await newAuthor.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          });
        }
      }

      try {
        newBook.save();
        return newBook;
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
    },

    editAuthor: (parent, args) => {
      let authorPresent = authors.find(
        (author) => author.name.toLowerCase() === args.name.toLowerCase()
      );

      if (!authorPresent) {
        return null;
      }

      let modAuthor = { ...authorPresent, born: args.setBornTo };
      authors = authors.map((author) =>
        author.name.toLowerCase() === args.name.toLowerCase()
          ? modAuthor
          : author
      );
      return modAuthor;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
