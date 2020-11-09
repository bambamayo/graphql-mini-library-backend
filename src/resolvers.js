const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError, PubSub } = require("apollo-server");
const Book = require("./models/book-model");
const Author = require("./models/author-model");
const User = require("./models/user-model");

const pubsub = new PubSub();

const resolvers = {
  Query: {
    me: (root, args, context) => context.currentUser,
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: (parent, args) => {
      if (!args.author && !args.genre) {
        return Book.find({}).populate("author postedBy");
      }
      if (args.genre) {
        return Book.find({ genres: { $in: [args.genre] } }).populate("author");
      }
    },
    allAuthors: () => Author.find({}),
  },

  Author: {
    bookCount: async (parent, args) => {
      let authoredBooks = await Book.find({ author: parent.id });
      return authoredBooks.length;
    },
  },

  Mutation: {
    addBook: async (parent, args, context) => {
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new AuthenticationError("Not authenticated");
      }
      //Check if author is present
      const authorPresent = await Author.findOne({
        name: args.data.author,
      });

      //Check if any book in the database has this title
      const bookTitleExist = await Book.findOne({ title: args.data.title });

      //if title exist, throw error
      if (bookTitleExist) {
        throw new UserInputError("This book is already saved", {
          invalidArgs: args.data.title,
        });
      }

      if (args.data.title.length < 2) {
        throw new UserInputError("Book title must have a minimum length of 2", {
          invalidArgs: args.data.title,
        });
      }

      //If author does not exist, create new author and save both author and new book
      if (!authorPresent) {
        //Check if author's name is > 3
        if (args.data.author.length < 4) {
          throw new UserInputError(
            "Author's name must have a minimum length of 4"
          );
        }
        const newAuthor = new Author({ name: args.data.author });
        try {
          await newAuthor.save();
        } catch (error) {
          throw new Error("Could not save new author, please try again");
        }

        const newBook = new Book({
          ...args.data,
          postedBy: currentUser.id,
          author: newAuthor.id,
        });
        try {
          const sess = await mongoose.startSession();
          sess.startTransaction();
          await newBook.save({ session: sess });
          currentUser.books.push(newBook);
          await currentUser.save({ session: sess });
          await sess.commitTransaction();
          return newBook;
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          });
        }
      }

      try {
        const newBook = new Book({
          ...args.data,
          postedBy: currentUser.id,
          author: authorPresent.id,
        });
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await newBook.save({ session: sess });
        newBook.populate("author").execPopulate();
        currentUser.books.push(newBook);
        await currentUser.save({ session: sess });
        await sess.commitTransaction();

        pubsub.publish("BOOK_ADDED", { bookAdded: newBook });
        return newBook;
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
    },

    editAuthor: async (parent, args, context) => {
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new AuthenticationError("Not authenticated");
      }
      //Check if author exist
      let authorPresent = await Author.findOne({ name: args.name });

      if (!authorPresent) {
        return null;
      }

      try {
        const author = await Author.findByIdAndUpdate(
          authorPresent.id,
          { born: args.setBornTo },
          { new: true }
        );

        pubsub.publish("AUTHOR_EDITED", { authorEdited: author });
        return author;
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
    },

    createUser: async (parent, args) => {
      let usernameTaken;
      try {
        usernameTaken = await User.findOne({ username: args.username });
      } catch (error) {
        throw new Error("Signing up failed please try again later");
      }

      if (usernameTaken) {
        throw new UserInputError("username taken", {
          invalidArgs: args.username,
        });
      }

      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(args.password, 12);
      } catch (error) {
        throw new Error("Could not create new user, please try again");
      }

      const createdUser = new User({
        ...args,
        password: hashedPassword,
      });

      try {
        await createdUser.save();
      } catch (error) {
        throw new Error("Could not create new user, please try again");
      }

      let token;
      try {
        token = jwt.sign({ userId: createdUser.id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });
      } catch (error) {
        throw new Error("Could not create new user, please try again");
      }

      return {
        token,
        user: createdUser,
      };
    },

    login: async (parent, args) => {
      let existingUser;

      try {
        existingUser = await User.findOne({ username: args.username });
      } catch (error) {
        throw new Error("Login failed, please try again");
      }

      if (!existingUser) {
        throw new UserInputError("Invalid username, could not log you in", {
          invalidArgs: args.username,
        });
      }

      let isValidPassword = false;
      try {
        isValidPassword = await bcrypt.compare(
          args.password,
          existingUser.password
        );
      } catch (error) {
        throw new Error("Could not log you in, please try again");
      }

      if (!isValidPassword) {
        throw new UserInputError("Invalid password, could not log you n", {
          invalidArgs: args.password,
        });
      }

      let token;
      try {
        token = jwt.sign({ userId: existingUser.id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });
      } catch (error) {
        throw new Error("Log in failed, please try again");
      }

      return { token, user: existingUser };
    },
  },

  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"]),
    },
    authorEdited: {
      subscribe: () => pubsub.asyncIterator(["AUTHOR_EDITED"]),
    },
  },
};

module.exports = resolvers;
