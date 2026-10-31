import express from "express"
import { MongoClient } from 'mongodb';
import dotenv from "dotenv"
dotenv.config();
const app = express()
const port = process.env.PORT || 5000

app.get('/', (req, res) => {
    res.send({ message: 'Api Is Running' })
})

const client = new MongoClient(process.env.MONGODB_URL)
export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}
const db = client.db("TogetherWeCan")
const collecttion = db.collection("upcomingEvents")

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})