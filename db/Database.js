import mongoose from "mongoose";

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URL, {
    })
    .then((data) => {
      console.log(`mongodb connected with server: ${data.connection.host}`);
    });
};

export default connectDatabase;