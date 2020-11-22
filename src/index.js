require("dotenv").config();

const { ApolloServer } = require("apollo-server");

const jwt = require("jsonwebtoken");
const User = require("./models/user-model");
const appSchema = require("./schema");
const resolvers = require("./resolvers");

const connectDB = require("./config/db");
connectDB();

const server = new ApolloServer({
  typeDefs: [appSchema],
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith("bearer")) {
      const decodedToken = jwt.verify(
        auth.substring(7),
        process.env.JWT_SECRET
      );
      const currentUser = await User.findById(decodedToken.userId).populate(
        "books"
      );
      return { currentUser };
    }
  },
});

server
  .listen({ port: process.env.PORT || 4000 })
  .then(({ url, subscriptionsUrl }) => {
    console.log(`Server ready at ${url}`);
    console.log(`Subscriptions ready at ${subscriptionsUrl}`);
  });
