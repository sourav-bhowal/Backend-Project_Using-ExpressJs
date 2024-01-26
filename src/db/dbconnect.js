import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        const connectedDB = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\n MONGODB Connected !! DB HOST: ${connectedDB.connection.host}`);
    } 
    catch (error) {
       console.log("\n MONGODB connection ERROR.\n", error); 
       process.exit(1);
    }
}

export default connectDB;