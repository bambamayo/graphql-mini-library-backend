const { gql } = require("apollo-server");

module.exports = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
    postedBy: User!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }

  type User {
    fullname: String!
    username: String!
    favoriteGenre: String!
    id: ID!
    books: [Book!]!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(data: CreateNewBookInput): Book!
    editAuthor(id: ID!, setBornTo: Int!): Author
    createUser(
      username: String!
      favoriteGenre: String
      password: String!
      fullname: String!
    ): User
    login(username: String!, password: String!): Token
  }

  input CreateNewBookInput {
    title: String!
    published: Int!
    genres: [String!]!
    author: String!
  }
`;
