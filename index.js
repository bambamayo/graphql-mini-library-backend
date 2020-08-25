const { ApolloServer, gql } = require("apollo-server");
const { v4: uuidv4 } = require("uuid");

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
    author: String!
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
    bookCount: () => books.length,
    authorCount: () => authors.length,
    allBooks: (parent, args) => {
      if (args.author && args.genre) {
        return books
          .filter(
            (book) => book.author.toLowerCase() === args.author.toLowerCase()
          )
          .filter((book) => book.genres.includes(args.genre.toLowerCase()));
      }
      if (args.author) {
        return books.filter(
          (book) => book.author.toLowerCase() === args.author.toLowerCase()
        );
      }
      if (args.genre) {
        return books.filter((book) =>
          book.genres.includes(args.genre.toLowerCase())
        );
      }
      return books;
    },
    allAuthors: () => authors,
  },

  Author: {
    bookCount: (parent, args) => {
      let authored = books.filter((book) => book.author === parent.name);
      return authored.length;
    },
  },

  Mutation: {
    addBook: (parent, args) => {
      let newBook = {
        ...args.data,
        id: uuidv4(),
      };
      let authorPresent = authors.find(
        (author) => author.name.toLowerCase() === args.data.author.toLowerCase()
      );
      if (!authorPresent) {
        let newAuthor = {
          name: args.data.author,
          id: uuidv4(),
        };
        authors = authors.concat(newAuthor);
      }
      books = books.concat(newBook);
      return newBook;
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
